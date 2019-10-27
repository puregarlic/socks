const {Server, Socket} = require('net')
const {once} = require('events')

const preparePath = require('./prepare-path')
const duplexRPC = require('./duplex-rpc')

exports.listen = async (methods, options) => {
	const path = await preparePath(options, true)
	const server = new Server(options)
	server.on('connection', s => duplexRPC(s, methods, options).loop())
	server.listen(path)
	await once(server, 'listening')
	return server
}

exports.connect = async (methods, options) => {
	const path = await preparePath(options, false)
	const client = new Socket(options)
	const {request, loop} = duplexRPC(client, methods, options)
	request.promise = loop()
	request.client = client
	client.connect(path)
	await once(client, 'connect')
	return request
}
