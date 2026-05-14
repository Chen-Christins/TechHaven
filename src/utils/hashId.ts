import Hashids from "hashids";

const hashids = new Hashids("front-template-salt", 8);

export function encodeId(id: number | string): string {
  return hashids.encode(Number(id));
}

export function decodeId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? Number(decoded[0]) : null;
}
