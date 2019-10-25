const {platform} = require('os')
const {dirname, join} = require('path')
const fsp = require('fs').promises

const readPkgUp = require('read-pkg-up')

async function getPath(options) {
	if (options && options.path) {
		return options.path
	}

	const result = await readPkgUp()
	const pkgName = result.package.name
	const base = platform() === 'win32' ? '\\\\?\\pipe' : '/tmp'

	return join(base, 'node-socks-ipc', `${pkgName}.sock`)
}

module.exports = async (options, ensure) => {
	const path = await getPath(options)

	if (ensure) {
		await fsp.mkdir(dirname(path), {recursive: true})
		try {
			await fsp.unlink(path)
		} catch (error) {
			if (error.code !== 'ENOENT') {
				throw error
			}
		}
	}

	return path
}
