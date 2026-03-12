import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/reminders — list all reminders, newest first
export const GET: RequestHandler = async () => {
	const all = await db
		.select()
		.from(reminders)
		.orderBy(reminders.scheduledAt);

	return json(all);
};

// POST /api/reminders — create a new reminder
// Body: { label: string, phone: string, scheduledAt: string (ISO) }
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { label, phone, scheduledAt } = body;

	if (!label || !phone || !scheduledAt) {
		return json({ error: 'label, phone, and scheduledAt are required.' }, { status: 400 });
	}

	const scheduledDate = new Date(scheduledAt);
	if (isNaN(scheduledDate.getTime())) {
		return json({ error: 'Invalid scheduledAt date.' }, { status: 400 });
	}

	const [created] = await db
		.insert(reminders)
		.values({ label, phone, scheduledAt: scheduledDate, fired: false })
		.returning();

	return json(created, { status: 201 });
};
