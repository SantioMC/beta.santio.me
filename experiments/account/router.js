const express = require('express');
const router = express.Router();
const { resolve } = require('path');
const { requiresAuth } = require('../../database/database');

router.get('/', requiresAuth('/account/login'), (req, res) => {
	res.sendFile(resolve(`${__dirname}/pages/account/index.html`));
});

router.get('/settings', requiresAuth('/account/settings'), (req, res) => {
	res.sendFile(resolve(`${__dirname}/pages/account/settings.html`));
});

router.get('/login', (req, res) => {
	if (req.readCookie('token')) return res.redirect('/account');
	res.sendFile(resolve(`${__dirname}/pages/login.html`));
});

router.get('/logout', async (req, res) => {
	if (req.tokenData) await req.tokenData.delete();
	res.clearCookie('token');
	res.redirect('/account/login');
});

module.exports = router;
