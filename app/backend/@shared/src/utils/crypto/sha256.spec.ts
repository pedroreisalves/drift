import { sha256Hex } from './sha256';

describe('sha256Hex', () => {
  it('returns the known SHA-256 hex for a known input', () => {
    expect(sha256Hex('test')).toBe(
      '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    );
  });

  it('returns 64 lowercase hex chars', () => {
    const ref = sha256Hex('0190f1aa-bbbb-7ccc-8ddd-eeeeeeeeeeee');
    expect(ref).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes a known input to its stable SHA-256', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
