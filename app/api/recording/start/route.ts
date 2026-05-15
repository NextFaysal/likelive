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
      { error: "Only the host can start recording" },
      { status: 403 },
    )
  }

  if (room.isRecording) {
    return NextResponse.json({ error: "Already recording" }, { status: 400 })
  }

  const r2Key = `recordings/${roomId}/${Date.now()}.mp4`

  // In production, use LiveKit EgressClient to start actual recording
  // const egressClient = new EgressClient(...)
  // const egressInfo = await egressClient.startRoomCompositeEgress(...)

  const recording = await prisma.recording.create({
    data: {
      roomId,
      userId: session.user.id,
      r2Key,
      status: "PROCESSING",
    },
  })

  await prisma.room.update({
    where: { id: roomId },
    data: { isRecording: true },
  })

  return NextResponse.json({ recording })
}
