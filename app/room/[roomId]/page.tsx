"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { SessionProvider, useSession } from "next-auth/react"
import { VideoRoom } from "./components/VideoRoom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Loader2, ArrowLeft } from "lucide-react"

interface RoomInfo {
  id: string
  name: string
  type: string
  status: string
  maxParticipants: number
  hostId: string
}

function RoomPageInner() {
  const params = useParams()
  const roomId = params.roomId as string
  const { data: session } = useSession()
  const [room, setRoom] = useState<RoomInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchRoomAndToken = async () => {
      try {
        // Fetch room details
        const roomRes = await fetch(`/api/rooms/${roomId}`)
        if (!roomRes.ok) {
          setError("Room not found")
          setLoading(false)
          return
        }
        const roomData = await roomRes.json()
        setRoom(roomData.room)

        // Fetch LiveKit token
        const tokenRes = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        })
        if (!tokenRes.ok) {
          const tokenData = await tokenRes.json()
          setError(tokenData.error || "Failed to get access token")
          setLoading(false)
          return
        }
        const tokenData = await tokenRes.json()
        setToken(tokenData.token)
      } catch (err) {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    if (session && roomId) {
      fetchRoomAndToken()
    }
  }, [session, roomId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-slate-400">Connecting to room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <Card className="border-white/10 bg-white/5 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-400">{error}</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="mt-4 bg-purple-600 hover:bg-purple-700 w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!room || !token) return null

  const isHost = room.hostId === session?.user?.id

  return (
    <div className="h-[100dvh] bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-12 sm:h-14 border-b border-white/10 flex items-center px-3 sm:px-4 justify-between bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Video className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
          <span className="font-semibold text-white truncate text-sm sm:text-base">{room.name}</span>
          <span className="text-xs text-slate-400 px-2 py-0.5 sm:py-1 rounded-full bg-white/5 flex-shrink-0">
            {room.type}
          </span>
        </div>
      </div>
      {/* Video area */}
      <div className="flex-1 min-h-0">
        <VideoRoom
          token={token}
          roomType={room.type as "ONE_TO_ONE" | "BROADCAST" | "CONFERENCE"}
          roomId={roomId}
          isHost={isHost}
        />
      </div>
    </div>
  )
}

export default function RoomPage() {
  return (
    <SessionProvider>
      <RoomPageInner />
    </SessionProvider>
  )
}
