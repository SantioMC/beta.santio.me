module.exports = {
	provided: (...fields) => {
		return (req, res, next) => {
			for (i in fields)
				if (req.body[fields[i]] == null)
					return res.status(400).send({
						error: true,
						message: 'You did not provide a ' + fields[i] + ' in your request body!',
						missing: fields[i],
						required: fields
					});
			next();
		};
	}
};
