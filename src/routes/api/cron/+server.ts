import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders } from '$lib/db/schema';
import { makeReminderCall } from '$lib/twilio';
import { lte, eq, and } from 'drizzle-orm';
import { CRON_SECRET } from '$env/static/private';

// Vercel calls this endpoint on the cron schedule defined in vercel.json.
// We protect it with a secret so nobody else can trigger it.
export const GET: RequestHandler = async ({ request }) => {
	const auth = request.headers.get('authorization');
	if (auth !== `Bearer ${CRON_SECRET}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const now = new Date();

	const due = await db
		.select()
		.from(reminders)
		.where(and(lte(reminders.scheduledAt, now), eq(reminders.fired, false)));

	const results: { id: number; status: string }[] = [];

	for (const reminder of due) {
		try {
			await makeReminderCall(reminder.phone, reminder.label, reminder.id);
			await db.update(reminders).set({ fired: true }).where(eq(reminders.id, reminder.id));
			results.push({ id: reminder.id, status: 'fired' });
		} catch (err) {
			console.error(`Failed to fire reminder #${reminder.id}:`, err);
			results.push({ id: reminder.id, status: 'error' });
		}
	}

	return json({ checked: due.length, results });
};
