/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */

import {
  useReducer,
  useRef,
  useEffect,
  useLayoutEffect,
  Dispatch,
} from 'react';

import { Subject, Operator, makeSubject, subscribe, pipe } from 'wonka';

import {
  CallbackNode,
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_IdlePriority as idlePriority,
} from 'scheduler';

type TeardownFn = () => void;

interface State<R, T = R> {
  subject: Subject<T>;
  onValue: Dispatch<R>;
  teardown: null | TeardownFn;
  task: null | CallbackNode;
  value: R;
}

const isServerSide = typeof window === 'undefined';
const useIsomorphicEffect = !isServerSide ? useLayoutEffect : useEffect;

export const useOperatorValue = <T, R>(
  fn: Operator<T, R>,
  input: T,
  init: R
): R => useOperator<T, R>(fn, input, init)[0];
/**
 * Creates a stream of `input` as it's changing and pipes this stream
 * into the operator which creates what becomes the output of this hook.
 *
 * This hooks supports creating a synchronous, stateful value that is
 * updated immediately on mount and is then updated using normal effects.
 * It has been built to be safe for normal-mode, concurrent-mode,
 * strict-mode and suspense.
 */
export const useOperator = <T, R>(
  operator: Operator<T, R>,
  input: T,
  init?: R
): [R, Dispatch<T>] => {
  const subscription = useRef<State<R, T>>({
    subject: makeSubject<T>(),
    value: init as R,
    onValue: (value: R) => {
      // Before the effect triggers we update the initial value synchronously
      subscription.current.value = value;
    },
    teardown: null,
    task: null,
  });

  // This is called from effects to update the current output value
  const [, setValue] = useReducer((x: number, value: R) => {
    subscription.current.value = value;
    return x + 1;
  }, 0);

  // On mount, subscribe to the operator using the subject and schedule a teardown using scheduler (1)
  if (subscription.current.teardown === null) {
    // Start the subscription using the subject and operator
    const { unsubscribe } = pipe(
      operator(subscription.current.subject.source),
      subscribe((value: R) => subscription.current.onValue(value))
    );

    // Send the initial input value to the operator; this may call `onValue` synchronously
    subscription.current.subject.next(input);

    if (isServerSide) {
      unsubscribe();
    } else {
      // Update the current teardown to now be the subscription's unsubcribe function
      subscription.current.teardown = unsubscribe as TeardownFn;
      // See (1): We schedule a teardown on mount that is cancelled by useLayoutEffect,
      // unless we're not expecting effects to run at all and the component not to be
      // rendered, which means this callback won't be cancelled and will unsubscribe.
      subscription.current.task = scheduleCallback(
        idlePriority,
        () => {
          if (subscription.current.teardown) {
            subscription.current.teardown();
            subscription.current.teardown = null;
          }
        }
      );
    }
  }

  // We utilise useLayoutEffect to cancel the scheduled teardown again
  // This works because A) useLayoutEffect runs synchronously after mount
  // during the commit phase, and B) if it runs we know that useEffect
  // is also going to run.
  useIsomorphicEffect(() => {
    // Cancel the scheduled teardown
    if (subscription.current.task !== null) {
      cancelCallback(subscription.current.task);
    }

    // On unmount we call the teardown manually to stop the subscription
    return () => {
      if (subscription.current.teardown !== null) {
        subscription.current.teardown();
      }
    };
  }, []);

  useEffect(() => {
    const isInitial = subscription.current.onValue !== setValue;
    // Once the effect runs, we update onValue to update this component properly
    // instead of mutating
    subscription.current.onValue = setValue;

    // If the subscription got cancelled, which may happen during long suspense phases (?),
    // we restart it here without scheduling a teardown
    if (subscription.current.teardown === null) {
      subscription.current.teardown = pipe(
        operator(subscription.current.subject.source),
        subscribe(setValue)
      ).unsubscribe as TeardownFn;
    }

    // If the input value has changed (except during the initial mount) we send it to the operator
    // This may call `setValue` which schedules an update
    if (!isInitial) {
      subscription.current.subject.next(input);
    }
  }, [input]);

  return [subscription.current.value, subscription.current.subject.next];
};
