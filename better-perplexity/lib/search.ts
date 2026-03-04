import { tavily } from "@tavily/core";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content: string;
}

const SNIPPET_MAX_LENGTH = 250;

function truncateSnippet(text: string, maxLength: number = SNIPPET_MAX_LENGTH): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

function deduplicateByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.url.toLowerCase().trim();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export async function search(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to your environment variables."
    );
  }

  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("Query must be a non-empty string.");
  }

  try {
    const client = tavily({ apiKey });
    const response = await client.search(query.trim(), {
      maxResults: 10,
      searchDepth: "basic",
    });

    if (!response?.results || !Array.isArray(response.results)) {
      return [];
    }

    const deduplicated = deduplicateByUrl(response.results);
    const top5 = deduplicated.slice(0, 5);

    return top5.map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: truncateSnippet(r.content ?? ""),
      content: r.content ?? "",
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    throw new Error(`Search error: ${message}`);
  }
}
