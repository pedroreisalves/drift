import { uuidv7 } from 'uuidv7';
import { PostId } from '@drift/shared';
import EngagementState, {
  type CreateEngagementStateProps,
  type UpdateEngagementStateProps,
} from './engagement-state.entity';
import Signal, { SignalEnum } from '../value-object/signal.value-object';

describe('EngagementState', () => {
  const makeProps = (
    overrides: Partial<CreateEngagementStateProps> = {},
  ): CreateEngagementStateProps => ({
    postId: new PostId(uuidv7()),
    lastSignal: new Signal(SignalEnum.dropped),
    ...overrides,
  });

  const makeUpdateProps = (
    overrides: Partial<UpdateEngagementStateProps> = {},
  ): UpdateEngagementStateProps => ({
    lastSignal: new Signal(SignalEnum.raised),
    ...overrides,
  });

  it('should create an engagement state entity', () => {
    const props = makeProps();

    const engagementState = EngagementState.create(props);

    expect(engagementState).toBeInstanceOf(EngagementState);
    expect(engagementState.postId).toEqual(props.postId);
    expect(engagementState.lastSignal).toEqual(props.lastSignal);
  });

  it('should update the signal', () => {
    const engagementState = EngagementState.create(makeProps());
    const updateProps = makeUpdateProps({ lastSignal: new Signal(SignalEnum.dropped) });

    engagementState.update(updateProps);

    expect(engagementState.lastSignal).toEqual(updateProps.lastSignal);
  });

  it('should not mutate state when update is called with the same signal', () => {
    const signal = new Signal(SignalEnum.raised);
    const engagementState = EngagementState.create(makeProps({ lastSignal: signal }));

    engagementState.update({ lastSignal: new Signal(SignalEnum.raised) });

    expect(engagementState.lastSignal.toString()).toBe(SignalEnum.raised);
  });

  it('should update signal with different values', () => {
    const engagementState = EngagementState.create(makeProps());
    const signals = Object.values(SignalEnum);

    signals.forEach((signal) => {
      engagementState.update({ lastSignal: new Signal(signal) });
      expect(engagementState.lastSignal.toString()).toEqual(signal);
    });
  });

  it('should reconstruct an engagement state entity from existing properties', () => {
    const postId = new PostId(uuidv7());
    const lastSignal = new Signal(SignalEnum.raised);

    const engagementState = EngagementState.reconstruct({ postId, lastSignal });

    expect(engagementState).toBeInstanceOf(EngagementState);
    expect(engagementState.postId).toEqual(postId);
    expect(engagementState.lastSignal).toEqual(lastSignal);
  });
});
