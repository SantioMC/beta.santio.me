var express = require('express');
var router = express.Router();
var { requiresAuth } = require('../../database/database');

// Routes
router.get('/', (req, res) => {
	res.send('WIP');
});

// API
router.get('/api/test', requiresAuth(), (req, res) => {
	res.json({ error: false, message: 'Hey' });
});

router.all('/api/*', (req, res) => {
	res.json({
		error: true,
		message: 'Invalid endpoint'
	});
});

module.exports = router;
