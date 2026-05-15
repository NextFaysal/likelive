import { AccessToken, VideoGrant } from "livekit-server-sdk"

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!

interface TokenOptions {
  roomName: string
  participantName: string
  participantId: string
  role: "host" | "speaker" | "viewer"
}

export async function generateToken({
  roomName,
  participantName,
  participantId,
  role,
}: TokenOptions): Promise<string> {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantId,
    name: participantName,
  })

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: role === "host" || role === "speaker",
    canSubscribe: true,
    canPublishData: role === "host" || role === "speaker",
  }

  if (role === "viewer") {
    grant.canPublish = false
    grant.canPublishData = false
  }

  at.addGrant(grant)

  return at.toJwt()
}
