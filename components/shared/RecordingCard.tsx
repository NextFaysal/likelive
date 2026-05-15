import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileVideo, HardDrive } from "lucide-react"
import type { RecordingStatus } from "@/types"

interface RecordingCardProps {
  id: string
  roomId: string
  roomName: string
  status: RecordingStatus
  duration?: number
  size?: number
  startedAt: string
}

const statusColors: Record<RecordingStatus, string> = {
  PROCESSING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  READY: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function RecordingCard({
  roomName,
  status,
  duration,
  size,
  startedAt,
}: RecordingCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <FileVideo className="h-4 w-4" />
            {roomName}
          </CardTitle>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            {formatDuration(duration)}
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <HardDrive className="h-4 w-4" />
            {formatSize(size)}
          </div>
          <div className="text-slate-400">
            {new Date(startedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
