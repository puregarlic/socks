const {dirname} = require('path');

const fse = require('fs-extra');
const readPkgUp = require('read-pkg-up');

function get(opt) {
	if (opt && opt.path) {
		return opt.path;
	}

	const result = readPkgUp.sync();
	const pkgName = result.package.name;
	return `/tmp/node-socks-ipc/${pkgName}.sock`;
}

async function prepare(path) {
	await fse.ensureDir(dirname(path));
	await fse.remove(path);
}

module.exports = {
	get,
	prepare
};
