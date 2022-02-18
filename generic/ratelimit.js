const ms = require('ms');

module.exports = (limit, time) => {
	var hits = {};
	if (time == undefined) time = 60000;
	else time = ms(time);

	// Clear limits
	setInterval(() => {
		hits = {};
	}, time);

	return function ratelimit(req, res, next) {
		var ip = req.ip;

		// Headers
		res.setHeader('X-RateLimit-Limit', limit);
		res.setHeader('Date', new Date().toUTCString());

		// Check if rate limit is reached
		if ((hits[ip] || 0) >= limit) {
			res.setHeader('X-RateLimit-Remaining', 0);
			return res.status(429).json({ error: true, message: 'You are being rate limited! Try again later.' });
		} else {
			hits[ip] = Math.min((hits[ip] || 0) + 1, limit);
			res.setHeader('X-RateLimit-Remaining', limit - (hits[ip] || 0));
			next();
		}
	};
};
