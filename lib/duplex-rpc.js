const {promisify} = require('util')
const nanoid = require('nanoid')
const {default: PQueue} = require('p-queue')
const pDefer = require('p-defer')

const deserialize = require('./deserialize')

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
	const json = c => write(`${JSON.stringify(c)}\n`)

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
		for await (const chunk of deserialize(socket)) {
			const {id, method, params, error, result} = chunk

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
