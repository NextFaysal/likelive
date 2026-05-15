"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Video, Radio, Monitor, Trash2 } from "lucide-react"
import type { RoomType, RoomStatus } from "@/types"

interface RoomCardProps {
  id: string
  name: string
  description?: string
  type: RoomType
  status: RoomStatus
  maxParticipants: number
  participantCount: number
  isRecording: boolean
  createdAt: string
  isHost: boolean
  onDelete: (roomId: string) => void
}

const typeIcons: Record<RoomType, React.ReactNode> = {
  ONE_TO_ONE: <Video className="h-4 w-4" />,
  BROADCAST: <Radio className="h-4 w-4" />,
  CONFERENCE: <Monitor className="h-4 w-4" />,
}

const typeLabels: Record<RoomType, string> = {
  ONE_TO_ONE: "1-to-1",
  BROADCAST: "Broadcast",
  CONFERENCE: "Conference",
}

const statusColors: Record<RoomStatus, string> = {
  WAITING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ACTIVE: "bg-green-500/20 text-green-400 border-green-500/30",
  ENDED: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}

export function RoomCard({
  id,
  name,
  description,
  type,
  status,
  maxParticipants,
  participantCount,
  isRecording,
  isHost,
  onDelete,
}: RoomCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(id)
    setShowConfirm(false)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Link href={`/room/${id}`} className="flex items-center gap-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              {typeIcons[type]}
              {name}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[status]}>{status}</Badge>
            {isRecording && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                REC
              </Badge>
            )}
            {isHost && status !== "ENDED" && !showConfirm && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {showConfirm && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                  onClick={handleConfirmDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-slate-400 hover:text-white hover:bg-white/10 text-xs"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <Link href={`/room/${id}`}>
        <CardContent>
          {description && (
            <p className="text-sm text-slate-400 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-purple-400 border-purple-500/30"
            >
              {typeLabels[type]}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-slate-400">
              <Users className="h-4 w-4" />
              {participantCount}/{maxParticipants}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
