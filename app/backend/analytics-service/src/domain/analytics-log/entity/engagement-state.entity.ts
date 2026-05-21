import type { PostId } from '@drift/shared';
import type Signal from '../value-object/signal.value-object';

interface EngagementStateProps {
  postId: PostId;
  lastSignal: Signal;
  updatedAt: Date;
}

export interface CreateEngagementStateProps {
  postId: PostId;
  lastSignal: Signal;
}

export interface UpdateEngagementStateProps {
  lastSignal: Signal;
}

export default class EngagementState {
  private constructor(private props: EngagementStateProps) {}

  static reconstruct(props: EngagementStateProps): EngagementState {
    return new EngagementState(props);
  }

  static create(props: CreateEngagementStateProps): EngagementState {
    const updatedAt = new Date();

    const engagementState = new EngagementState({
      postId: props.postId,
      lastSignal: props.lastSignal,
      updatedAt,
    });

    return engagementState;
  }

  update(props: UpdateEngagementStateProps): void {
    if (this.props.lastSignal.equals(props.lastSignal)) return;
    this.props.updatedAt = new Date();
    this.props.lastSignal = props.lastSignal;
  }

  get postId(): PostId {
    return this.props.postId;
  }

  get lastSignal(): Signal {
    return this.props.lastSignal;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
