import type { ReadingLevel, StoryResponse } from "../../api/src/shared/story.js";

export type { ReadingLevel, StoryResponse };

export async function generateStory(
  symbolIds: string[],
  readingLevel: ReadingLevel,
): Promise<StoryResponse> {
  let res: Response;
  try {
    res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbolIds, readingLevel }),
    });
  } catch {
    throw new Error("Couldn't reach the story writer. Check your connection and try again.");
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message || "Something went wrong. Please try again.");
  }
  return data as StoryResponse;
}
