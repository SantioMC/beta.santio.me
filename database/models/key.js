const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
	// Dates
	created: { type: Date, default: Date.now },
	expires: { type: Number, default: 86400000 },

	// Token Specifics
	code: String,
	account: String,

	// Token Data
	disabled: { type: Boolean, default: false },
	permissions: [String]
});
