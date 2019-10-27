const {promisify} = require('util')
const nanoid = require('nanoid')
const {default: PQueue} = require('p-queue')
const pDefer = require('p-defer')

const stream2json = require('./stream-to-json')

module.exports = function (socket, methodsSrc, options) {
	const queue = new PQueue(options)
	const pending = {}

	socket.once('end', () => {
		const error = new Error('end')
		for (const id of Object.keys(pending)) {
			pending[id].reject(error)
		}
	})

	const write = promisify(socket.write.bind(socket))
	const json = request => write(`${JSON.stringify(request)}\n`)

	const request = async (method, ...params) => {
		const id = nanoid()
		pending[id] = pDefer()
		await json({id, method, params})
		return pending[id].promise
	}

	const methods = typeof methodsSrc === 'function' ?
		methodsSrc(request, socket) :
		methodsSrc

	const loop = async () => {
		for await (const object of stream2json(socket)) {
			const {id, method, params, error, result} = object

			switch (method) {
				case undefined:
					// Assume a response message
					if (error) {
						pending[id].reject(error)
					} else {
						pending[id].resolve(result)
					}

					break

				case 'rpc.end':
					// Block parsing loop by awaiting
					await queue.onIdle()
					await json({id})
					socket.end()
					break

				default:
					// Add task without awaiting
					queue.add(async () => {
						try {
							const result = await methods[method](...params)
							await json({id, result})
						} catch (error_) {
							await json({id, error: error_})
						}
					})
			}
		}
	}

	return {request, loop}
}
