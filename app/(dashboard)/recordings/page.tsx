'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RecordingCard } from '@/components/shared/RecordingCard';
import { FileVideo, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecordingData {
  id: string;
  roomId: string;
  userId: string;
  r2Key: string;
  status: string;
  duration?: number;
  size?: number;
  startedAt: string;
  room: { name: string };
}

export default function RecordingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recording/list');
      const data = await res.json();
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchRecordings();
    }
  }, [session, fetchRecordings]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recordings</h1>
          <p className="text-slate-400 mt-1">Your past call recordings</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecordings}
          disabled={loading}
          className="border-white/10 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recordings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No recordings yet</p>
            <p className="text-sm mt-1">Recordings will appear here after you record a call</p>
          </div>
        ) : (
          recordings.map((rec) => (
            <RecordingCard
              key={rec.id}
              id={rec.id}
              roomId={rec.roomId}
              roomName={rec.room?.name || 'Unknown Room'}
              status={rec.status as 'PROCESSING' | 'READY' | 'FAILED'}
              duration={rec.duration}
              size={rec.size ? Number(rec.size) : undefined}
              startedAt={rec.startedAt}
            />
          ))
        )}
      </div>
    </div>
  );
}
