import Redis from "ioredis";
import { getRedisConfig, getBullMQRedisConfig } from "../config/redis";

let redisInstance: Redis | null = null;
let bullMQRedisInstance: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisInstance) {
    const config = getRedisConfig();
    redisInstance = new Redis(config.url, config.options);

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

/**
 * Get a Redis connection configured for BullMQ
 * BullMQ requires maxRetriesPerRequest: null
 */
export function getBullMQRedisConnection(): Redis {
  if (!bullMQRedisInstance) {
    const config = getBullMQRedisConfig();
    bullMQRedisInstance = new Redis(config.url, config.options);

    bullMQRedisInstance.on("error", (error: Error) => {
      console.error("BullMQ Redis connection error:", error);
    });

    bullMQRedisInstance.on("connect", () => {
      console.log("BullMQ Redis connected successfully");
    });

    bullMQRedisInstance.on("disconnect", () => {
      console.log("BullMQ Redis disconnected");
    });
  }

  return bullMQRedisInstance;
}

export async function closeRedisConnection() {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
  if (bullMQRedisInstance) {
    await bullMQRedisInstance.quit();
    bullMQRedisInstance = null;
  }
}
