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

module.exports.requiresAuth = async (req, res, next) => {
	if (req.tokenData == null || module.exports.getAccount(req) == null) return res.status(401).send({ error: true, message: 'You are not authenticated!' });
	next();
};

module.exports.requiresAdmin = async (req, res, next) => {
	if (req.account == null) return res.status(401).send({ error: true, message: 'You are not authenticated!' });
	if (!account.roles.includes('admin')) return res.status(403).send({ error: true, message: 'You are not permitted to view this resource!' });
	next();
};
