"use client"

import {
  LiveKitRoom,
  RoomAudioRenderer,
  GridLayout,
  FocusLayout,
  ParticipantTile,
  useTracks,
  useConnectionState,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { Track, ConnectionState } from "livekit-client"
import { BroadcastView } from "./BroadcastView"
import { ChatPanel } from "./ChatPanel"
import { CallControls } from "./CallControls"
import { ConferenceView } from "./ParticipantGrid"
import { useState, useCallback } from "react"
import { Monitor, WifiOff, Loader2, ArrowLeft, ShieldAlert, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Custom ONE_TO_ONE view that properly handles screen share
function OneToOneView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const screenShareTracks = tracks.filter(
    (t) => t.source === Track.Source.ScreenShare,
  )
  const cameraTracks = tracks.filter(
    (t) => t.source === Track.Source.Camera,
  )

  const hasScreenShare = screenShareTracks.length > 0

  if (hasScreenShare) {
    return (
      <div className="h-full w-full flex flex-col p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Screen share indicator */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
          <Monitor className="w-4 h-4 text-purple-400" />
          <span className="text-xs sm:text-sm text-purple-300 font-medium">
            Screen sharing is active
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

  // No screen share - regular grid for 1-to-1
  return (
    <div className="h-full w-full p-2 sm:p-3">
      <GridLayout tracks={tracks} style={{ height: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  )
}

// Connection status overlay with SSL certificate guidance
function ConnectionStatusOverlay({ livekitUrl }: { livekitUrl: string }) {
  const connectionState = useConnectionState()

  if (connectionState === ConnectionState.Connected) {
    return null
  }

  // Extract the HTTPS URL from the WSS URL for certificate acceptance
  const httpsUrl = livekitUrl.replace("wss://", "https://").replace("ws://", "http://")

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center p-6 max-w-md">
        {connectionState === ConnectionState.Connecting && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            <p className="text-white font-medium">Connecting to room...</p>
            <p className="text-slate-400 text-sm">Establishing connection to LiveKit server</p>
          </>
        )}
        {connectionState === ConnectionState.Reconnecting && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
            <p className="text-white font-medium">Reconnecting...</p>
            <p className="text-slate-400 text-sm">Connection lost, attempting to reconnect</p>
          </>
        )}
        {connectionState === ConnectionState.Disconnected && (
          <>
            <WifiOff className="w-10 h-10 text-red-400" />
            <p className="text-white font-medium text-lg">Disconnected</p>
            <p className="text-slate-400 text-sm">
              Could not connect to the LiveKit server.
            </p>

            {/* SSL Certificate guidance */}
            <div className="mt-2 p-4 rounded-xl bg-slate-900/80 border border-white/10 w-full">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium text-sm">SSL Certificate Issue?</span>
              </div>
              <p className="text-slate-400 text-xs mb-3">
                If your LiveKit server uses a self-signed certificate, you need to accept it first in your browser:
              </p>
              <ol className="text-slate-400 text-xs space-y-1 mb-3 list-decimal list-inside">
                <li>Click the button below to open the LiveKit server URL</li>
                <li>Accept the security warning in your browser</li>
                <li>Come back and retry the connection</li>
              </ol>
              <Button
                onClick={() => window.open(httpsUrl, "_blank")}
                variant="outline"
                className="w-full border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 text-xs h-8"
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Accept SSL Certificate
              </Button>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface VideoRoomProps {
  token: string
  roomType: "ONE_TO_ONE" | "BROADCAST" | "CONFERENCE"
  roomId: string
  isHost: boolean
}

export function VideoRoom({ token, roomType, roomId, isHost }: VideoRoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!
  const [showChat, setShowChat] = useState(false)

  const handleDisconnected = useCallback(() => {
    console.log("Disconnected from LiveKit room")
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error("LiveKit connection error:", error)
  }, [])

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={handleDisconnected}
      onError={handleError}
      style={{ height: "100%" }}
    >
      <ConnectionStatusOverlay livekitUrl={livekitUrl} />

      <div className="flex h-full w-full overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 min-w-0 relative">
          {roomType === "ONE_TO_ONE" && <OneToOneView />}
          {roomType === "BROADCAST" && <BroadcastView isHost={isHost} />}
          {roomType === "CONFERENCE" && <ConferenceView />}
          <RoomAudioRenderer />

          {/* Custom call controls */}
          <CallControls
            showChat={showChat}
            onToggleChat={() => setShowChat(!showChat)}
            roomType={roomType}
          />
        </div>

        {/* Chat panel - responsive sidebar */}
        <div
          className={`${
            showChat ? "w-80 sm:w-80 md:w-96 border-l border-white/10" : "w-0"
          } transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}
        >
          {showChat && (
            <div className="w-80 sm:w-80 md:w-96 h-full">
              <ChatPanel roomId={roomId} onClose={() => setShowChat(false)} />
            </div>
          )}
        </div>
      </div>
    </LiveKitRoom>
  )
}
