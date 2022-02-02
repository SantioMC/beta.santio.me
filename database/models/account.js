const mongoose = require('mongoose');
const Metric = require('./metrics/metric');

module.exports = new mongoose.Schema({
	// Generics
	name: String,
	tag: String,

	// Account Information
	email: String,
	password: String,
	age: Number,

	// Dates
	created: { type: String, default: Date.now },
	updated: { type: String, default: -1 },

	// Settings
	roles: [String],
	flags: [String],
	suspended: { type: Boolean, default: false },
	verified: { type: Boolean, default: false },
	verifyCode: String,

	// Experiments
	metrics: [Metric]
});
