import test from 'ava';
import {get} from '.';

test('default path uses package', async t => {
	t.is(await get(), '/tmp/node-socks-ipc/@starburn/socks.sock');
});
