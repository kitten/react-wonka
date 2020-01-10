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
- Synchronous / Asynchronous updates

It's very common to create a Wonka source using [`makeSubject`](https://wonka.kitten.sh/api/sources#makesubject)
from a changing prop. Or you may also be subscribing (and unsubscribing) to a new source every time some
kind of input or prop changes.

Wonka streams can additionally be synchronous or asynchronous, so integrating them correctly into
React's updates, while taking advantage of synchronous results is hard, and especially complicated with
Concurrent Mode.

This library exposes a two hooks to solve this problem, **useSubjectValue** and **useStreamValue**.

## API

### `useOperator`

```js
const [result, update] = useOperator(makeStream, input, init);
```

This hook is the same as `useStreamValue`, but it returns the `result`
and an `update` function.

The `update` function can be used to force an additional value to be sent
to the internal stream that `makeStream` receives. It's like `useReducer`'s
dispatch function or like a `forceUpdate` function.

This can be an effective replacement for `useReducer` that can integrate
asynchronous side-effects or complex changes cleanly.
