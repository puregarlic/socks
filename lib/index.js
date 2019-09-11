const net = require('net');
const {once} = require('events');
const {promisify} = require('util');
const {PassThrough} = require('stream');

const nanoid = require('nanoid');
const {default: PQueue} = require('p-queue');

const {serialize, deserialize} = require('./serialization');
const {get, prepare} = require('./paths');

//
function twoWay(socket, opt, methodsFn) {
	const outbound = new PassThrough({objectMode: true});
	const write = promisify(outbound.write.bind(outbound));
	serialize(outbound, socket);

	async function call(method, ...params) {
		const id = nanoid();
		await write({id, method, params});
		const [error, result] = await once(socket, id);
		if (error) {
			throw error;
		} else {
			return result;
		}
	}

	async function finish() {
		await call('rpc.empty');
		outbound.end();
		await once(socket, 'finish');
	}

	const queue = new PQueue(opt);
	const exposed = {call, finish};
	const methods = methodsFn(exposed);

	async function receiver() {
		for await (const obj of deserialize(socket)) {
			const {id, method, params, result, error} = obj;

			switch (method) {
				case undefined:
					// Assume a response
					socket.emit(id, error, result);
					continue;

				case 'rpc.empty':
					// Stop processing requests until queue fully resolved
					await queue.onIdle();
					await write({id});
					continue;

				default:
					// Process request eventually
					queue.add(async () => {
						try {
							const result = await methods[method](...params);
							await write({id, result});
						} catch (error) {
							await write({id, error});
						}
					});
			}
		}
	}

	receiver();

	return exposed;
}

//
async function server(opt = {}, methods) {
	const path = get(opt);
	await prepare(path);
	const srv = net.createServer(opt);
	srv.on('connection', socket => twoWay(socket, opt, methods));
	return new Promise((resolve, reject) => {
		srv.once('error', reject);
		srv.once('listening', () => resolve(srv));
		srv.listen(path);
	});
}

//
function client(opt = {}, methods) {
	const path = get(opt);
	const socket = net.createConnection({...opt, path});
	return twoWay(socket, opt, methods);
}

module.exports = {
	server,
	client
};
