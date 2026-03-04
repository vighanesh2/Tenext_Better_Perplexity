import { createHash } from "crypto";
import Redis from "ioredis";

const KEY_PREFIX = "research:";
const TTL_SECONDS = 3600; // 1 hour

function getClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url?.trim()) return null;
  try {
    return new Redis(url);
  } catch {
    return null;
  }
}

function cacheKey(query: string): string {
  const normalized = query.trim().toLowerCase();
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `${KEY_PREFIX}${hash}`;
}

export interface CachedResearchResult {
  summary: string;
  keyInsights: string[];
  contradictions: string[];
  confidence: number;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  limitations: string[];
}

export async function getCached(
  query: string
): Promise<CachedResearchResult | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const key = cacheKey(query);
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as CachedResearchResult;
  } catch {
    return null;
  } finally {
    client.quit().catch(() => {});
  }
}

export async function setCached(
  query: string,
  result: CachedResearchResult
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const key = cacheKey(query);
    await client.set(key, JSON.stringify(result), "EX", TTL_SECONDS);
  } catch {
    // ignore
  } finally {
    client.quit().catch(() => {});
  }
}
