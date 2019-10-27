const {platform} = require('os')
const {dirname, join} = require('path')
const {mkdir, unlink} = require('fs').promises
const readPkgUp = require('read-pkg-up')

const IS_SOCKET_FILE = platform() !== 'win32'

async function getPath(options) {
	if (options && options.path) {
		return options.path
	}

	const result = await readPkgUp()
	const fileId = options.sockId || result.package.name

	if (!fileId) {
		// This is the method to uniquely pair client and server
		// So, it is necessary until another solution comes up.
		throw new Error('options.fileId or package.json name required')
	}

	const prefix = IS_SOCKET_FILE ? '\\\\?\\pipe' : '/tmp'

	return join(prefix, 'node-socks-ipc', `${fileId}.sock`)
}

module.exports = async (options, ensure) => {
	const path = await getPath(options)

	if (IS_SOCKET_FILE && ensure) {
		await mkdir(dirname(path), {recursive: true})
		try {
			await unlink(path)
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}
	}

	return path
}
