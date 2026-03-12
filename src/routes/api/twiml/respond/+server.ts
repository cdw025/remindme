import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Twilio POSTs here with SpeechResult after the caller speaks.
export const POST: RequestHandler = async ({ request, url }) => {
	const formData = await request.formData();
	const speech = (formData.get('SpeechResult') as string) ?? '';
	const id = parseInt(url.searchParams.get('id') ?? '');
	const label = url.searchParams.get('label') ?? 'your reminder';

	let replyText = "Sorry, I didn't understand that. Goodbye!";

	if (speech && !isNaN(id)) {
		const intent = await parseIntent(speech);

		if (intent.action === 'dismiss') {
			replyText = 'Got it! Reminder dismissed. Have a great day!';
			// Already marked fired by cron — nothing more to do.
		} else if (intent.action === 'snooze') {
			const minutes = intent.minutes ?? 5;
			const newTime = new Date(Date.now() + minutes * 60 * 1000);
			await db
				.update(reminders)
				.set({ scheduledAt: newTime, fired: false })
				.where(eq(reminders.id, id));
			replyText = `Got it! I'll call you back in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
		} else if (intent.action === 'reschedule' && intent.scheduledAt) {
			await db
				.update(reminders)
				.set({ scheduledAt: intent.scheduledAt, fired: false })
				.where(eq(reminders.id, id));
			replyText = `Done! I've rescheduled your reminder. Goodbye!`;
		} else {
			replyText = "Sorry, I didn't understand that. You can say got it, snooze, or reschedule. Goodbye!";
		}
	}

	const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(replyText)}</Say>
</Response>`;

	return new Response(twiml, {
		headers: { 'Content-Type': 'text/xml' }
	});
};

type Intent =
	| { action: 'dismiss' }
	| { action: 'snooze'; minutes: number }
	| { action: 'reschedule'; scheduledAt: Date }
	| { action: 'unknown' };

async function parseIntent(speech: string): Promise<Intent> {
	const now = new Date();

	const completion = await openai.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{
				role: 'system',
				content: `You are an intent parser for a reminder voice app. The current date/time is ${now.toISOString()}.
The user just heard their reminder and spoke a response. Parse their intent into one of these JSON shapes:
- { "action": "dismiss" } — they said something like "got it", "ok", "done", "close it", "thanks"
- { "action": "snooze", "minutes": <number> } — they want a callback in N minutes (default 5 if unspecified)
- { "action": "reschedule", "scheduledAt": "<ISO 8601 datetime>" } — they named a specific time like "tomorrow at noon" or "in two hours"
- { "action": "unknown" } — you can't determine the intent

Respond with ONLY the JSON object, no explanation.`
			},
			{
				role: 'user',
				content: speech
			}
		],
		temperature: 0
	});

	try {
		const raw = completion.choices[0].message.content ?? '{}';
		const parsed = JSON.parse(raw);

		if (parsed.action === 'dismiss') return { action: 'dismiss' };
		if (parsed.action === 'snooze') return { action: 'snooze', minutes: parsed.minutes ?? 5 };
		if (parsed.action === 'reschedule' && parsed.scheduledAt) {
			const d = new Date(parsed.scheduledAt);
			if (!isNaN(d.getTime())) return { action: 'reschedule', scheduledAt: d };
		}
	} catch {
		// fall through
	}

	return { action: 'unknown' };
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
