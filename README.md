# `react-wonka`

Several hooks to effectively use [Wonka](https://wonka.kitten.sh) streams with [React](https://reactjs.org/).

<br>
  <a href="https://npmjs.com/package/react-wonka">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/react-wonka.svg" />
  </a>
  <a href="https://github.com/kitten/react-wonka/actions">
    <img alt="Test Status" src="https://github.com/kitten/react-wonka/workflows/CI/badge.svg" />
  </a>
  <a href="https://codecov.io/gh/kitten/react-wonka">
    <img alt="Test Coverage" src="https://codecov.io/gh/kitten/react-wonka/branch/master/graph/badge.svg" />
  </a>
  <a href="https://bundlephobia.com/result?p=react-wonka">
    <img alt="Minified gzip size" src="https://img.shields.io/bundlephobia/minzip/react-wonka.svg?label=gzip%20size" />
  </a>
<br>

Wonka streams are an effective way to abstract streams (or rather "sources") of changing
values. When integrating them with React it's likely that your code will mostly look
the same every time, since you'll be handling:

- Some kind of changing prop or other input
- Subscribing and unsubscribing
- Safety around React Concurrent Mode
- Cooperating with React's effects and scheduling system

It's very common to create a Wonka source using [`makeSubject`](https://wonka.kitten.sh/api/sources#makesubject)
from a changing prop. Or you may also be subscribing (and unsubscribing) to a new source every time some
kind of input or prop changes.

Wonka streams can additionally be synchronous or asynchronous, so integrating them correctly into
React's updates, while taking advantage of synchronous results is hard, and especially complicated with
Concurrent Mode.

This library exposes two hooks to solve this problem, **useOperator** and **useOperatorValue**.
The latter is just a convenience alias for the first.

## API

### `useOperator`

```js
const [result, update] = useOperator(makeStream, input, init);
```

This hook is the same as `useOperatorValue`, but it returns the `result`
and an `update` function.

The `update` function can be used to force an additional value to be sent
to the internal stream that `makeStream` receives. It's like `useReducer`'s
dispatch function or like a `forceUpdate` function.

This can be an effective replacement for `useReducer` that can integrate
asynchronous side-effects or complex changes cleanly.

### `useOperatorValue`

```js
const result = useOperatorValue(makeStream, input, init);
```

Returns a stateful value that has been produced by a stream, which emits the
changing `input` values.

The hook accepts a `makeStream` function which is called once using an input
Wonka stream. This stream will synchronously receive `input` every time it
changes and on initial mount.

You can then use any [Wonka operator](https://wonka.kitten.sh/api/operators) to
transform this input stream and return a new stream. The values that your
stream emits will be returned as `result`.

The `init` argument determines the initial value for `result`, in case your
stream is asynchronous. It's important to provide some kind of value for it
so that your stream may also emit values at a later point, while React is
allowed to keep rendering immediately.

You can use both asynchronous or synchronous streams (or mixed ones) with
this hook. It will correctly return synchronous values immediately, while
triggering updates for asynchronous ones.

```js
import { pipe, map, delay, merge } from 'wonka';
import { useOperatorValue } from 'react-wonka';
useOperatorValue(
  x =>
    merge([
      pipe(
        x,
        map(x => x + 1)
      ),
      pipe(
        x,
        map(x => x + 2),
        delay(10)
      ),
    ]),
  input,
  0
);
// For input = 0 this returns:
// - `1` immediately
// - then updates and returns `2` after 10ms
```
