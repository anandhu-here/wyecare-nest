export interface Event<T = any> {
  readonly type: string;
  readonly timestamp: Date;
  readonly payload: T;
}

export type EventHandler = (event: Event) => void;
