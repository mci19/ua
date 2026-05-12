import { cookies } from "next/headers";
import type { Comment, RequestRow } from "@/lib/dataverse/types";

// Netlify Functions are serverless — each request can land on a different
// process, so module-scope state (even on globalThis) doesn't persist
// across requests. We keep the seed data in-memory and store user
// *mutations* in an httpOnly cookie. The cookie travels with the session
// and survives cold starts, so a request created on instance A is still
// visible when the redirect lands on instance B.
//
// NOTE on race conditions: mutateSnapshot() is read-modify-write and
// not serialised. Two parallel POSTs from the same session can clobber
// each other. Acceptable for a single-user demo flow; would need a real
// store (DB) for production scenarios — but production uses Dataverse
// directly, so this code path is never on the productive critical path.

const COOKIE_NAME = "ua_demo_state";
const MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

export interface DemoSnapshot {
  // Newly created requests (full row).
  newRequests: RequestRow[];
  // Per-id patches applied to existing (seed or new) requests.
  patchedRequests: Record<string, Partial<RequestRow>>;
  // Per-request comment timelines (replaces seed when present).
  newComments: Record<string, Comment[]>;
  // contactId -> ISO timestamp when SISA grant was set.
  sisaGranted: Record<string, string>;
}

export const EMPTY_SNAPSHOT: DemoSnapshot = {
  newRequests: [],
  patchedRequests: {},
  newComments: {},
  sisaGranted: {},
};

export async function readSnapshot(): Promise<DemoSnapshot> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<DemoSnapshot>;
    return {
      newRequests: parsed.newRequests ?? [],
      patchedRequests: parsed.patchedRequests ?? {},
      newComments: parsed.newComments ?? {},
      sisaGranted: parsed.sisaGranted ?? {},
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export async function writeSnapshot(snap: DemoSnapshot): Promise<void> {
  const jar = await cookies();
  const value = encodeURIComponent(JSON.stringify(snap));
  jar.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function mutateSnapshot(
  fn: (s: DemoSnapshot) => DemoSnapshot,
): Promise<DemoSnapshot> {
  const cur = await readSnapshot();
  const next = fn(cur);
  await writeSnapshot(next);
  return next;
}
