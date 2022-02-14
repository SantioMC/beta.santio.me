const mail = require('@sendgrid/mail');
mail.setApiKey(process.env.SENDGRID_KEY);

module.exports.sendVerification = (email, data) => {
	mail.send({
		to: email,
		from: 'no-reply@santio.me',
		templateId: process.env.SENDGRID_TEMPLATE,
		dynamicTemplateData: data
	});
};
