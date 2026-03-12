import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { reminders } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

// DELETE /api/reminders/:id — delete a reminder
export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid id.' }, { status: 400 });

	await db.delete(reminders).where(eq(reminders.id, id));
	return json({ ok: true });
};

// PATCH /api/reminders/:id — update label, phone, or scheduledAt
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid id.' }, { status: 400 });

	const body = await request.json();
	const updates: Record<string, unknown> = {};

	if (body.label !== undefined) updates.label = body.label;
	if (body.phone !== undefined) updates.phone = body.phone;
	if (body.scheduledAt !== undefined) {
		const d = new Date(body.scheduledAt);
		if (isNaN(d.getTime())) return json({ error: 'Invalid scheduledAt.' }, { status: 400 });
		updates.scheduledAt = d;
		updates.fired = false; // rescheduled → reset fired flag
	}

	if (Object.keys(updates).length === 0) {
		return json({ error: 'No valid fields to update.' }, { status: 400 });
	}

	const [updated] = await db
		.update(reminders)
		.set(updates)
		.where(eq(reminders.id, id))
		.returning();

	return json(updated);
};
