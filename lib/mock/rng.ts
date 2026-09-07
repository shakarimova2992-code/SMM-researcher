// Детерминированный псевдослучайный генератор: один и тот же запрос (ниша+город,
// или username) всегда даёт одинаковый результат — ощущается как "настоящие данные",
// а не рандом при каждом клике.

export function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(key: string) {
  return mulberry32(hashString(key));
}

export function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

export function pickMany<T>(rand: () => number, arr: T[], count: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length) % pool.length;
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randFloat(rand: () => number, min: number, max: number, digits = 2): number {
  const v = rand() * (max - min) + min;
  return Number(v.toFixed(digits));
}
