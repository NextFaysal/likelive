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

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ messages })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomId } = await params
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      roomId,
      userId: session.user.id,
      content,
      type: "TEXT",
    },
    include: { user: { select: { name: true } } },
  })

  return NextResponse.json({ message }, { status: 201 })
}
