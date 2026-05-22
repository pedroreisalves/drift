import { InvalidValueObjectError } from '@drift/shared';
import Signal, { SignalEnum } from './signal.value-object';

describe('Signal', () => {
  it.each(Object.values(SignalEnum))('should create a Signal with valid value "%s"', (value) => {
    const signal = new Signal(value);

    expect(signal).toBeInstanceOf(Signal);
    expect(signal.toString()).toBe(value);
  });

  it('should throw when value is not one of the allowed signals', () => {
    expect(() => new Signal('invalid' as never)).toThrow(InvalidValueObjectError);
    expect(() => new Signal('invalid' as never)).toThrow('Invalid Signal: invalid');
  });

  it('should throw when value is an empty string', () => {
    expect(() => new Signal('' as never)).toThrow(InvalidValueObjectError);
    expect(() => new Signal('' as never)).toThrow('Invalid Signal: ');
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
