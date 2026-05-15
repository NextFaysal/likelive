export type RoomType = "ONE_TO_ONE" | "BROADCAST" | "CONFERENCE"
export type RoomStatus = "WAITING" | "ACTIVE" | "ENDED"
export type ParticipantRole = "HOST" | "SPEAKER" | "VIEWER"
export type MessageType = "TEXT" | "FILE" | "SYSTEM"
export type RecordingStatus = "PROCESSING" | "READY" | "FAILED"

export interface Room {
  id: string
  name: string
  description?: string
  type: RoomType
  status: RoomStatus
  livekitRoom: string
  maxParticipants: number
  isRecording: boolean
  hostId: string
  createdAt: string
  endedAt?: string
}

export interface Participant {
  id: string
  roomId: string
  userId: string
  role: ParticipantRole
  joinedAt: string
  leftAt?: string
}

export interface ChatMessage {
  id: string
  sender: string
  content: string
  timestamp: number
}

export interface Recording {
  id: string
  roomId: string
  userId: string
  r2Key: string
  r2Url?: string
  duration?: number
  status: RecordingStatus
  startedAt: string
  endedAt?: string
}

export interface Transcript {
  id: string
  roomId: string
  recordingId?: string
  content: string
  language: string
  model: string
  createdAt: string
}

export interface CreateRoomInput {
  name: string
  description?: string
  type: RoomType
  maxParticipants?: number
}

export interface JoinRoomInput {
  roomId: string
}
