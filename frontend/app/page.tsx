"use client";

import React, { useState, useEffect } from "react";
import { auth, provider, signInWithPopup } from "@/lib/firebase";
import { socket } from "@/lib/socket";
import GhostChat from "@/components/GhostChat";
import PulseMonitor from "@/components/PulseMonitor";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [recipientUid, setRecipientUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        socket.connect();
        socket.emit('register_presence', currentUser.uid);
      } else {
        socket.disconnect();
      }
    });

    socket.on('active_users_update', (users: string[]) => {
      setActiveUsers(users);
    });

    return () => {
      unsubscribe();
      socket.off('active_users_update');
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono">
      INITIALIZING_HYBRID_CORE...
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-zinc-300 p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white italic">
            HYBRID_<span className="text-orange-500 underline">EPHEMERAL</span>_MESSENGER
          </h1>
          <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">
            Status: Identity_Verified // Data_Volatility_Active
          </p>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
            <img src={user.photoURL || ""} alt="" className="w-8 h-8 rounded-full border border-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{user.displayName}</span>
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] text-zinc-500 hover:text-red-500 text-left uppercase"
              >
                Terminate_Session
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            className="bg-white text-black font-black px-6 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105"
          >
            VERIFY_IDENTITY
          </button>
        )}
      </header>

      {user ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
          {/* Main Chat Area */}
          <div className="lg:col-span-2 flex flex-col h-full">
            {recipientUid ? (
              <GhostChat user={user} recipientUid={recipientUid} />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-zinc-800 rounded-lg bg-zinc-900/20 text-zinc-600 font-mono italic">
                [SELECT_RECIPIENT_TO_START_PRIVATE_WHISPER]
              </div>
            )}
          </div>

          {/* Presence Area */}
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-1/2">
              <div className="bg-zinc-800 px-3 py-1 border-b border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                Presence_Pulse
              </div>
              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2">
                {activeUsers.filter(u => u !== user.uid).length === 0 && (
                  <div className="text-zinc-700 italic">No other ghosts active...</div>
                )}
                {activeUsers.filter(u => u !== user.uid).map((uid) => (
                  <button 
                    key={uid}
                    onClick={() => setRecipientUid(uid)}
                    className={`w-full text-left p-2 rounded border transition-colors ${recipientUid === uid ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                  >
                    ● {uid.substring(0, 12)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <PulseMonitor />
            </div>
          </div>
          
          {/* Info Card */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg text-[10px] font-mono text-zinc-500 space-y-2 h-fit">
            <p className="text-zinc-400 font-bold">IDENTITY_PROTOCOL:</p>
            <p>UID: {user.uid}</p>
            <p className="mt-4 text-zinc-400 font-bold">VOLATILITY_PROTOCOL:</p>
            <p>Messages auto-purge from Redis after 2 minutes of inactivity.</p>
            <p className="text-orange-900 mt-2 font-black underline">END_TO_END_TRANSIENCE_ENABLED</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-zinc-800 rounded-2xl">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
             <span className="text-4xl">👻</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Identity Check Required</h2>
            <p className="text-zinc-500 max-w-xs mt-2 mx-auto">
              You must verify your identity via Google OAuth to enter the ephemeral void. 
              Only metadata is persisted; conversations are strictly transient.
            </p>
          </div>
          <button 
            onClick={handleLogin}
            className="bg-orange-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            VERIFY_AND_ENTER
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-6 text-[10px] text-zinc-700 font-mono flex justify-between">
        <span>© 2026 HYBRID_MESSENGER_CORE</span>
        <span>ENCRYPTION_LAYER_v1.0.4_ACTIVE</span>
      </footer>
    </main>
  );
}
