const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
	// Dates
	created: { type: Number, default: Date.now },
	expires: { type: Number, default: 86400000 },

	// Token Specifics
	code: String,
	type: { type: String, default: 'Bearer' },
	account: String,

	// Token Data
	authBy: { type: String, default: 'santio.me' },
	permissions: [String]
});
