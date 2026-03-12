import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			// Twilio webhooks POST without an Origin header, which SvelteKit
			// blocks by default. '*' disables the origin check entirely.
			trustedOrigins: ['*']
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => ({ runes: !filename.includes('node_modules') })
	}
};

export default config;
