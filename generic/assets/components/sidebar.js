export default {
	props: ['user', 'page'],
	methods: {
		go(loc) {
			window.location = loc;
		}
	},
	template: `
	<div class="sidebar">
		<div class="title small middle">santio.me</div>
		<div class="profile">
			<img id="pfp" crossorigin="anonymous">
			<div>
				<div>{{user.name}}</div> 
				<code>#{{user.tag}}</code>
			</div>
			<div v-if="(user.roles || []).length != 0" class="roles">
				<span v-if="user.highestRole == 'Administrator'" class="badge error role">Administrator</span>
				<span v-if="user.highestRole == 'Moderator'" class="badge warning role">Moderator</span>
				<span v-if="user.highestRole == 'Beta Tester'" class="badge role">Beta Tester</span>
			</div>
		</div>
		<div class="segment" :class="{ selected: page == 'dashboard' }" @click="go('/account')">
			<i class="gg-hashtag"></i>
			<div>Dashboard</div>
		</div>
		<div class="segment" :class="{ selected: page == 'profile' }" @click="go('/account/profile')">
			<i class="gg-coffee"></i>
			<div>My Profile</div>
		</div>
		<div class="segment" @click="go('/metrics')">
			<i class="gg-align-left"></i>
			<div>Metrics</div>
		</div>
		<div class="segment" :class="{ selected: page == 'keys' }" @click="go('/account/keys')">
			<i class="gg-key"></i>
			<div>API Keys</div>
		</div>
		<div class="segment" :class="{ selected: page == 'settings' }" @click="go('/account/settings')">
			<i class="gg-profile"></i>
			<div>Account Settings</div>
		</div>
		<div v-if="(user.roles || []).includes('Administrator')" class="segment" @click="go('/admin')">
			<i class="gg-lock"></i>
			<div>Admin</div>
			<span class="badge error">Staff</span>
		</div>
	</div>`
};
