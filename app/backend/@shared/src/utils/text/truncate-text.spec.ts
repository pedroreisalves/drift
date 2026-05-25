import { truncateText } from './truncate-text';

describe('truncateText', () => {
  it('should return the text unchanged when it is within the limit', () => {
    expect(truncateText('Short text.', 200)).toBe('Short text.');
  });

  it('should return the text unchanged when it is exactly at the limit', () => {
    const text = 'x'.repeat(200);
    expect(truncateText(text, 200)).toBe(text);
  });

  it('should truncate the text and append … when it exceeds the limit', () => {
    const text = 'x'.repeat(201);
    const result = truncateText(text, 200);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toBe(text);
  });

  it('should trim trailing whitespace before the ellipsis', () => {
    const text = 'x'.repeat(199) + ' extra words here';
    const result = truncateText(text, 200);
    expect(result.endsWith('…')).toBe(true);
    expect(result).not.toMatch(/ …$/);
  });
});
