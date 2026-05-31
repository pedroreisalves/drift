import { ClientHash, InvalidValueObjectError } from '../../index';

const VALID = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
const OTHER = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('ClientHash', () => {
  it('should create an ClientHash with a valid 64-char lowercase hex string', () => {
    const clientHash = new ClientHash(VALID);

    expect(clientHash).toBeInstanceOf(ClientHash);
    expect(clientHash.toString()).toEqual(VALID);
  });

  it('should throw when value is a uuidv7 instead of a hash', () => {
    const uuid = '0190f1aa-bbbb-7ccc-8ddd-eeeeeeeeeeee';

    expect(() => new ClientHash(uuid)).toThrow(InvalidValueObjectError);
    expect(() => new ClientHash(uuid)).toThrow(`Invalid ClientHash: ${uuid}`);
  });

  it('should throw when value is uppercase hex', () => {
    const upper = VALID.toUpperCase();

    expect(() => new ClientHash(upper)).toThrow(InvalidValueObjectError);
    expect(() => new ClientHash(upper)).toThrow(`Invalid ClientHash: ${upper}`);
  });

  it('should throw when value is an empty string', () => {
    expect(() => new ClientHash('')).toThrow(InvalidValueObjectError);
    expect(() => new ClientHash('')).toThrow('Invalid ClientHash: ');
  });

  it('should return true when comparing two ClientHashs with the same value', () => {
    expect(new ClientHash(VALID).equals(new ClientHash(VALID))).toBe(true);
  });

  it('should return false when comparing two ClientHashs with different values', () => {
    expect(new ClientHash(VALID).equals(new ClientHash(OTHER))).toBe(false);
  });
});
