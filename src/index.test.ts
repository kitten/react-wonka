import { createElement as h, createContext, useContext, StrictMode, ReactNode } from 'react';
import { pipe, makeSubject, merge, map, delay } from 'wonka';
import { renderHook, act } from '@testing-library/react-hooks';
import { useStreamValue, useSubjectValue } from './index';

const describeUseStreamValue = (wrapper: any) => {
  it('supports immediately returned values', () => {
    let input = 0;

    const { result, rerender } = renderHook(
      () => useStreamValue(s => pipe(s, map(x => [x])), input, [-1]),
      { wrapper }
    );

    expect(result.current).toEqual([0]);

    input = 1;
    rerender();
    expect(result.current).toEqual([1]);
  });

  it('supports two immediately returned values', () => {
    let input = 0;

    const { result, rerender } = renderHook(
      () => {
        const resA = useStreamValue(s => pipe(s, map(x => 'a' + x)), input, 'a');
        const resB = useStreamValue(s => pipe(s, map(x => 'b' + x)), input, 'b');
        return [resA, resB];
      },
      { wrapper }
    );

    expect(result.current).toEqual(['a0', 'b0']);

    input = 1;
    rerender();
    expect(result.current).toEqual(['a1', 'b1']);
  });

  it('supports delayed updates', async () => {
    let input = 0;

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => useStreamValue(s => {
        return pipe(s, map(x => x + 1), delay(0));
      }, input, 0),
      { wrapper }
    );

    expect(result.current).toEqual(0);
    await waitForNextUpdate();
    expect(result.current).toEqual(1);

    input = 1;
    rerender();
    expect(result.current).toEqual(1);
    await waitForNextUpdate();
    expect(result.current).toEqual(2);
  });

  it('supports mixed synchronous and asynchronous updates', async () => {
    let input = 0;

    const { result, waitForNextUpdate, rerender } = renderHook(
      () => useStreamValue(s => merge([
        pipe(s, map(x => x + 1)),
        pipe(s, map(x => x + 2), delay(1))
      ]), input, 0),
      { wrapper }
    );

    expect(result.current).toEqual(1);
    await waitForNextUpdate();
    expect(result.current).toEqual(2);

    input = 1;
    rerender();
    expect(result.current).toEqual(2);
    await waitForNextUpdate();
    expect(result.current).toEqual(3);
  });

  it('supports passive updates', async () => {
    const [input$, next] = makeSubject<number>();
    const { result } = renderHook(
      () => useStreamValue(() => input$, 0, 0),
      { wrapper }
    );

    expect(result.current).toEqual(0);
    act(() => { next(1) });
    expect(result.current).toEqual(1);
  });

  it('ignores unchanging inputs', () => {
    let input = 0;

    const { result, rerender } = renderHook(
      () => useStreamValue(s => pipe(s, map(() => [])), input, []),
      { wrapper }
    );

    const first = result.current;
    input = 1;
    rerender();
    const second = result.current;
    expect(first).not.toBe(second);

    rerender();
    expect(result.current).toBe(second);
  });
};

describe('useStreamValue', () => describeUseStreamValue(undefined));
describe('useStreamValue (concurrent)', () => describeUseStreamValue(StrictMode));

const describeUseSubjectValue = (wrapper: any) => {
  it('supports manual inputs', () => {
    let update: (x: number) => void;

    const { result } = renderHook(
      () => {
        const res = useSubjectValue(s => s, 0, 0);
        update = res[1];
        return res[0];
      }, { wrapper }
    );

    expect(result.current).toBe(0);

    act(() => update(1));
    expect(result.current).toBe(1);
  });
};

describe('useSubjectValue', () => describeUseSubjectValue(undefined));
describe('useSubjectValue (concurrent)', () => describeUseSubjectValue(StrictMode));

it('correctly updates children', async () => {
  const OutputContext = createContext(0);

  const wrapper = ({ children }: { children?: ReactNode }) => {
    const res = useStreamValue(s => merge([
      pipe(s, map(x => x + 1)),
      pipe(s, map(x => x + 2), delay(1))
    ]), 0, 0);

    return h(OutputContext.Provider, { value: res }, children);
  };

  const { result, waitForNextUpdate } = renderHook(
    () => useContext(OutputContext),
    { wrapper }
  );

  expect(result.current).toEqual(1);

  await waitForNextUpdate();
  expect(result.current).toEqual(2);
});
