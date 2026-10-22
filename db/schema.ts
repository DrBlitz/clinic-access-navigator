import { sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const demoBookings = sqliteTable('demo_bookings', {
 id: text('id').primaryKey(), sessionId: text('session_id').notNull(), doctor: text('doctor').notNull(),
 date: text('date').notNull(), time: text('time').notNull(), patientId: text('patient_id').notNull(),
 status: text('status').notNull(), createdAt: text('created_at').notNull(),
}, table => [uniqueIndex('demo_slot_unique').on(table.doctor, table.date, table.time).where(sql`${table.status} = 'confirmed'`), index('demo_session_idx').on(table.sessionId)]);
