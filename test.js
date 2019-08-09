import test from 'ava';
import func from '.';

test('foo', t => {
	t.is(func(), true);
});
