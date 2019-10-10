// This file is only used to check whether any TypeScript errors
// come up during normal usage

import { pipe, map } from 'wonka';
import { useStreamValue } from './index';

const x = useStreamValue(
  s => pipe(s, map(x => x * 2)),
  1,
  0
);

const y = useStreamValue(
  s => pipe(s, map(x => [x])),
  1,
  [0]
);

console.log(x + 1);
console.log(y[0] + 1);
