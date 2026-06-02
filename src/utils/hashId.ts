import Hashids from "hashids";

const hashids = new Hashids("kX9mP2vR7wQ4nL8jF5hT3yB6dA1cE0gU", 52);

export function encodeId(id: number | string): string {
  return hashids.encode(Number(id));
}

export function decodeId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? Number(decoded[0]) : null;
}
