import type { RedisOptions } from "ioredis";

export interface RedisConfig {
  url: string;
  options: RedisOptions;
}

function getBaseOptions(): Partial<RedisOptions> {
  return {
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
  };
}

function parseUrlOptions(url: string): Partial<RedisOptions> {
  const options: Partial<RedisOptions> = {};
  const parsedUrl = new URL(url);

  // If username/password provided in URL
  if (parsedUrl.username || parsedUrl.password) {
    options.username = parsedUrl.username || undefined;
    options.password = parsedUrl.password || undefined;
  }

  // Database number from URL path
  if (parsedUrl.pathname && parsedUrl.pathname !== "/") {
    const db = parseInt(parsedUrl.pathname.slice(1));
    if (!isNaN(db)) {
      options.db = db;
    }
  }

  return options;
}

export function getRedisConfig(): RedisConfig {
  const url =
    process.env.REDIS_CONNECTION ||
    process.env.REDIS_URL ||
    "redis://localhost:6379";

  const options: RedisOptions = {
    ...getBaseOptions(),
    ...parseUrlOptions(url),
    maxRetriesPerRequest: 3,
  };

  return {
    url,
    options,
  };
}

/**
 * Redis configuration for BullMQ queues
 * BullMQ requires maxRetriesPerRequest: null
 */
export function getBullMQRedisConfig(): RedisConfig {
  const url =
    process.env.REDIS_CONNECTION ||
    process.env.REDIS_URL ||
    "redis://localhost:6379";

  const options: RedisOptions = {
    ...getBaseOptions(),
    ...parseUrlOptions(url),
    maxRetriesPerRequest: null, // Required by BullMQ
  };

  return {
    url,
    options,
  };
}
