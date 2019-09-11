import test from 'ava';
import {serialize, deserialize} from '.';
import {PassThrough} from 'stream';

test('three values', async t => {
	async function * someObjects() {
		yield null;
		yield 1;
		yield {two: 2};
		yield [3, 3, 3];
	}

	const tube = new PassThrough();
	serialize(someObjects(), tube);
	const iterable = deserialize(tube);

	t.is((await iterable.next()).value, null);
	t.is(typeof (await iterable.next()).value, 'number');
	t.is(typeof (await iterable.next()).value, 'object');
	t.true(Array.isArray((await iterable.next()).value));
	t.true((await iterable.next()).done);
});
