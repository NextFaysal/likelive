'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RoomCard } from '@/components/shared/RoomCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Radio, Monitor, Plus, RefreshCw } from 'lucide-react';

type RoomType = 'ONE_TO_ONE' | 'BROADCAST' | 'CONFERENCE';

interface RoomData {
  id: string;
  name: string;
  description?: string;
  type: RoomType;
  status: string;
  livekitRoom: string;
  maxParticipants: number;
  isRecording: boolean;
  hostId: string;
  createdAt: string;
  participants: { id: string }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    type: 'CONFERENCE' as RoomType,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchRooms();
    }
  }, [session, fetchRooms]);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewRoom({ name: '', description: '', type: 'CONFERENCE' });
        fetchRooms();
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, {session.user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRooms}
            disabled={loading}
            className="border-white/10 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Room
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Create New Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createRoom} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Room Name</Label>
                <Input
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="My Video Call"
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Input
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Optional description"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Room Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'ONE_TO_ONE', icon: Video, label: '1-to-1' },
                    { type: 'BROADCAST', icon: Radio, label: 'Broadcast' },
                    { type: 'CONFERENCE', icon: Monitor, label: 'Conference' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewRoom({ ...newRoom, type: type as RoomType })}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        newRoom.type === type
                          ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Create Room
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="border-white/10 text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No rooms yet</p>
            <p className="text-sm mt-1">Create a room to start your first video call</p>
          </div>
        ) : (
          rooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              name={room.name}
              description={room.description}
              type={room.type}
              status={room.status as 'WAITING' | 'ACTIVE' | 'ENDED'}
              maxParticipants={room.maxParticipants}
              participantCount={room.participants?.length || 0}
              isRecording={room.isRecording}
              createdAt={room.createdAt}
            />
          ))
        )}
      </div>
    </div>
  );
}
