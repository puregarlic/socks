# Socks

> Clean and fresh IPC communication

### Install

```shell
npm i @starburn/socks
```

### Usage

This example pairs a daemon and temporary client.

```js
// server.js
const {listen} = require('@starburn/socks')

const methods = () => {
	fromFive: async n => await 5 - n
};

await listen(methods);
```

```js
// client.js
const {connect} = require('@starburn/socks')

const call = await connect();
const two = await call('fromFive', 3);
await call('rpc.end')
```

### API

```js
server(options, methods) // Promise<Server>
client(options, methods) // {call, finish}
```

`options`
- `options.path` can override the socket path used by Socks
- forwarded to [p-queue](https://github.com/sindresorhus/p-queue#pqueueoptions)
- forwarded to [Server](https://nodejs.org/api/net.html#net_class_net_server) and [connect](https://nodejs.org/api/net.html#net_net_connect)

`methods`
- Is a function called once a connection is made
- Returns an object with method definitions
- Keys are the names of methods to call
- Values are the async functions themselves

### Related

- [tedeh/jayson](https://github.com/tedeh/jayson)
- [elpheria/rpc-websockets](https://github.com/elpheria/rpc-websockets)
- [DirtyHairy/worker-rpc](https://github.com/DirtyHairy/worker-rpc)
