import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initRedis, getRedisClient, getSubscriberClient } from './config/redis.js';
import { verifyToken } from './middlewares/auth.js';
import { User } from './models/User.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Hybrid Ephemeral Messenger' });
});

// Socket.io logic
io.on('connection', async (socket) => {
  console.log('A user connected:', socket.id);

  // Presence logic: Store user UID in Redis Set when they connect
  socket.on('register_presence', async (uid) => {
    const redisClient = getRedisClient();
    await redisClient.sAdd('online_users', uid);
    socket.userUid = uid; // Store on socket object for disconnect cleanup
    
    const activeUsers = await redisClient.sMembers('online_users');
    io.emit('active_users_update', activeUsers);
    io.emit('pulse_event', `[SOCKET]: User ${uid} is now ACTIVE.`);
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    io.emit('pulse_event', `[SOCKET]: User joined room ${roomId}`);
  });

  socket.on('send_message', async ({ recipientUid, message, user }) => {
    const redisClient = getRedisClient();
    
    // Deterministic Room ID (Sorted UIDs joined by underscore)
    const roomId = [user.uid, recipientUid].sort().join('_');
    const key = `chat:${roomId}`;
    const ttl = parseInt(process.env.REDIS_TTL || '120');

    const messagePayload = {
      sender: user.displayName || user.uid,
      text: message,
      timestamp: Date.now(),
    };

    // LPUSH and EXPIRE
    await redisClient.lPush(key, JSON.stringify(messagePayload));
    await redisClient.expire(key, ttl);

    io.to(user.uid).to(recipientUid).emit('new_message', { ...messagePayload, roomId });
    io.emit('pulse_event', `[REDIS]: Key '${key}' updated (TTL: ${ttl}s)`);
    io.emit('pulse_event', `[SOCKET]: Message routed to private room ${roomId}`);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (socket.userUid) {
      const redisClient = getRedisClient();
      await redisClient.sRem('online_users', socket.userUid);
      
      const activeUsers = await redisClient.sMembers('online_users');
      io.emit('active_users_update', activeUsers);
      io.emit('pulse_event', `[SOCKET]: User ${socket.userUid} went OFFLINE.`);
    }
  });
});

// Redis Expiration Listener
const setupRedisListener = async () => {
  const subscriber = getSubscriberClient();
  // Enable keyspace notifications if not already enabled
  const client = getRedisClient();
  await client.configSet('notify-keyspace-events', 'Ex');

  await subscriber.subscribe('__keyevent@0__:expired', (key) => {
    if (key.startsWith('chat:')) {
      const roomId = key.split(':')[1];
      io.emit('room_expired', { roomId });
      io.emit('pulse_event', `[GHOST]: TTL reached 0 for ${key}. Redis memory purged.`);
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();
    await initRedis();
    await setupRedisListener();

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
