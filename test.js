import test from 'ava';
import {listen, connect} from '.';

test('client awaits server function', async t => {
	t.plan(4);

	// Server side

	const serverHandlers = {
		five: async n => {
			t.is(n, 3);
			await new Promise(resolve => setImmediate(resolve));
			return 5 - n;
		}
	};

	const {done: doneServer} = await listen(serverHandlers, {}, socket => {
		t.pass();
		socket.on('end', () => t.pass());
	});

	// Client side

	const {send, done: doneClient} = await connect();
	const result = await send('five', 3);
	t.is(result, 2);

	// Cleanup

	await doneClient();
	await doneServer();
});
