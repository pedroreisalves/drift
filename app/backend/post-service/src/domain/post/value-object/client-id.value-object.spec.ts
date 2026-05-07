import { uuidv7 } from 'uuidv7';
import ClientId from './client-id.value-object';
import { InvalidValueObjectError } from '../../@shared/error/invalid-value-object.error';

describe('ClientId', () => {
  it('should create a ClientId with a valid uuidv7', () => {
    const value = uuidv7();

    const clientId = new ClientId(value);

    expect(clientId).toBeInstanceOf(ClientId);
    expect(clientId.toString()).toEqual(value);
  });

  it('should throw an error when value is not a valid uuid', () => {
    expect(() => new ClientId('not-a-uuid')).toThrow(InvalidValueObjectError);
    expect(() => new ClientId('not-a-uuid')).toThrow('Invalid ClientId: not-a-uuid');
  });

  it('should throw an error when value is an empty string', () => {
    expect(() => new ClientId('')).toThrow(InvalidValueObjectError);
    expect(() => new ClientId('')).toThrow('Invalid ClientId: ');
  });

  it('should throw an error when value is a uuidv4 instead of uuidv7', () => {
    const uuidv4Value = '550e8400-e29b-41d4-a716-446655440000';

    expect(() => new ClientId(uuidv4Value)).toThrow(InvalidValueObjectError);
    expect(() => new ClientId(uuidv4Value)).toThrow(`Invalid ClientId: ${uuidv4Value}`);
  });

  it('should return true when comparing two ClientIds with the same value', () => {
    const value = uuidv7();

    const a = new ClientId(value);
    const b = new ClientId(value);

    expect(a.equals(b)).toBe(true);
  });

  it('should return false when comparing two ClientIds with different values', () => {
    const a = new ClientId(uuidv7());
    const b = new ClientId(uuidv7());

    expect(a.equals(b)).toBe(false);
  });
});
