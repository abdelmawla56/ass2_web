import { createClient } from 'redis';

let client: ReturnType<typeof createClient>;
let subscriber: ReturnType<typeof createClient>;

export const initRedis = async () => {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  subscriber = client.duplicate();

  client.on('error', (err) => console.error('Redis Client Error', err));
  subscriber.on('error', (err) => console.error('Redis Subscriber Error', err));

  await client.connect();
  await subscriber.connect();
  
  console.log('Redis Connected');
};

export const getRedisClient = () => client;
export const getSubscriberClient = () => subscriber;
