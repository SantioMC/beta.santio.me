const { redirect } = require('express/lib/response');
const mongoose = require('mongoose');

var database = null;

(async () => {
	database = await mongoose.connect(process.env.MONGO_URI);
	console.log('[Database] Successfully established connection');

	// Account Models
	database.model('account', require('./models/account'));
	database.model('token', require('./models/token'));
	database.model('key', require('./models/key'));
})();

module.exports.getTokenData = (req) => {
	var header = req.headers.authorization || '';
	if (header == '' && req.signedCookies['token'] != undefined) header = `Bearer ${req.signedCookies['token']}`;
	var data = header.split(' ');
	if (data.length != 2) return { type: '', code: '' };
	return {
		type: data[0],
		code: data[1]
	};
};

module.exports.getAccount = async (req) => {
	if (database == null) return null;
	var token = await module.exports.getToken(module.exports.getTokenData(req));
	if (token == null) return null;
	return await database.model('account').findOne({ tag: token.account });
};

module.exports.getToken = async (token) => {
	if (database == null) return null;
	var reqToken = await database.model('token').findOne({ type: token.type, code: token.code });
	return reqToken;
};

module.exports.requiresAuth = (redirect) => {
	return async (req, res, next) => {
		const acc = await module.exports.getAccount(req);
		if (req.tokenData == null || acc == null) {
			if (redirect != null) return res.redirect(redirect);
			else return res.status(401).send({ error: true, message: 'You are not authenticated!' });
		}
		if (acc.suspended != '' && req.baseUrl != '/account/logout' && !req.baseUrl.startsWith('/api/')) return res.redirect('/suspended');
		next();
	};
};

module.exports.requiresAdmin = async (req, res, next) => {
	if (req.account == null) return res.status(401).send({ error: true, message: 'You are not authenticated!' });
	if (!account.roles.includes('admin')) return res.status(403).send({ error: true, message: 'You are not permitted to view this resource!' });
	next();
};

module.exports.waitForDatabase = async (req, res, next) => {
	if (database == null)
		return res.status(500).send({
			error: true,
			message: 'Failed to establish a connection with the database! Try again later.'
		});
	next();
};

module.exports.embedData = async (req, res, next) => {
	if (database == null) return next();
	req.token = module.exports.getTokenData(req);
	req.tokenData = await module.exports.getToken(req.token);
	req.account = await module.exports.getAccount(req);
	req.hasPermission = (...args) => {
		if (req.tokenData == null) return false;
		for (i in args) {
			if (i == 0) continue;
			var permission = args.slice(0, i).join(':');
			if (req.tokenData.permissions.includes(permission + ':*')) return true;
		}
		return req.tokenData.permissions.includes(permission) || req.tokenData.permissions.includes('*');
	};

	// Cookie Middleware
	req.setCookie = (key, value) => {
		res.cookie(key, value, {
			maxAge: 2592000000,
			secure: process.env.STATE == 'PRODUCTION',
			signed: true,
			httpOnly: true
		});
	};

	req.readCookie = (key) => {
		return req.signedCookies[key];
	};

	next();
};
