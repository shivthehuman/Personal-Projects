import { createClient } from "redis";

export type RedisClient = Awaited<ReturnType<typeof createClient>>;

let redisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient | null> {
    if (redisClient) return redisClient;

    try {
        const client = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });

        client.on("error", (err) => console.error("Redis Client Error", err));
        client.on("connect", () => console.log("✅ Redis connected"));
        client.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));

        await client.connect();
        redisClient = client;
        return redisClient;
    } catch (err) {
        console.warn("⚠️  Redis connection failed, caching disabled:", err instanceof Error ? err.message : String(err));
        return null;
    }
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}

export async function getCached<T>(key: string): Promise<T | null> {
    const client = await getRedisClient();
    if (!client) return null;

    try {
        const value = await client.get(key);
        return value ? (JSON.parse(value) as T) : null;
    } catch (err) {
        console.error("Redis get error:", err);
        return null;
    }
}

export async function setCached<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) return false;

    try {
        const json = JSON.stringify(value);
        if (ttlSeconds) {
            await client.setEx(key, ttlSeconds, json);
        } else {
            await client.set(key, json);
        }
        return true;
    } catch (err) {
        console.error("Redis set error:", err);
        return false;
    }
}

export async function delCached(key: string): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) return false;

    try {
        await client.del(key);
        return true;
    } catch (err) {
        console.error("Redis del error:", err);
        return false;
    }
}

export async function delCachedPattern(pattern: string): Promise<boolean> {
    const client = await getRedisClient();
    if (!client) return false;

    try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(keys);
        }
        return true;
    } catch (err) {
        console.error("Redis del pattern error:", err);
        return false;
    }
}
