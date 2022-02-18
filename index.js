require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const { waitForDatabase, embedData, getAccount } = require('./database/database');
const ratelimit = require('./generic/ratelimit');

const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_KEY);

const { readdirSync, existsSync } = require('fs');
const { resolve } = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(require('express-minify')());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ type: ['application/json', 'text/plain'] }));
app.use(ratelimit(300));
app.use(waitForDatabase, embedData);

// Register Assets
app.use('/assets', express.static('./generic/assets'));

// Register Routes
console.log('Loading experiments...');
readdirSync(resolve('./experiments')).forEach((experiment) => {
	try {
		// Import router file
		app.use(`/${experiment}`, require(resolve(`./experiments/${experiment}/router.js`)));
		console.log(`Loaded router for ${experiment}`);

		// Import API router
		const apiRouter = `./experiments/${experiment}/api.js`;
		if (existsSync(resolve(apiRouter))) {
			app.use('/api/' + experiment, require(resolve(apiRouter)));
			console.log(`Loaded api router for ${experiment}`);
		}
	} catch (e) {
		console.warn(`An exception occurred whilst attempting to load the ${experiment} experiment!`, e);
	}
});
console.log('Finished loading experiments, finishing initialization');

// Account Suspension
app.get('/suspended', async (req, res) => {
	const acc = await getAccount(req);
	if (req.tokenData == null || acc == null) return res.redirect('/');
	if (acc.suspended != '') res.sendFile(`${__dirname}/generic/suspended.html`);
	else return res.redirect('/account');
});

// Register 404
app.get('/api/*', (req, res) => {
	res.status(404).send({
		error: true,
		message: 'Invalid experiment! Did you mean to go to the home page?',
		home_page: 'https://santio.me'
	});
});

app.get('/*', (req, res) => {
	res.sendFile(`${__dirname}/generic/404.html`);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
