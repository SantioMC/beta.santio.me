window.addEventListener('DOMContentLoaded', (event) => {
	const button = document.getElementsByClassName('submit')[0];
	button.addEventListener('click', async () => {
		const email = document.querySelectorAll('input[type=email]')[0].value;
		const password = document.querySelectorAll('input[type=password]')[0].value;
		const error = document.getElementsByClassName('error')[0];

		button.setAttribute('disabled', '');
		const req = await fetch('/api/account/login', {
			method: 'POST',
			body: JSON.stringify({
				email,
				password
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});

		const data = await req.json();
		if (data.error) error.innerText = data.message;
		else window.location = '/account';
		button.removeAttribute('disabled');
	});
});
