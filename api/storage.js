// Unified storage adapter for Upstash/Vercel KV (REST) and local Redis
// Usage: const { getJSON, setJSON } = require('./storage');
// - If KV_REST_API_URL and KV_REST_API_TOKEN (or Upstash equivalents) are set, uses @vercel/kv
// - Else if REDIS_URL is set, uses ioredis
// - Else falls back to in-memory (not recommended for prod)

let provider = 'memory';
let kv = null;
let redis = null;

const hasVercelKV = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
) || Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

if (hasVercelKV) {
  try {
    ({ kv } = require('@vercel/kv'));
    provider = 'vercel-kv';
    // @vercel/kv reads env vars automatically
    // KV_REST_API_URL / KV_REST_API_TOKEN or Upstash equivalents
    // No extra init needed
    // console.log('Storage: using Vercel KV');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to init @vercel/kv, falling back to Redis/memory:', e.message);
  }
}

if (!kv && process.env.REDIS_URL) {
  try {
    const IORedis = require('ioredis');
    redis = new IORedis(process.env.REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    provider = 'redis';
    // console.log('Storage: using Redis at', process.env.REDIS_URL);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to init ioredis, falling back to memory:', e.message);
  }
}

// Simple in-memory fallback (dev-only)
const memoryStore = new Map();

async function getJSON(key) {
  if (provider === 'vercel-kv') {
    try {
      return (await kv.get(key)) || null;
    } catch (e) {
      console.error('KV get error:', e);
      return null;
    }
  }
  if (provider === 'redis') {
    try {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch (e) {
      console.error('Redis get error:', e);
      return null;
    }
  }
  return memoryStore.get(key) ?? null;
}

async function setJSON(key, value) {
  if (provider === 'vercel-kv') {
    try {
      await kv.set(key, value);
      return true;
    } catch (e) {
      console.error('KV set error:', e);
      return false;
    }
  }
  if (provider === 'redis') {
    try {
      await redis.set(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Redis set error:', e);
      return false;
    }
  }
  memoryStore.set(key, value);
  return true;
}

module.exports = { getJSON, setJSON };
