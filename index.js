const net = require('net');
const path = require('path');

const fse = require('fs-extra');
const nanoid = require('nanoid');
const split = require('binary-split');
const parse = require('transform-parse');

// Platform-dependent socket/pipe path
function _path() {
	return '/tmp/node-socks-ipc/socks.sock';
}

// Platform-dependent server prepare
async function _prepare(options) {
	const sock = _path(options);
	await fse.ensureDir(path.dirname(sock));
	await fse.remove(sock);
}

function _send(socket, obj) {
	socket.write(`${JSON.stringify(obj)}\n`);
}

async function send(socket, type, data) {
	const syn = nanoid();
	_send(socket, {syn, type, data});
	return new Promise((resolve, reject) => {
		socket.once(`ok:${syn}`, resolve);
		socket.once(`bad:${syn}`, reject);
	});
}

async function recv(socket, handlers, {syn, awk, type, data, error}) {
	if (awk) {
		if (error) {
			socket.emit(`bad:${awk}`, error);
		} else {
			socket.emit(`ok:${awk}`, data);
		}
	} else {
		try {
			const result = await handlers[type](data);
			_send(socket, {awk: syn, data: result});
			socket.emit('reply', syn);
		} catch (error) {
			_send(socket, {awk: syn, error});
			socket.emit('error', error);
		}
	}
}

async function setup(socket, handlers) {
	socket
		.pipe(split('\n'))
		.pipe(parse())
		.on('data', obj => recv(socket, handlers, obj));
}

async function listen(handlers = {}, options = {}, fn) {
	await _prepare(options);
	const server = net.createServer(options, fn);
	server.on('connection', socket => setup(socket, handlers));
	return new Promise((resolve, reject) => {
		server.once('error', error => reject(error));
		server.listen(_path(options), () => {
			resolve({
				server,
				done: () => new Promise(resolve => server.close(resolve))
			});
		});
	});
}

async function connect(handlers = {}, options = {}) {
	return new Promise((resolve, reject) => {
		const socket = net.createConnection(_path(options));
		socket.once('error', error => reject(error));
		socket.once('connect', () => {
			setup(socket, handlers);
			resolve({
				socket,
				send: (type, data) => send(socket, type, data),
				done: () => new Promise(resolve => socket.end(resolve))
			});
		});
	});
}

module.exports = {
	listen,
	connect
};
