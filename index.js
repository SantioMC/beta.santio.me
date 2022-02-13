require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { resolve } = require('path');
const { getTokenData, getAccount, getToken } = require('./database/database');
const ratelimit = require('./generic/ratelimit');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use(ratelimit(300));

// Create account middleware
app.all('*', async (req, _res, next) => {
	req.token = getTokenData(req);
	req.tokenData = await getToken(req.token);
	req.account = await getAccount(req);
	req.hasPermission = (...args) => {
		for (i in args) {
			if (i == 0) continue;
			var permission = args.slice(0, i).join(':');
			if (req.tokenData.permissions.includes(permission + ':*')) return true;
		}
		return req.tokenData.permissions.includes(permission) || req.tokenData.permissions.includes('*');
	};
	next();
});

// Register Routes
app.use('/metrics', require('./experiments/metrics/router'));
app.use('/account', require('./experiments/account/router'));

// Register 404
app.get('/*', (req, res) => {
	res.status(404).send({
		error: true,
		message: 'Invalid experiment! Did you mean to go to the home page?',
		home_page: 'https://santio.me'
	});
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
