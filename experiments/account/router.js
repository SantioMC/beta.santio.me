const express = require('express');
const mongoose = require('mongoose');
const { requiresAuth } = require('../../database/database');
const router = express.Router();
const ratelimit = require('../../generic/ratelimit');
const { provided } = require('../../generic/middleware');
const { sendVerification } = require('../../generic/mail');
const crypto = require('crypto');

router.get('/verify', ratelimit(4), async (req, res) => {
	const { account, code } = req.query;
	if (account == null || code == null) return res.redirect('/account');

	const Account = mongoose.model('account');
	const user = await Account.findOne({ tag: account, verifyCode: code, verified: false });
	if (user == null) return res.send('This link has expired or does not exist!');

	user.verified = true;
	user.verifyCode = undefined;
	await user.save();

	res.send('Your account is now verified! You may now log in.');
});

// Routes
router
	.route('/')
	.get(requiresAuth, (req, res) => {
		var data = req.account;
		if (data == null) return res.status(500).json({ error: true, message: 'An unexpected error has occurred!' });

		// Protect personal information
		data['password'] = undefined;
		data['salt'] = undefined;
		if (!req.hasPermission('account', 'email')) data['email'] = undefined;
		if (!req.hasPermission('account', 'age')) data['age'] = undefined;

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
		res.json(req.account);
	})
	.delete(requiresAuth, ratelimit(1), async (req, res) => {
		if (!req.hasPermission('account', 'delete')) return res.status(401).send({ error: true, message: 'You are not permitted to delete this resource!' });
		if (!req.account.flags.includes('demo')) await req.account.delete();
		res.send({ error: false, message: 'Your account has been deleted! You are now signed out.' });
	})
	.post(ratelimit(10), provided('username', 'tag', 'email', 'password', 'age'), async (req, res) => {
		if (req.account != null) return res.status(401).send({ error: true, message: 'You are not allowed to do this at this time!' });
		const Account = mongoose.model('account');
		const { username, tag, email, password, age } = req.body;
		if (isNaN(age)) return res.status(400).send({ error: true, message: 'The age you provided is not a number!' });
		if (parseInt(age) < 13) return res.send({ error: true, message: 'You must be 13 or older to register an account!' });

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
			link: 'https://beta.santio.me/account/verify?account=' + tag + '&code=' + account.verifyCode
		});

		res.send({ error: false, message: 'Account registered. Please verify email.' });
	});

module.exports = router;
