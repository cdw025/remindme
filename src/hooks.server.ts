import type { Handle } from '@sveltejs/kit';

// Twilio POSTs to /api/twiml/* without a browser Origin header,
// which triggers SvelteKit's CSRF protection. We skip the check
// for those paths since they are validated by Twilio signatures.
export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/twiml')) {
		// Bypass CSRF origin check for Twilio webhook paths
		event.request.headers.set('origin', event.url.origin);
	}
	return resolve(event);
};
