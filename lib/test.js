import {promisify} from 'util'
import test from 'ava'
import nanoid from 'nanoid'
import {listen, connect} from '.'

//
test('default path', async t => {
	// Server side
	let value = 3
	const server = await listen({
		decrement: () => --value
	})

	// Client side
	const request = await connect()
	request('decrement')
	request('decrement')
	request('decrement')
	t.is(value, 3)

	await request('rpc.end')
	t.is(value, 0)
	server.close()
})

//
test('reverse direction', async t => {
	const sockId = nanoid()

	// Server side
	const server = await listen(request => {
		setImmediate(async () => {
			request('decrement')
			request('decrement')
			request('decrement')
			request('rpc.end')
		})

		return {
			neverCalled: () => {}
		}
	}, {sockId})

	// Client side
	let value = 3
	const request = await connect({
		decrement: () => --value
	}, {sockId})

	await request.promise
	t.is(value, 0)
	server.close()
})

//
test('bouncey bouncey', async t => {
	const sockId = nanoid()

	// Server side
	const server = await listen(r => ({
		one: async n => await r('two', n) + 1,
		three: async n => await r('four', n) + 3
	}), {sockId})

	// Client side
	const request = await connect(r => ({
		two: async n => await r('three', n) + 2,
		four: n => n + 4
	}), {sockId})

	t.is(await request('one', 3), 13)
	server.close()
})

//
test('multiple clients', async t => {
	const sockId = nanoid()
	const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

	// Server side
	const server = await listen(() => ({
		addOne: async n => {
			await delay(10)
			return n + 1
		}
	}), {sockId})

	// Clients
	const a = await connect({}, {sockId})
	const b = await connect({}, {sockId})
	server.close()

	const connections = promisify(server.getConnections.bind(server))
	t.is((await connections()), 2)

	const a3 = a('addOne', 3)
	const a4 = a('addOne', 4)
	const b5 = b('addOne', 5)
	const b6 = b('addOne', 6)

	t.is(await a3, 4)
	t.is(await b5, 6)

	await b('rpc.end')
	await t.throwsAsync(b('addOne', 7))

	t.is(await a4, 5)
	t.is(await b6, 7)

	a('rpc.end')
	await t.throwsAsync(a('addOne', 7))

	await a.promise
	await b.promise
})
