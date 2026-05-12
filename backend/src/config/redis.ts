import { createClient } from 'redis';

let client: any;
let subscriber: any;

const createMockRedis = () => {
  const store = new Map<string, any>();
  const timeouts = new Map<string, NodeJS.Timeout>();

  const mock = {
    connect: async () => console.log('Mock Redis Connected'),
    on: (event: string, cb: Function) => {},
    sAdd: async (key: string, val: string) => {
      if (!store.has(key)) store.set(key, new Set());
      store.get(key).add(val);
    },
    sRem: async (key: string, val: string) => {
      if (store.has(key)) store.get(key).delete(val);
    },
    sMembers: async (key: string) => {
      return Array.from(store.get(key) || []);
    },
    lPush: async (key: string, val: string) => {
      if (!store.has(key)) store.set(key, []);
      store.get(key).unshift(val);
    },
    expire: async (key: string, ttl: number) => {
      if (timeouts.has(key)) clearTimeout(timeouts.get(key)!);
      const timeout = setTimeout(() => {
        store.delete(key);
        // Simulate expiration event if subscriber exists
        if (subscriber && subscriber.emitExpired) {
           subscriber.emitExpired(key);
        }
      }, ttl * 1000);
      timeouts.set(key, timeout);
    },
    configSet: async () => {},
    duplicate: () => {
      const sub = {
        connect: async () => {},
        on: (event: string, cb: Function) => {},
        subscribe: async (channel: string, cb: Function) => {
          sub.cb = cb;
        },
        emitExpired: (key: string) => {
          if (sub.cb) sub.cb(key);
        },
        cb: null as any
      };
      return sub;
    },
    isMock: true
  };
  return mock;
};

export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  if (redisUrl === 'mock') {
    console.warn('Using IN-MEMORY MOCK Redis as requested.');
    client = createMockRedis();
    subscriber = client.duplicate();
    await client.connect();
    return;
  }

  try {
    const tempClient = createClient({ 
      url: redisUrl,
      socket: { connectTimeout: 2000 }
    });
    
    tempClient.on('error', (err: any) => {
      if (!client || !client.isMock) console.error('Redis Client Error', err);
    });
    
    await tempClient.connect();
    client = tempClient;
    subscriber = client.duplicate();
    await subscriber.connect();
    console.log('Redis Connected');
  } catch (error) {
    console.warn('Failed to connect to Redis within 2s. Falling back to IN-MEMORY MOCK.');
    client = createMockRedis();
    subscriber = client.duplicate();
    await client.connect();
  }
};

export const getRedisClient = () => client;
export const getSubscriberClient = () => subscriber;
