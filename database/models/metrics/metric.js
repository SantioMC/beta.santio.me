const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
	name: String,
	mongo_uri: String,
	flags: [String],
	created: { type: String, default: Date.now }
});
