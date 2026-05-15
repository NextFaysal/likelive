import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const recordings = await prisma.recording.findMany({
    where: { userId: session.user.id },
    include: { room: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
  })

  return NextResponse.json({ recordings })
}
