import { InvalidValueObjectError } from '@drift/shared';
import Signal, { SignalEnum } from './signal.value-object';

describe('Signal', () => {
  it.each(Object.values(SignalEnum))(
    'should create a signal value object with valid value "%s"',
    (value) => {
      const signal = new Signal(value);

      expect(signal).toBeInstanceOf(Signal);
      expect(signal.toString()).toEqual(value);
    },
  );

  it('should throw an error when creating a signal with invalid type', () => {
    const invalidSignal = 'invalid' as unknown as SignalEnum;

    expect(() => new Signal(invalidSignal)).toThrow(InvalidValueObjectError);
    expect(() => new Signal(invalidSignal)).toThrow(/Invalid Signal/);
  });

  it('should return true when comparing equal signals', () => {
    const signal1 = new Signal(SignalEnum.raised);
    const signal2 = new Signal(SignalEnum.raised);

    expect(signal1.equals(signal2)).toBe(true);
  });

  it('should return false when comparing different signals', () => {
    const signal1 = new Signal(SignalEnum.raised);
    const signal2 = new Signal(SignalEnum.dropped);

    expect(signal1.equals(signal2)).toBe(false);
  });
});
