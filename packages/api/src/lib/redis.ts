import Redis from "ioredis";

let redisInstance: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisInstance) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisInstance.on("error", (error: Error) => {
      console.error("Redis connection error:", error);
    });

    redisInstance.on("connect", () => {
      console.log("Redis connected successfully");
    });

    redisInstance.on("disconnect", () => {
      console.log("Redis disconnected");
    });
  }

  return redisInstance;
}

export async function closeRedisConnection() {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}