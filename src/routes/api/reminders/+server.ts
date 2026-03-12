import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders } from '$lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';

const PAGE_SIZE = 10;

// GET /api/reminders — list most recent reminders, newest first
export const GET: RequestHandler = async ({ url }) => {
	const page = Math.max(0, parseInt(url.searchParams.get('page') ?? '0'));

	const [{ total }] = await db.select({ total: count() }).from(reminders);

	const items = await db
		.select()
		.from(reminders)
		.orderBy(desc(reminders.scheduledAt))
		.limit(PAGE_SIZE)
		.offset(page * PAGE_SIZE);

	return json({ items, total, page, pageSize: PAGE_SIZE });
};

// POST /api/reminders — create a new reminder
// Body: { label: string, phone: string, scheduledAt: string (ISO) }
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { label, phone, scheduledAt, callerName } = body;

	if (!label || !phone || !scheduledAt) {
		return json({ error: 'label, phone, and scheduledAt are required.' }, { status: 400 });
	}

	const scheduledDate = new Date(scheduledAt);
	if (isNaN(scheduledDate.getTime())) {
		return json({ error: 'Invalid scheduledAt date.' }, { status: 400 });
	}

	const [created] = await db
		.insert(reminders)
		.values({ label, phone, callerName: callerName ?? '', scheduledAt: scheduledDate, fired: false })
		.returning();

	return json(created, { status: 201 });
};
