"use client"

import { useLocalParticipant, useRoomContext } from "@livekit/components-react"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  MessageCircle,
} from "lucide-react"

interface CallControlsProps {
  showChat: boolean
  onToggleChat: () => void
  roomType: "ONE_TO_ONE" | "BROADCAST" | "CONFERENCE"
}

export function CallControls({
  showChat,
  onToggleChat,
  roomType,
}: CallControlsProps) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()

  const isMicEnabled = localParticipant.isMicrophoneEnabled
  const isCameraEnabled = localParticipant.isCameraEnabled
  const isScreenShareEnabled = localParticipant.isScreenShareEnabled

  return (
    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        {/* Mic toggle */}
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicEnabled)}
          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 active:scale-95 ${
            isMicEnabled
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500/80 hover:bg-red-500 text-white"
          }`}
          title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicEnabled ? (
            <Mic className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          ) : (
            <MicOff className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          )}
        </button>

        {/* Camera toggle */}
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 active:scale-95 ${
            isCameraEnabled
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500/80 hover:bg-red-500 text-white"
          }`}
          title={isCameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraEnabled ? (
            <Video className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          ) : (
            <VideoOff className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
          )}
        </button>

        {/* Screen share toggle (not for BROADCAST mode) */}
        {roomType !== "BROADCAST" && (
          <button
            onClick={() =>
              localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
            }
            className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 active:scale-95 ${
              isScreenShareEnabled
                ? "bg-purple-500/80 hover:bg-purple-500 text-white ring-2 ring-purple-400/50"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={isScreenShareEnabled ? "Stop screen share" : "Share screen"}
          >
            {isScreenShareEnabled ? (
              <MonitorOff className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            ) : (
              <Monitor className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
            )}
          </button>
        )}

        {/* Chat toggle */}
        <button
          onClick={onToggleChat}
          className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 active:scale-95 ${
            showChat
              ? "bg-purple-500/80 hover:bg-purple-500 text-white"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
          title="Toggle chat"
        >
          <MessageCircle className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
        </button>

        {/* Separator */}
        <div className="w-px h-7 sm:h-9 bg-white/10 mx-0.5 sm:mx-1.5" />

        {/* End call */}
        <button
          onClick={() => room.disconnect()}
          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 active:scale-95 shadow-lg shadow-red-600/30"
          title="End call"
        >
          <PhoneOff className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
        </button>
      </div>
    </div>
  )
}
