const mongoose = require('mongoose');
const crypto = require('crypto');
const Metric = require('./metrics/metric');

module.exports = new mongoose.Schema({
	// Generics
	name: String,
	tag: String,

	// Account Information
	email: String,
	password: String,
	salt: String,
	age: Number,

	// Dates
	created: { type: Number, default: Date.now },
	updated: { type: Number, default: -1 },

	// Settings
	roles: [String],
	flags: [String],
	suspended: { type: String, default: '' },
	verified: { type: Boolean, default: false },
	verifyCode: String,

	// Experiments
	metrics: [Metric]
});

module.exports.pre('save', function (next) {
	if (this.updated != -1) return next();
	this.salt = crypto.randomBytes(32).toString('hex');
	this.password = crypto.pbkdf2Sync(this.password, this.salt, 1000, 64, 'sha512').toString('hex');
	this.updated = Date.now();
	next();
});

module.exports.methods.validatePassword = async function (password) {
	if (!password || !this.salt || !this.password) return false;
	return this.password == crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};
