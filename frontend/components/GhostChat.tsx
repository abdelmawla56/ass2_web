"use client";

import React, { useState, useEffect, useRef } from 'react';
import { socket } from '@/lib/socket';

interface Message {
  sender: string;
  text: string;
  timestamp: number;
}

export default function GhostChat({ user, recipientUid }: { user: any, recipientUid: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deterministic Room ID (Sorted UIDs)
  const roomId = [user.uid, recipientUid].sort().join('_');

  useEffect(() => {
    socket.emit('join_room', roomId);

    socket.on('new_message', (msg: Message & { roomId: string }) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('room_expired', (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setMessages([]); // THE VOLATILITY TRIGGER
      }
    });

    return () => {
      socket.off('new_message');
      socket.off('room_expired');
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit('send_message', {
      recipientUid,
      message: input,
      user: { uid: user.uid, displayName: user.displayName }
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex justify-between items-center text-[10px] font-mono text-zinc-400">
        <span>GHOST_SESSION : {roomId.substring(0, 20)}...</span>
        <span className="animate-pulse text-orange-500">ACTIVE_WHISPER</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-zinc-700 italic">
            [WAITING_FOR_WHISPER...]
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-zinc-500">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
            <span className="text-orange-500 font-bold">[{msg.sender}]:</span>
            <span className="text-zinc-200">{msg.text}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2 items-center">
        <span className="text-orange-500 font-bold font-mono">{'>'}</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono text-zinc-200 placeholder:text-zinc-700 outline-none"
        />
        <button 
          type="submit"
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-bold transition-colors"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
