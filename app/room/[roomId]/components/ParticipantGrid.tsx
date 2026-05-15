"use client"

import {
  GridLayout,
  FocusLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import { Monitor } from "lucide-react"

export function ConferenceView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  // Separate screen share tracks from camera tracks
  const screenShareTracks = tracks.filter(
    (t) => t.source === Track.Source.ScreenShare,
  )
  const cameraTracks = tracks.filter(
    (t) => t.source === Track.Source.Camera,
  )

  const hasScreenShare = screenShareTracks.length > 0

  // When screen share is active, show it in focus layout + camera tracks in a small row
  if (hasScreenShare) {
    return (
      <div className="h-full w-full flex flex-col p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Screen share indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <Monitor className="w-4 h-4 text-purple-400" />
          <span className="text-xs sm:text-sm text-purple-300 font-medium">
            Someone is sharing their screen
          </span>
        </div>

        {/* Screen share - large focus area */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-slate-900">
          {screenShareTracks.map((trackRef) => (
            <FocusLayout key={trackRef.publication?.trackSid ?? trackRef.source} trackRef={trackRef} style={{ height: "100%", width: "100%" }}>
              <ParticipantTile />
            </FocusLayout>
          ))}
        </div>

        {/* Camera tracks - small row at bottom */}
        <div className="flex-shrink-0">
          <GridLayout
            tracks={cameraTracks}
            style={{ height: "120px" }}
          >
            <ParticipantTile />
          </GridLayout>
        </div>
      </div>
    )
  }

  // No screen share - regular grid layout
  return (
    <div className="h-full w-full p-2 sm:p-3">
      <GridLayout tracks={tracks} style={{ height: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  )
}
