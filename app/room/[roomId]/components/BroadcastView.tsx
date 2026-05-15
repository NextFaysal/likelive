"use client"

import {
  useTracks,
  useLocalParticipant,
  useParticipants,
  VideoTrack,
  FocusLayout,
  GridLayout,
  ParticipantTile,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import { Monitor, Eye } from "lucide-react"

export function BroadcastView({ isHost }: { isHost: boolean }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare])
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()

  // Filter out placeholder tracks to get only real track references
  const videoTracks = tracks.filter(
    (t) =>
      t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare,
  )

  // Count viewers (all participants except the host)
  const viewerCount = participants.filter(
    (p) => p.identity !== localParticipant.identity,
  ).length

  // Prioritize screen share track for display
  const screenShareTrack = videoTracks.find(
    (t) => t.source === Track.Source.ScreenShare,
  )
  const displayTrack = screenShareTrack || videoTracks.find(t => t.source === Track.Source.Camera)

  return (
    <div className="flex flex-col h-full bg-black/40 rounded-xl sm:rounded-2xl overflow-hidden relative">
      {/* Host video - large */}
      <div className="flex-1 relative overflow-hidden">
        {displayTrack && (
          <VideoTrack trackRef={displayTrack} />
        )}
        {videoTracks.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/40">
            <div className="text-center">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-base sm:text-lg">Waiting for host to start broadcasting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Viewer count badge */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/80 backdrop-blur-sm text-white text-xs sm:text-sm font-medium">
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{viewerCount}</span>
          <span className="hidden sm:inline">Live Viewers</span>
        </div>
      </div>

      {/* Screen share indicator */}
      {screenShareTrack && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/80 backdrop-blur-sm text-white text-xs sm:text-sm font-medium">
            <Monitor className="w-3.5 h-3.5" />
            <span>Screen Sharing</span>
          </div>
        </div>
      )}

      {/* Host controls */}
      {isHost && (
        <div className="flex gap-3 p-3 sm:p-4 justify-center">
          <button
            onClick={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
              localParticipant.isCameraEnabled
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-red-500/80 hover:bg-red-500 text-white"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m23 7-7 5 7 5V7Z"/>
              <rect width="15" height="14" x="1" y="3" rx="2" ry="2"/>
            </svg>
            <span className="text-sm">
              {localParticipant.isCameraEnabled ? "Camera On" : "Camera Off"}
            </span>
          </button>
          <button
            onClick={() => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
              localParticipant.isScreenShareEnabled
                ? "bg-purple-500/80 hover:bg-purple-500 text-white ring-2 ring-purple-400/50"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="text-sm">
              {localParticipant.isScreenShareEnabled ? "Stop Sharing" : "Share Screen"}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
