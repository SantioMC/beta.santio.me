const express = require('express');
const mongoose = require('mongoose');
const { requiresAuth } = require('../../database/database');
const router = express.Router();
const ratelimit = require('express-rate-limit');

// Rate Limit
const harshLimit = ratelimit({
	windowMs: 60000,
	max: 2,
	handler: (_req, res) => {
		return res.status(429).json({ error: true, message: 'You have reached the rate limit!' });
	}
});

// Routes
router
	.route('/')
	.get(requiresAuth, (req, res) => {
		var data = req.account;
		if (data == null) return res.status(500).json({ error: true, message: 'An unexpected error has occurred!' });

		// Protect personal information
		data['password'] = undefined;
		if (!req.hasPermission('account', 'email')) data['email'] = undefined;
		if (!req.hasPermission('account', 'age')) data['age'] = undefined;

		if (!req.hasPermission('account', 'info')) {
			data['roles'] = undefined;
			data['flags'] = undefined;
			data['suspended'] = undefined;
			data['verifyCode'] = undefined;
		}

		if (!req.hasPermission('metrics', 'info')) data['metrics'] = undefined;

		// Request feedback
		data.error = false;
		data.message = '';

		// Send result
		res.json(req.account);
	})
	.delete(requiresAuth, harshLimit, async (req, res) => {
		if (!req.hasPermission('account', 'delete')) return res.status(401).send({ error: true, message: 'You are not permitted to delete this resource!' });
		if (!req.account.flags.includes('demo')) await req.account.delete();
		res.send({ error: false, message: 'Your account has been deleted! You are now signed out.' });
	});

module.exports = router;
