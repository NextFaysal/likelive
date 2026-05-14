# 🎥 LiveKit Video Calling App — Full Project Documentation

> **Stack:** Next.js 14 (App Router) · LiveKit · PostgreSQL + Prisma · OpenRouter AI · Cloudflare R2  
> **Features:** 1-to-1 Call · 1-to-Many Broadcast · Many-to-Many Conference · AI Transcription · Recording · Chat

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)
6. [LiveKit Setup](#livekit-setup)
7. [Feature: 1-to-1 Video Call](#feature-1-to-1-video-call)
8. [Feature: 1-to-Many Broadcast](#feature-1-to-many-broadcast)
9. [Feature: Many-to-Many Conference](#feature-many-to-many-conference)
10. [Feature: AI Transcription (OpenRouter)](#feature-ai-transcription-openrouter)
11. [Feature: Recording (Cloudflare R2)](#feature-recording-cloudflare-r2)
12. [Feature: In-Call Chat](#feature-in-call-chat)
13. [API Routes](#api-routes)
14. [Installation & Setup](#installation--setup)
15. [Deployment](#deployment)

---

## 🧩 Project Overview

Ekta full-featured video calling application ja **LiveKit** use kore real-time communication handle korbe. Tin dharoner call support korbe:

| Call Type | Description | Max Participants |
|-----------|-------------|-----------------|
| **1-to-1** | Private video call duijoner modhye | 2 |
| **1-to-Many** | Host broadcast kore, others shudhu dekhe | Unlimited viewers |
| **Many-to-Many** | Conference call — shobai active participant | Up to 50 |

---

## 🛠️ Tech Stack

```
Frontend:       Next.js 14 (App Router, TypeScript)
Styling:        Tailwind CSS + shadcn/ui
Video SDK:      LiveKit Client SDK (@livekit/components-react)
Backend:        Next.js API Routes (Server Actions)
Database:       PostgreSQL + Prisma ORM
AI:             OpenRouter.ai (Whisper/Transcription models)
Storage:        Cloudflare R2 (recordings)
Auth:           NextAuth.js (or Clerk)
LiveKit Server: LiveKit Cloud or self-hosted
```

---

## 📁 Project Structure

```
livekit-video-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard home
│   │   └── recordings/page.tsx         # Past recordings list
│   ├── room/
│   │   ├── [roomId]/
│   │   │   ├── page.tsx                # Join room page
│   │   │   └── components/
│   │   │       ├── VideoRoom.tsx       # Main video component
│   │   │       ├── ChatPanel.tsx       # In-call chat
│   │   │       ├── ParticipantGrid.tsx # Many-to-many grid
│   │   │       ├── BroadcastView.tsx   # 1-to-many view
│   │   │       └── Controls.tsx        # Mic/Cam/Screen controls
│   ├── api/
│   │   ├── livekit/
│   │   │   ├── token/route.ts          # Generate LiveKit token
│   │   │   └── webhook/route.ts        # LiveKit webhooks
│   │   ├── rooms/
│   │   │   ├── route.ts                # Create/list rooms
│   │   │   └── [roomId]/route.ts       # Room CRUD
│   │   ├── recording/
│   │   │   ├── start/route.ts          # Start recording
│   │   │   ├── stop/route.ts           # Stop recording
│   │   │   └── list/route.ts           # List recordings
│   │   ├── ai/
│   │   │   └── transcribe/route.ts     # AI transcription
│   │   └── chat/
│   │       └── [roomId]/route.ts       # Chat messages
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn components
│   └── shared/
│       ├── RoomCard.tsx
│       └── RecordingCard.tsx
├── lib/
│   ├── livekit.ts                      # LiveKit server utils
│   ├── prisma.ts                       # Prisma client
│   ├── r2.ts                           # Cloudflare R2 client
│   └── openrouter.ts                   # OpenRouter AI client
├── prisma/
│   └── schema.prisma
├── hooks/
│   ├── useRoom.ts
│   ├── useChat.ts
│   └── useRecording.ts
├── types/
│   └── index.ts
├── .env.local
└── package.json
```

---

## 🗄️ Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  password     String?
  avatar       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  hostedRooms  Room[]    @relation("RoomHost")
  participants Participant[]
  messages     Message[]
  recordings   Recording[]
}

model Room {
  id           String      @id @default(cuid())
  name         String
  description  String?
  type         RoomType    @default(CONFERENCE)   // ONE_TO_ONE | BROADCAST | CONFERENCE
  status       RoomStatus  @default(WAITING)       // WAITING | ACTIVE | ENDED
  livekitRoom  String      @unique                 // LiveKit room name
  maxParticipants Int      @default(50)
  isRecording  Boolean     @default(false)
  hostId       String
  host         User        @relation("RoomHost", fields: [hostId], references: [id])
  createdAt    DateTime    @default(now())
  endedAt      DateTime?

  participants Participant[]
  messages     Message[]
  recordings   Recording[]
  transcripts  Transcript[]
}

enum RoomType {
  ONE_TO_ONE
  BROADCAST
  CONFERENCE
}

enum RoomStatus {
  WAITING
  ACTIVE
  ENDED
}

model Participant {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  role      ParticipantRole @default(VIEWER)  // HOST | SPEAKER | VIEWER
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  room      Room     @relation(fields: [roomId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
}

enum ParticipantRole {
  HOST
  SPEAKER
  VIEWER
}

model Message {
  id        String   @id @default(cuid())
  roomId    String
  userId    String
  content   String
  type      MessageType @default(TEXT)
  createdAt DateTime @default(now())

  room      Room     @relation(fields: [roomId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

enum MessageType {
  TEXT
  FILE
  SYSTEM
}

model Recording {
  id          String          @id @default(cuid())
  roomId      String
  userId      String
  r2Key       String          // Cloudflare R2 object key
  r2Url       String?         // Signed URL (temporary)
  duration    Int?            // seconds
  size        BigInt?         // bytes
  status      RecordingStatus @default(PROCESSING)
  startedAt   DateTime        @default(now())
  endedAt     DateTime?

  room        Room     @relation(fields: [roomId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  transcripts Transcript[]
}

enum RecordingStatus {
  PROCESSING
  READY
  FAILED
}

model Transcript {
  id          String   @id @default(cuid())
  roomId      String
  recordingId String?
  content     String   // Full transcript text
  language    String   @default("bn")  // Bengali default
  model       String   // AI model used
  createdAt   DateTime @default(now())

  room        Room      @relation(fields: [roomId], references: [id])
  recording   Recording? @relation(fields: [recordingId], references: [id])
}
```

---

## 🔐 Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/livekit_app"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# LiveKit
LIVEKIT_URL="wss://your-app.livekit.cloud"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_API_SECRET="your-livekit-api-secret"

# OpenRouter AI
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# Cloudflare R2
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="livekit-recordings"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"  # Public bucket URL (optional)

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-app.livekit.cloud"
```

---

## 🎙️ LiveKit Setup

### Install Dependencies

```bash
npm install livekit-server-sdk @livekit/components-react @livekit/components-core livekit-client
```

### Token Generator (`lib/livekit.ts`)

```typescript
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const livekitHost = process.env.LIVEKIT_URL!;
const apiKey = process.env.LIVEKIT_API_KEY!;
const apiSecret = process.env.LIVEKIT_API_SECRET!;

export const roomService = new RoomServiceClient(
  livekitHost.replace('wss://', 'https://'),
  apiKey,
  apiSecret
);

export interface TokenOptions {
  roomName: string;
  participantName: string;
  participantId: string;
  role: 'host' | 'speaker' | 'viewer';
}

export async function generateToken(options: TokenOptions): Promise<string> {
  const at = new AccessToken(apiKey, apiSecret, {
    identity: options.participantId,
    name: options.participantName,
  });

  const canPublish = options.role === 'host' || options.role === 'speaker';
  const canSubscribe = true;

  at.addGrant({
    roomJoin: true,
    room: options.roomName,
    canPublish,
    canSubscribe,
    canPublishData: true,  // for chat messages
  });

  return at.toJwt();
}
```

---

## 📞 Feature: 1-to-1 Video Call

### How it works:
- Host ekta room create kore `ONE_TO_ONE` type diye
- Invite link share kore second participant er shathe
- Maximum 2 joner pore room lock hoy
- Dujoner-i publish/subscribe permission thake

### API Route (`app/api/livekit/token/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/livekit';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await req.json();

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { participants: true },
  });

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  // 1-to-1 room: max 2 participants check
  if (room.type === 'ONE_TO_ONE' && room.participants.length >= 2) {
    return NextResponse.json({ error: 'Room is full' }, { status: 403 });
  }

  const isHost = room.hostId === session.user.id;
  const role = isHost ? 'host' : 'speaker';

  const token = await generateToken({
    roomName: room.livekitRoom,
    participantName: session.user.name!,
    participantId: session.user.id,
    role,
  });

  return NextResponse.json({ token, livekitUrl: process.env.LIVEKIT_URL });
}
```

### Component (`app/room/[roomId]/components/VideoRoom.tsx`)

```tsx
'use client';

import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  useTracks,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface VideoRoomProps {
  token: string;
  roomType: 'ONE_TO_ONE' | 'BROADCAST' | 'CONFERENCE';
}

export default function VideoRoom({ token, roomType }: VideoRoomProps) {
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={true}
      audio={true}
    >
      {roomType === 'ONE_TO_ONE' && <OneToOneView />}
      {roomType === 'BROADCAST' && <BroadcastView />}
      {roomType === 'CONFERENCE' && <ConferenceView />}
      <ControlBar />
    </LiveKitRoom>
  );
}

function OneToOneView() {
  return (
    <VideoConference />  // LiveKit built-in — 2 participant optimize
  );
}
```

---

## 📡 Feature: 1-to-Many Broadcast

### How it works:
- Host video publish kore (camera + screen share)
- Viewers shudhu subscribe kore, publish korte parbe na
- Viewers count unlimited
- Host-e role change dite parbe (viewer → speaker)

### Broadcast Component (`components/BroadcastView.tsx`)

```tsx
'use client';

import { useTracks, TrackLoop, TrackRefContext, VideoTrack, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

export function BroadcastView({ isHost }: { isHost: boolean }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="flex flex-col h-full">
      {/* Host video - large */}
      <div className="flex-1 bg-black rounded-xl overflow-hidden">
        <TrackLoop tracks={tracks}>
          <TrackRefContext.Consumer>
            {(trackRef) => trackRef && <VideoTrack trackRef={trackRef} />}
          </TrackRefContext.Consumer>
        </TrackLoop>
      </div>

      {/* Viewer count */}
      <div className="p-4 text-center text-white">
        <span>👁 Live Viewers: {/* participant count */}</span>
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="flex gap-4 p-4 justify-center">
          <button onClick={() => localParticipant.setCameraEnabled(true)}>
            📷 Camera On
          </button>
          <button onClick={() => localParticipant.setScreenShareEnabled(true)}>
            🖥 Share Screen
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 👥 Feature: Many-to-Many Conference

### How it works:
- Shobai publish + subscribe korte pare
- Grid layout e sob participant dekhay
- Max 50 participant support
- Screen share + audio + video toggle

### Conference Grid (`components/ParticipantGrid.tsx`)

```tsx
'use client';

import {
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

export function ConferenceView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full">
      <RoomAudioRenderer />  {/* Audio playback */}
      <GridLayout
        tracks={tracks}
        style={{ height: 'calc(100vh - 80px)' }}
      >
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}
```

---

## 🤖 Feature: AI Transcription (OpenRouter)

### How it works:
1. Call shesh howar pore recording Cloudflare R2 te save hoy
2. Recording er audio extract hoy
3. OpenRouter e pathano hoy (Whisper model via OpenRouter)
4. Transcript database e save hoy
5. User dashboard e transcript dekhte pare

### OpenRouter Client (`lib/openrouter.ts`)

```typescript
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function transcribeAudio(audioUrl: string): Promise<string> {
  // Option 1: Text-based transcription request (if audio already processed)
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL!,
    },
    body: JSON.stringify({
      model: 'openai/whisper-large-v3',  // via OpenRouter
      messages: [
        {
          role: 'user',
          content: `Please transcribe this audio file: ${audioUrl}`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function summarizeTranscript(transcript: string): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL!,
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',  // Fast, cheap model for summarization
      messages: [
        {
          role: 'system',
          content: 'You are a meeting summarizer. Provide key points in bullet format.',
        },
        {
          role: 'user',
          content: `Summarize this meeting transcript:\n\n${transcript}`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Transcription API Route (`app/api/ai/transcribe/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, summarizeTranscript } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { getR2SignedUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  const { recordingId } = await req.json();

  const recording = await prisma.recording.findUnique({
    where: { id: recordingId },
  });

  if (!recording) return NextResponse.json({ error: 'Recording not found' }, { status: 404 });

  // Get temporary signed URL from R2
  const audioUrl = await getR2SignedUrl(recording.r2Key);

  // Transcribe
  const transcriptText = await transcribeAudio(audioUrl);
  const summary = await summarizeTranscript(transcriptText);

  // Save to DB
  const transcript = await prisma.transcript.create({
    data: {
      roomId: recording.roomId,
      recordingId: recording.id,
      content: transcriptText + '\n\n---SUMMARY---\n' + summary,
      model: 'openai/whisper-large-v3',
    },
  });

  return NextResponse.json({ transcript });
}
```

---

## 🎬 Feature: Recording (Cloudflare R2)

### How it works:
1. Host "Start Recording" button click kore
2. LiveKit Egress API call hoy server-side e
3. LiveKit recording start kore (MP4 format)
4. Recording shesh hole LiveKit webhook trigger hoy
5. File Cloudflare R2 te upload hoy automatically (via LiveKit Egress config)
6. Database e recording entry save hoy

### R2 Client (`lib/r2.ts`)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(r2Client, command, { expiresIn });
}
```

### Start Recording (`app/api/recording/start/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

const egressClient = new EgressClient(
  process.env.LIVEKIT_URL!.replace('wss://', 'https://'),
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId } = await req.json();

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const r2Key = `recordings/${roomId}/${Date.now()}.mp4`;

  // Configure R2 upload via LiveKit Egress
  const output = new EncodedFileOutput({
    fileType: 'MP4',
    filepath: r2Key,
    s3: new S3Upload({
      accessKey: process.env.R2_ACCESS_KEY_ID!,
      secret: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET_NAME!,
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
    }),
  });

  // Start LiveKit Egress recording
  const egressInfo = await egressClient.startRoomCompositeEgress(
    room.livekitRoom,
    { file: output },
    {
      layout: 'grid',
      audioOnly: false,
    }
  );

  // Save recording to DB
  const recording = await prisma.recording.create({
    data: {
      roomId,
      userId: session.user.id,
      r2Key,
      status: 'PROCESSING',
    },
  });

  // Update room recording status
  await prisma.room.update({
    where: { id: roomId },
    data: { isRecording: true },
  });

  return NextResponse.json({ recording, egressId: egressInfo.egressId });
}
```

### LiveKit Webhook (`app/api/livekit/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { prisma } from '@/lib/prisma';

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authHeader = req.headers.get('Authorization');

  const event = receiver.receive(body, authHeader!);

  switch (event.event) {
    case 'egress_ended':
      // Recording complete — update DB
      await prisma.recording.updateMany({
        where: { r2Key: { contains: event.egressInfo?.roomName } },
        data: {
          status: 'READY',
          endedAt: new Date(),
        },
      });

      // Auto-trigger transcription
      // (Optional: queue a job here)
      break;

    case 'room_finished':
      await prisma.room.updateMany({
        where: { livekitRoom: event.room?.name },
        data: { status: 'ENDED', endedAt: new Date() },
      });
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 💬 Feature: In-Call Chat

### How it works:
- LiveKit DataChannel use kore real-time chat
- Messages simultaneously database e save hoy
- Emojis, text support
- Chat history room shesh hole accessible

### Chat Hook (`hooks/useChat.ts`)

```typescript
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { useState, useCallback } from 'react';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

export function useChat(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { localParticipant } = useLocalParticipant();

  const { send } = useDataChannel('chat', (msg) => {
    const decoded = JSON.parse(new TextDecoder().decode(msg.payload));
    setMessages((prev) => [...prev, decoded]);
  });

  const sendMessage = useCallback(async (content: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: localParticipant.name || 'Unknown',
      content,
      timestamp: Date.now(),
    };

    // Send via LiveKit DataChannel (real-time)
    send(new TextEncoder().encode(JSON.stringify(message)), { reliable: true });

    // Save to DB
    await fetch(`/api/chat/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    setMessages((prev) => [...prev, message]);
  }, [roomId, localParticipant, send]);

  return { messages, sendMessage };
}
```

---

## 🔌 API Routes Summary

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/rooms` | Create new room |
| `GET` | `/api/rooms` | List all rooms |
| `GET` | `/api/rooms/[roomId]` | Get room details |
| `DELETE` | `/api/rooms/[roomId]` | Delete room |
| `POST` | `/api/livekit/token` | Generate join token |
| `POST` | `/api/livekit/webhook` | LiveKit event webhook |
| `POST` | `/api/recording/start` | Start recording |
| `POST` | `/api/recording/stop` | Stop recording |
| `GET` | `/api/recording/list` | List recordings |
| `POST` | `/api/ai/transcribe` | Transcribe recording |
| `GET` | `/api/chat/[roomId]` | Get chat history |
| `POST` | `/api/chat/[roomId]` | Send chat message |

---

## ⚙️ Installation & Setup

### 1. Project Initialize

```bash
npx create-next-app@latest livekit-video-app --typescript --tailwind --app
cd livekit-video-app
```

### 2. Dependencies Install

```bash
# LiveKit
npm install livekit-server-sdk @livekit/components-react @livekit/components-core livekit-client

# Database
npm install @prisma/client prisma
npx prisma init

# Auth
npm install next-auth

# AWS SDK for R2
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# UI
npm install tailwindcss-animate class-variance-authority clsx
npx shadcn-ui@latest init
```

### 3. Database Setup

```bash
# .env.local e DATABASE_URL set korun
npx prisma migrate dev --name init
npx prisma generate
```

### 4. LiveKit Cloud Setup

1. [livekit.io](https://livekit.io) e account create korun
2. New project create korun
3. API Key + Secret copy korun → `.env.local` e paste korun
4. Webhook URL set korun: `https://yourdomain.com/api/livekit/webhook`

### 5. Cloudflare R2 Setup

```bash
# Cloudflare Dashboard → R2 → Create Bucket
# Bucket name: livekit-recordings
# CORS policy add korun (for direct upload if needed):
# Origin: https://yourdomain.com
# Methods: GET, PUT, POST
```

### 6. OpenRouter Setup

1. [openrouter.ai](https://openrouter.ai) e account create korun
2. API Key generate korun
3. `.env.local` e `OPENROUTER_API_KEY` set korun
4. Available models check korun: `openai/whisper-large-v3` transcription er jonno

### 7. Development Server

```bash
npx prisma studio    # DB GUI
npm run dev          # Start app on localhost:3000
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel

# Environment variables Vercel dashboard e add korun:
# DATABASE_URL, LIVEKIT_*, OPENROUTER_API_KEY, R2_*, NEXTAUTH_*
```


## 🔒 Security Checklist

- [ ] API routes e authentication check (getServerSession)
- [ ] LiveKit tokens server-side e generate hoy (never client-side)
- [ ] R2 bucket public access disable kora (signed URLs use)
- [ ] Webhook requests LiveKit signature verify kora
- [ ] Rate limiting add kora API routes e
- [ ] Room access control (participant list check)
- [ ] Input validation + sanitization

---

## 📈 Future Enhancements

- [ ] **Breakout Rooms** — Conference er modhye choto group room
- [ ] **Virtual Background** — AI background blur/replace
- [ ] **Real-time Translation** — Live AI translation via OpenRouter
- [ ] **Polls & Reactions** — Interactive elements during broadcast
- [ ] **Screen Annotation** — Drawing on shared screen
- [ ] **Meeting Summary Email** — Auto-send transcript after call
- [ ] **Analytics Dashboard** — Call duration, participant stats

---

*Documentation last updated: 2025*  
*Stack: Next.js 14 · LiveKit · PostgreSQL · OpenRouter · Cloudflare R2*