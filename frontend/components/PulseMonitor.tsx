"use client";

import React, { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';

export default function PulseMonitor() {
  const [logs, setLogs] = useState<{ id: string; text: string; time: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePulse = (text: string) => {
      setLogs((prev) => [
        ...prev,
        { id: Math.random().toString(36), text, time: new Date().toLocaleTimeString() }
      ].slice(-50)); // Keep last 50 logs
    };

    socket.on('pulse_event', handlePulse);

    return () => {
      socket.off('pulse_event', handlePulse);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black border border-green-900 rounded-lg overflow-hidden font-mono text-xs">
      <div className="bg-green-900/20 px-3 py-1 border-b border-green-900 text-green-500 flex justify-between">
        <span>SYSTEM_PULSE_MONITOR</span>
        <span className="animate-pulse">● LIVE</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 text-green-400 scrollbar-hide"
      >
        {logs.length === 0 && <div className="opacity-50 italic">Waiting for backend events...</div>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-green-700">[{log.time}]</span>
            <span className="break-all">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
