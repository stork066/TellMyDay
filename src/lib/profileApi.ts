import type { ProfileSection } from "../../api/src/shared/profile.js";

export type { ProfileSection };
export type ProfileSections = Record<ProfileSection, string>;

async function request(path: string, pin: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...init?.headers, "x-caretaker-pin": pin },
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(message || "Something went wrong. Please try again.");
  }
  return data;
}

export async function fetchProfile(pin: string): Promise<ProfileSections> {
  const data = (await request("/api/profile", pin)) as { sections: ProfileSections };
  return data.sections;
}

export async function saveProfileSection(
  pin: string,
  section: ProfileSection,
  content: string,
): Promise<void> {
  await request("/api/profile", pin, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, content }),
  });
}
