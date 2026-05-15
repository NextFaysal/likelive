import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, summarizeTranscript } from '@/lib/openrouter';
import { prisma } from '@/lib/prisma';
import { getR2SignedUrl } from '@/lib/r2';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { recordingId } = await req.json();
  const recording = await prisma.recording.findUnique({ where: { id: recordingId } });

  if (!recording) {
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
  }

  try {
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
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}