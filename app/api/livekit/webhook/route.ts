import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WebhookReceiver } from "livekit-server-sdk"

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!

const receiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  const rawBody = await req.text()

  // Verify LiveKit webhook signature using WebhookReceiver
  // This decodes the JWT and validates the signature
  let event
  try {
    event = await receiver.receive(rawBody, authHeader ?? "")
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    )
  }

  try {
    switch (event.event) {
      case "egress_ended": {
        await prisma.recording.updateMany({
          where: { r2Key: { contains: event.egressInfo?.roomName } },
          data: { status: "READY", endedAt: new Date() },
        })
        break
      }

      case "room_finished": {
        await prisma.room.updateMany({
          where: { livekitRoom: event.room?.name },
          data: { status: "ENDED", endedAt: new Date() },
        })
        break
      }

      case "participant_left": {
        const participant = await prisma.participant.findFirst({
          where: {
            userId: event.participant?.identity,
            leftAt: null,
          },
        })
        if (participant) {
          await prisma.participant.update({
            where: { id: participant.id },
            data: { leftAt: new Date() },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    )
  }
}
