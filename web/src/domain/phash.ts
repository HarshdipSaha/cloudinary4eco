const HEX64 = /^[0-9a-f]{16}$/i;

export function hamming(a: string, b: string): number | null {
  if (!HEX64.test(a) || !HEX64.test(b)) return null;
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (x > 0n) {
    count += Number(x & 1n);
    x >>= 1n;
  }
  return count;
}
