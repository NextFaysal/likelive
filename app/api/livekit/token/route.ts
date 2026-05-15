import { NextRequest, NextResponse } from "next/server"
import { generateToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await req.json()

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { participants: true },
  })

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  // 1-to-1 room: max 2 participants check
  if (room.type === "ONE_TO_ONE" && room.participants.length >= 2) {
    const isAlreadyInRoom = room.participants.some(
      (p) => p.userId === session.user.id,
    )
    if (!isAlreadyInRoom) {
      return NextResponse.json({ error: "Room is full" }, { status: 403 })
    }
  }

  const isHost = room.hostId === session.user.id
  const role = isHost
    ? "host"
    : room.type === "BROADCAST"
      ? "viewer"
      : "speaker"

  // Add participant if not already in room
  const existingParticipant = room.participants.find(
    (p) => p.userId === session.user.id,
  )

  if (!existingParticipant) {
    await prisma.participant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        role: isHost
          ? "HOST"
          : room.type === "BROADCAST"
            ? "VIEWER"
            : "SPEAKER",
      },
    })
  }

  // Update room status to active
  if (room.status === "WAITING") {
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "ACTIVE" },
    })
  }

  const token = await generateToken({
    roomName: room.livekitRoom,
    participantName: session.user.name || "Unknown",
    participantId: session.user.id,
    role,
  })

  return NextResponse.json({ token, livekitUrl: process.env.LIVEKIT_URL })
}
