'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  roomId: string;
  onClose: () => void;
}

export function ChatPanel({ roomId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { localParticipant } = useLocalParticipant();

  const { send } = useDataChannel('chat', (msg) => {
    const decoded = JSON.parse(new TextDecoder().decode(msg.payload));
    setMessages((prev) => [...prev, decoded]);
  });

  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`);
        const data = await res.json();
        if (data.messages) {
          const history: ChatMessage[] = data.messages.map((m: { id: string; user?: { name: string }; content: string; createdAt: string }) => ({
            id: m.id,
            sender: m.user?.name || 'Unknown',
            content: m.content,
            timestamp: new Date(m.createdAt).getTime(),
          }));
          setMessages(history);
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchHistory();
  }, [roomId]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender: localParticipant.name || 'Unknown',
      content,
      timestamp: Date.now(),
    };

    // Send via LiveKit DataChannel (real-time)
    send(new TextEncoder().encode(JSON.stringify(message)), { reliable: true });

    // Save to DB
    fetch(`/api/chat/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }).catch(console.error);

    setMessages((prev) => [...prev, message]);
    setInput('');
  }, [roomId, localParticipant, send]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/95 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="font-semibold text-white text-sm sm:text-base">Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <Send className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1 opacity-60">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="group">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-purple-400">{msg.sender}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">{msg.content}</p>
                <div className="h-px bg-white/5 mt-3 group-last:hidden" />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-purple-500/50 h-9 sm:h-10"
        />
        <Button
          type="submit"
          size="icon"
          className="bg-purple-600 hover:bg-purple-700 h-9 w-9 sm:h-10 sm:w-10 transition-all active:scale-95"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}