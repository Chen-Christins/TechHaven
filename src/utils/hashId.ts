import Hashids from "hashids";

export type HashIdScope = "article" | "assignment" | "bug" | "organization" | "repo" | "requirement" | "task" | "user";

const BASE_SALT = "kX9mP2vR7wQ4nL8jF5hT3yB6dA1cE0gU";
const MIN_LENGTH = 52;
const legacyHashids = new Hashids(BASE_SALT, MIN_LENGTH);
const scopedHashids = new Map<HashIdScope, Hashids>();

function getHashids(scope?: HashIdScope): Hashids {
  if (!scope) return legacyHashids;

  const cached = scopedHashids.get(scope);
  if (cached) return cached;

  const hashids = new Hashids(`${BASE_SALT}:${scope}`, MIN_LENGTH);
  scopedHashids.set(scope, hashids);
  return hashids;
}

export function encodeId(id: number | string, scope?: HashIdScope): string {
  return getHashids(scope).encode(Number(id));
}

export function decodeId(hash: string, scope?: HashIdScope): number | null {
  const decoded = getHashids(scope).decode(hash);
  if (decoded.length > 0) return Number(decoded[0]);

  if (!scope) return null;

  const legacyDecoded = legacyHashids.decode(hash);
  return legacyDecoded.length > 0 ? Number(legacyDecoded[0]) : null;
}

export function decodeScopedId(hash: string, scope: HashIdScope): number | null {
  const decoded = getHashids(scope).decode(hash);
  return decoded.length > 0 ? Number(decoded[0]) : null;
}
