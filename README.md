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

const methods = (call, socket) => {
	fromFive: async n => await 5 - n
}

const server = await listen(methods)
```

```js
// client.js
const {connect} = require('@starburn/socks')

const call = await connect()
const two = await call('fromFive', 3)
console.log(`2 === ${two}`)
call('rpc.end')
```

### API

```js
const {listen, connect} = require('@starburn/socks')
listen(methods, options) // Promise<Server>
connect(methods, options) // Promise<Function>
```

`methods`
- Either object or a function returning object
- Keys are method names
- Values are async functions
- Both server and client can expose remote functions

`options`
- `options.path` can override the socket path used by Socks
- forwarded to [p-queue](https://github.com/sindresorhus/p-queue#pqueueoptions)
- forwarded to [Server](https://nodejs.org/api/net.html#net_class_net_server) and [Socket](https://nodejs.org/api/net.html#net_new_net_socket_options)

### Related

- [tedeh/jayson](https://github.com/tedeh/jayson)
- [elpheria/rpc-websockets](https://github.com/elpheria/rpc-websockets)
- [DirtyHairy/worker-rpc](https://github.com/DirtyHairy/worker-rpc)
