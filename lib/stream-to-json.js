module.exports = async function * (iterable) {
	const chunks = []
	const nl = () => chunks[chunks.length - 1].indexOf(10)

	for await (const chunk of iterable) {
		chunks.push(chunk)

		// Keep yielding as long as newlines exist
		for (let i = nl(); i >= 0; i = nl()) {
			const chunk = chunks.pop()
			const grab = chunk.slice(0, i)
			const keep = chunk.slice(i + 1)

			const all = Buffer.concat([...chunks, grab])
			chunks.length = 0
			chunks.push(keep)

			yield JSON.parse(all)
		}
	}
}
