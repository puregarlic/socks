import test from 'ava';
import {server, client} from '.';
import {once} from 'events';
import {directory} from 'tempy';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//
test('finish by client', async t => {
	const path = directory();
	t.plan(2);

	const srv = await server({path}, ({call}) => {
		return {
			sol: async () => {
				t.is(await call('luna'), '🌙');
				return '☀️';
			}
		};
	});

	const {call, finish} = await client({path}, {
		luna: () => '🌙'
	});

	t.is(await call('sol'), '☀️');

	await finish();
	srv.close();
});

//
test('finish by server', async t => {
	const path = directory();
	t.plan(1);

	const srv = await server({path}, ({finish}) => {
		return {
			sol: async () => {
				setImmediate(async () => {
					await finish();
					srv.close();
				});
				return '☀️';
			}
		};
	});

	const {call} = await client({path});

	t.is(await call('sol'), '☀️');

	await once(srv, 'close');
});

//
test('finish waits for tasks', async t => {
	const path = directory();
	t.plan(3);

	const srv = await server({path}, () => ({
		dec: async () => {
			await delay(100);
			t.pass();
		}
	}));

	const {call, finish} = await client({path});

	call('dec');
	call('dec');
	call('dec');
	await finish();

	srv.close();
	await once(srv, 'close');
});

//
test('multiple parameters', async t => {
	const path = directory();

	const srv = await server({path}, {
		sol: async (a, b, c) => {
			t.is(a, '☀️');
			t.is(b, '🌙');
			t.is(c, '✨');
		}
	});

	const {call, finish} = await client({path});

	await call('sol', '☀️', '🌙', '✨');
	await finish();

	srv.close();
	await once(srv, 'close');
});

//
test('default path', async t => {
	const srv = await server({}, {sol: async () => '☀️'});
	const {call, finish} = await client();

	t.pass(await call('sol'), '☀️');
	await finish();

	srv.close();
	await once(srv, 'close');
});
