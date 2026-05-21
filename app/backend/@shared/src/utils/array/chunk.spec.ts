import { chunk } from './chunk';

describe('chunk', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('puts the remainder in the last chunk when the array does not divide evenly', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when size is larger than the array', () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it('returns a single chunk when size equals the array length', () => {
    expect(chunk([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it('returns an empty array when given an empty array', () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it('returns one-element chunks when size is 1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it('works with non-primitive types', () => {
    const a = { id: 1 };
    const b = { id: 2 };
    const c = { id: 3 };
    expect(chunk([a, b, c], 2)).toEqual([[a, b], [c]]);
  });
});
