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
const server = await listen(methods, options)
const request = await connect(methods, options)
```

`methods`
- Both server and client can expose remote functions to each other
- Can be either an `Object` or a `Function` returning an object
- Keys are method names
- Values are async functions

`options`
- `/tmp/node-socks-ipc/${pkgName}.sock` is the default path
- `\\?\pipe\node-socks-ipc\${pkgName}.sock` is the win32 path
- `options.sockId` overrides `pkgName` in the path
- `options.path` overrides the whole socket path
- forwarded to [p-queue](https://github.com/sindresorhus/p-queue#pqueueoptions)
- forwarded to [Server](https://nodejs.org/api/net.html#net_class_net_server) and [Socket](https://nodejs.org/api/net.html#net_new_net_socket_options)

### Related

- [tedeh/jayson](https://github.com/tedeh/jayson)
- [elpheria/rpc-websockets](https://github.com/elpheria/rpc-websockets)
- [DirtyHairy/worker-rpc](https://github.com/DirtyHairy/worker-rpc)
