import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const reminders = pgTable('reminders', {
	id: serial('id').primaryKey(),
	label: text('label').notNull(),
	phone: text('phone').notNull(),
	callerName: text('caller_name').notNull().default(''),
	scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
	fired: boolean('fired').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
