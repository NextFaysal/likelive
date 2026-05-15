# 🎥 LikeLive — LiveKit Video Calling App

> A full-featured real-time video calling application built with **Next.js**, **LiveKit**, **PostgreSQL + Prisma**, **OpenRouter AI**, and **Cloudflare R2**.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Call Types](#-call-types)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Features](#-features)
  - [1-to-1 Video Call](#-1-to-1-video-call)
  - [1-to-Many Broadcast](#-1-to-many-broadcast)
  - [Many-to-Many Conference](#-many-to-many-conference)
  - [AI Transcription (OpenRouter)](#-ai-transcription-openrouter)
  - [Recording (Cloudflare R2)](#-recording-cloudflare-r2)
  - [In-Call Chat](#-in-call-chat)
- [API Routes](#-api-routes)
- [Environment Variables](#-environment-variables)
- [Installation & Setup](#-installation--setup)
- [Deployment](#-deployment)
- [Security Checklist](#-security-checklist)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🧩 Project Overview

LikeLive is a comprehensive video calling platform that uses **LiveKit** for real-time communication. It supports three distinct call modes, AI-powered transcription, cloud recording, and in-call messaging — all built on a modern Next.js architecture.

---

## 📞 Call Types

| Call Type | Description | Max Participants |
|-----------|-------------|-----------------|
| **1-to-1** | Private video call between two people | 2 |
| **1-to-Many** | Host broadcasts, others only watch | Unlimited viewers |
| **Many-to-Many** | Conference call — everyone is an active participant | Up to 50 |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Video SDK** | LiveKit Client SDK (`@livekit/components-react`) |
| **Backend** | Next.js API Routes (Server Actions) |
| **Database** | PostgreSQL + Prisma ORM |
| **AI** | OpenRouter.ai (Whisper / Transcription models) |
| **Storage** | Cloudflare R2 (recordings) |
| **Auth** | NextAuth.js (or Clerk) |
| **LiveKit Server** | LiveKit Cloud or self-hosted |
| **Design** | shadcn/ui |

---

## 📁 Project Structure

```
likelive/
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
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/                             # shadcn components
│   └── shared/
│       ├── RoomCard.tsx
│       └── RecordingCard.tsx
├── lib/
│   ├── livekit.ts                      # LiveKit server utils
│   ├── prisma.ts                       # Prisma client singleton
│   ├── r2.ts                           # Cloudflare R2 client
│   └── openrouter.ts                   # OpenRouter AI client
├── prisma/
│   └── schema.prisma                   # Database schema
├── hooks/
│   ├── useRoom.ts                      # Room state management
│   ├── useChat.ts                      # Chat functionality
│   └── useRecording.ts                 # Recording controls
├── types/
│   └── index.ts                        # TypeScript type definitions
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .env.local                          # Environment variables
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 🗄️ Database Schema

### Prisma Schema (`prisma/schema.prisma`)

```prisma
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
  type         RoomType    @default(CONFERENCE)
  status       RoomStatus  @default(WAITING)
  livekitRoom  String      @unique
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
  role      ParticipantRole @default(VIEWER)
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
  language    String   @default("bn")
  model       String   // AI model used
  createdAt   DateTime @default(now())

  room        Room      @relation(fields: [roomId], references: [id])
  recording   Recording? @relation(fields: [recordingId], references: [id])
}
```

---

## ✨ Features

### 1-to-1 Video Call

- Host creates a room with `ONE_TO_ONE` type
- Invite link is shared with the second participant
- Room locks automatically after 2 participants join
- Both participants have publish/subscribe permissions

**Token Generation** (`app/api/livekit/token/route.ts`):

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

**VideoRoom Component** (`app/room/[roomId]/components/VideoRoom.tsx`):

```tsx
'use client';

import {
  LiveKitRoom,
  VideoConference,
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
    <LiveKitRoom token={token} serverUrl={livekitUrl} connect={true} video={true} audio={true}>
      {roomType === 'ONE_TO_ONE' && <OneToOneView />}
      {roomType === 'BROADCAST' && <BroadcastView />}
      {roomType === 'CONFERENCE' && <ConferenceView />}
      <ControlBar />
    </LiveKitRoom>
  );
}

function OneToOneView() {
  return <VideoConference />;  // LiveKit built-in — optimized for 2 participants
}
```

---

### 1-to-Many Broadcast

- Host publishes video (camera + screen share)
- Viewers can only subscribe, cannot publish
- Unlimited viewer count
- Host can promote viewers to speakers (role change)

**BroadcastView Component** (`components/BroadcastView.tsx`):

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
          <button onClick={() => localParticipant.setCameraEnabled(true)}>📷 Camera On</button>
          <button onClick={() => localParticipant.setScreenShareEnabled(true)}>🖥 Share Screen</button>
        </div>
      )}
    </div>
  );
}
```

---

### Many-to-Many Conference

- Everyone can publish and subscribe
- Grid layout displays all participants
- Up to 50 participants supported
- Screen share + audio + video toggle for each participant

**ConferenceView Component** (`components/ParticipantGrid.tsx`):

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
      <RoomAudioRenderer />
      <GridLayout tracks={tracks} style={{ height: 'calc(100vh - 80px)' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}
```

---

### AI Transcription (OpenRouter)

1. After a call ends, the recording is saved to Cloudflare R2
2. Audio is extracted from the recording
3. Sent to OpenRouter (Whisper model) for transcription
4. Transcript is saved to the database
5. Users can view transcripts from their dashboard

**OpenRouter Client** (`lib/openrouter.ts`):

```typescript
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL!,
    },
    body: JSON.stringify({
      model: 'openai/whisper-large-v3',
      messages: [{ role: 'user', content: `Please transcribe this audio file: ${audioUrl}` }],
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
      model: 'anthropic/claude-3-haiku',
      messages: [
        { role: 'system', content: 'You are a meeting summarizer. Provide key points in bullet format.' },
        { role: 'user', content: `Summarize this meeting transcript:\n\n${transcript}` },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

**Transcription API** (`app/api/ai/transcribe/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, summarizeTranscript } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { getR2SignedUrl } from '@/lib/r2';

export async function POST(req: NextRequest) {
  const { recordingId } = await req.json();
  const recording = await prisma.recording.findUnique({ where: { id: recordingId } });

  if (!recording) return NextResponse.json({ error: 'Recording not found' }, { status: 404 });

  const audioUrl = await getR2SignedUrl(recording.r2Key);
  const transcriptText = await transcribeAudio(audioUrl);
  const summary = await summarizeTranscript(transcriptText);

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

### Recording (Cloudflare R2)

1. Host clicks "Start Recording" button
2. LiveKit Egress API is called server-side
3. LiveKit starts recording in MP4 format
4. When recording ends, a LiveKit webhook is triggered
5. File is automatically uploaded to Cloudflare R2 (via LiveKit Egress config)
6. Recording entry is saved in the database

**R2 Client** (`lib/r2.ts`):

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

**Start Recording** (`app/api/recording/start/route.ts`):

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

  const egressInfo = await egressClient.startRoomCompositeEgress(
    room.livekitRoom,
    { file: output },
    { layout: 'grid', audioOnly: false }
  );

  const recording = await prisma.recording.create({
    data: { roomId, userId: session.user.id, r2Key, status: 'PROCESSING' },
  });

  await prisma.room.update({ where: { id: roomId }, data: { isRecording: true } });

  return NextResponse.json({ recording, egressId: egressInfo.egressId });
}
```

**LiveKit Webhook** (`app/api/livekit/webhook/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { prisma } from '@/lib/prisma';

const receiver = new WebhookReceiver(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const authHeader = req.headers.get('Authorization');
  const event = receiver.receive(body, authHeader!);

  switch (event.event) {
    case 'egress_ended':
      await prisma.recording.updateMany({
        where: { r2Key: { contains: event.egressInfo?.roomName } },
        data: { status: 'READY', endedAt: new Date() },
      });
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

### In-Call Chat

- Real-time chat via LiveKit DataChannel
- Messages are simultaneously saved to the database
- Supports text and emojis
- Chat history is accessible after the room ends

**Chat Hook** (`hooks/useChat.ts`):

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

## 🔌 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms` | List all rooms |
| `GET` | `/api/rooms/[roomId]` | Get room details |
| `DELETE` | `/api/rooms/[roomId]` | Delete a room |
| `POST` | `/api/livekit/token` | Generate a LiveKit join token |
| `POST` | `/api/livekit/webhook` | Receive LiveKit event webhooks |
| `POST` | `/api/recording/start` | Start room recording |
| `POST` | `/api/recording/stop` | Stop room recording |
| `GET` | `/api/recording/list` | List all recordings |
| `POST` | `/api/ai/transcribe` | Transcribe a recording via AI |
| `GET` | `/api/chat/[roomId]` | Get chat history for a room |
| `POST` | `/api/chat/[roomId]` | Send a chat message |

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/likelive"

# LiveKit
LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-api-key"
LIVEKIT_API_SECRET="your-api-secret"
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# OpenRouter AI
OPENROUTER_API_KEY="your-openrouter-api-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="livekit-recordings"
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** running locally or remotely
- **LiveKit Cloud** account (or self-hosted LiveKit server)
- **Cloudflare** account with R2 enabled
- **OpenRouter** account for AI transcription

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd likelive
npm install
```

### 2. Install Additional Dependencies

```bash
# LiveKit
npm install livekit-server-sdk @livekit/components-react @livekit/components-core livekit-client

# Database
npm install @prisma/client
npx prisma init

# Auth
npm install next-auth

# AWS SDK for R2
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# UI
npx shadcn@latest init
```

### 3. Database Setup

```bash
# Set DATABASE_URL in .env.local
npx prisma migrate dev --name init
npx prisma generate
```

### 4. LiveKit Cloud Setup

1. Create an account at [livekit.io](https://livekit.io)
2. Create a new project
3. Copy the **API Key** and **API Secret** → paste into `.env.local`
4. Set the webhook URL: `https://yourdomain.com/api/livekit/webhook`

### 5. Cloudflare R2 Setup

1. Go to **Cloudflare Dashboard → R2 → Create Bucket**
2. Bucket name: `livekit-recordings`
3. Add CORS policy:
   - Origin: `https://yourdomain.com`
   - Methods: `GET, PUT, POST`

### 6. OpenRouter Setup

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Generate an API Key
3. Set `OPENROUTER_API_KEY` in `.env.local`
4. Verify model availability: `openai/whisper-large-v3` for transcription

### 7. Run Development Server

```bash
npx prisma studio    # Open DB GUI (optional)
npm run dev          # Start app on http://localhost:3000
```

---

## ☁️ Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Add all environment variables in the **Vercel Dashboard**:
- `DATABASE_URL`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `OPENROUTER_API_KEY`, `NEXT_PUBLIC_APP_URL`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

---

## 🔒 Security Checklist

- [ ] Authentication check on all API routes (`getServerSession`)
- [ ] LiveKit tokens generated server-side only (never client-side)
- [ ] R2 bucket public access disabled (use signed URLs only)
- [ ] LiveKit webhook requests verified with signature
- [ ] Rate limiting on API routes
- [ ] Room access control (participant list validation)
- [ ] Input validation and sanitization on all endpoints

---

## 📈 Future Enhancements

- [ ] **Breakout Rooms** — Small group rooms within a conference
- [ ] **Virtual Background** — AI-powered background blur/replacement
- [ ] **Real-time Translation** — Live AI translation via OpenRouter
- [ ] **Polls & Reactions** — Interactive elements during broadcasts
- [ ] **Screen Annotation** — Drawing tools on shared screens
- [ ] **Meeting Summary Email** — Auto-send transcript after call ends
- [ ] **Analytics Dashboard** — Call duration, participant stats, usage metrics

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

*Built with Next.js · LiveKit · PostgreSQL · OpenRouter · Cloudflare R2*