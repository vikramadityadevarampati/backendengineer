import { createClient } from 'redis';

let redisClient: any = null;
let connectionAttempted = false;

export async function initRedis() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('🔌 Redis not configured. Cache will be disabled.');
    return;
  }

  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err: Error) => {
      console.warn('⚠️ Redis connection error:', err.message);
      // Don't set redisClient to null here as it might reconnect
    });

    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.warn('❌ Failed to connect to Redis:', (err as Error).message);
    redisClient = null; // Ensure client is null on connection failure
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    try {
      await redisClient.disconnect();
      redisClient = null;
      connectionAttempted = false;
    } catch (err) {
      console.warn('Error disconnecting Redis:', (err as Error).message);
    }
  }
}

// Legacy CacheService for backward compatibility
export class CacheService {
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    try {
      return await client.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      await client.setEx(key, ttlSeconds, value);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async disconnect(): Promise<void> {
    await disconnectRedis();
  }
}

export const cacheService = new CacheService();