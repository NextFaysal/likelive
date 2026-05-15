import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await req.json()
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  if (room.hostId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the host can stop recording" },
      { status: 403 },
    )
  }

  // In production, use LiveKit EgressClient to stop recording
  // await egressClient.stopEgress(egressId)

  await prisma.recording.updateMany({
    where: { roomId, status: "PROCESSING" },
    data: { status: "READY", endedAt: new Date() },
  })

  await prisma.room.update({
    where: { id: roomId },
    data: { isRecording: false },
  })

  return NextResponse.json({ message: "Recording stopped" })
}
