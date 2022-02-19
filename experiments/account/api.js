const express = require('express');
const mongoose = require('mongoose');
const { requiresAuth } = require('../../database/database');
const router = express.Router();
const ratelimit = require('../../generic/ratelimit');
const { provided } = require('../../generic/middleware');
const { sendVerification } = require('../../generic/mail');
const crypto = require('crypto');

// Routes
router
	.route('/')

	// Fetch User
	.get(requiresAuth('/account/login'), async (req, res) => {
		const Token = mongoose.model('token');

		// Fetch data
		var data = req.account.toObject();

		// Fetch token data
		var tokens = await Token.find({ account: data.tag });

		// Remove useless information
		data['__v'] = undefined;
		data['_id'] = undefined;

		// Protect personal information
		data['password'] = undefined;
		data['salt'] = undefined;
		if (!req.hasPermission('account', 'email')) data['email'] = undefined;
		if (!req.hasPermission('account', 'age')) data['age'] = undefined;
		if (req.hasPermission('account', 'sessions')) data['sessionCount'] = tokens.length;

		if (!req.hasPermission('account', 'info')) {
			data['roles'] = undefined;
			data['flags'] = undefined;
			data['suspended'] = undefined;
			data['verified'] = undefined;
			data['verifyCode'] = undefined;
		}

		if (!req.hasPermission('metrics', 'info')) data['metrics'] = undefined;

		// Request feedback
		data.error = false;
		data.message = '';

		// Send result
		res.json(data);
	})

	// Delete User
	.delete(requiresAuth(), ratelimit(1), async (req, res) => {
		if (!req.hasPermission('account', 'delete')) return res.status(401).send({ error: true, message: 'You are not permitted to delete this resource!' });

		const Token = mongoose.model('token');
		if (!req.account.flags.includes('demo')) {
			await req.account.delete();
			await Token.deleteMany({ account: req.account.tag });
		}
		res.send({ error: false, message: 'Your account has been deleted! You are now signed out.' });
	})

	// Create User
	.post(ratelimit(5), provided('username', 'tag', 'email', 'password', 'age'), async (req, res) => {
		if (req.account != null) return res.status(401).send({ error: true, message: 'You are not allowed to do this at this time!' });
		const Account = mongoose.model('account');
		const { username, tag, email, password, age } = req.body;

		if (isNaN(age)) return res.status(400).send({ error: true, message: 'The age you provided is not a number!' });
		if (parseInt(age) < 13) return res.status(400).send({ error: true, message: 'You must be 13 or older to register an account!' });

		if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i.test(email)) return res.status(400).send({ error: true, message: 'Please enter a valid email address!' });
		if (/^[a-z0-9]{3,8}$/.test(tag)) return res.status(400).send({ error: true, message: 'Tags must be between 3 and 8 characters and should contain no capitals!' });
		if (/^[A-Z0-9]{3,16}$/i.test(tag)) return res.status(400).send({ error: true, message: 'Your username must be between 3 and 16 characters!' });

		var exists = await Account.findOne({ tag });
		if (exists) return res.status(400).send({ error: true, message: 'An account already has the provided tag!' });

		var exists = await Account.findOne({ email });
		if (exists) return res.status(400).send({ error: true, message: 'An account already exists with this email!' });

		const account = new Account({
			name: username,
			tag: tag,
			email: email,
			password: password,
			age: parseInt(age),
			verifyCode: crypto.randomBytes(64).toString('hex')
		});
		await account.save();

		// Send email
		sendVerification(email, {
			name: username,
			link: `https://beta.santio.me/api/account/verify?account=${tag}&code=${account.verifyCode}`
		});

		res.status(201).send({ error: false, message: 'Account registered. Please verify email.' });
	});

// Verify User
router.get('/verify', ratelimit(4), async (req, res) => {
	const { account, code } = req.query;
	if (account == null || code == null) return res.redirect('/account');

	const Account = mongoose.model('account');
	const user = await Account.findOne({ tag: account, verifyCode: code, verified: false });
	if (user == null) return res.status(404).send('This link has expired or does not exist!');

	user.verified = true;
	user.verifyCode = undefined;
	await user.save();

	res.send('Your account is now verified! You may now log in.');
});

// Login User
router.post('/login', provided('email', 'password'), ratelimit(10), async (req, res) => {
	const { email, password } = req.body;

	const Account = mongoose.model('account');
	const Token = mongoose.model('token');
	const user = await Account.findOne({ email });
	if (user == null) return res.status(404).send({ error: true, message: 'Invalid email or password!' });

	const passwordValid = await user.validatePassword(password);
	if (!passwordValid) return res.status(404).send({ error: true, message: 'Invalid email or password!' });

	if (!user.verified) return res.status(400).send({ error: true, message: 'Please verify your email before logging in!' });
	if (user.flags.includes('demo')) return res.status(400).send({ error: true, message: 'You may not log in to demo accounts!' });

	// Create a token
	const token = new Token({
		code: crypto.randomBytes(32).toString('hex'),
		account: user.tag,
		permissions: ['*']
	});

	await token.save();
	req.setCookie('token', token.code);

	res.send({ error: false, message: 'Login successful', token: token.code });
});

// Delete all sessions
router.delete('/sessions', requiresAuth(), ratelimit(1), async (req, res) => {
	if (!req.hasPermission('account', 'sessions')) return res.status(401).send({ error: true, message: 'You are not permitted to delete this resource!' });

	const Token = mongoose.model('token');
	if (!req.account.flags.includes('demo')) await Token.deleteMany({ account: req.account.tag });

	res.send({ error: false, message: 'All sessions belonging to this account have been deleted. Please log in again.' });
});

module.exports = router;
