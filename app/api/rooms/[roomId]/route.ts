import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await params

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { participants: { include: { user: true } } },
  })

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  return NextResponse.json({ room })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await params

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  })

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  if (room.hostId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the host can delete the room" },
      { status: 403 },
    )
  }

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "ENDED", endedAt: new Date() },
  })

  return NextResponse.json({ message: "Room ended" })
}
