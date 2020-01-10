import { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useOperator } from './index';

const describeuseOperator = (wrapper: any) => {
  it('supports manual inputs', () => {
    let update: (x: number) => void;

    const { result } = renderHook(
      () => {
        const res = useOperator((s: any) => s, 0, 0);
        update = res[1];
        return res[0];
      },
      { wrapper }
    );

    expect(result.current).toBe(0);

    act(() => {
      update(1);
    });
    expect(result.current).toBe(1);
  });
};

describe('useOperator', () => describeuseOperator(undefined));
describe('useOperator (concurrent)', () => describeuseOperator(StrictMode));
