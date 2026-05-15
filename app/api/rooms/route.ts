import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description, type, maxParticipants } = await req.json()

  if (!name) {
    return NextResponse.json(
      { error: "Room name is required" },
      { status: 400 },
    )
  }

  const livekitRoom = `room-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const room = await prisma.room.create({
    data: {
      name,
      description,
      type: type || "CONFERENCE",
      maxParticipants: maxParticipants || (type === "ONE_TO_ONE" ? 2 : 50),
      livekitRoom,
      hostId: session.user.id,
      status: "WAITING",
    },
    include: { participants: true },
  })

  // Auto-join host as participant
  await prisma.participant.create({
    data: {
      roomId: room.id,
      userId: session.user.id,
      role: "HOST",
    },
  })

  return NextResponse.json({ room }, { status: 201 })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rooms = await prisma.room.findMany({
    where: { status: { not: "ENDED" } },
    include: { participants: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ rooms })
}
