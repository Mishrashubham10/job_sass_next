import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from '../schemaHelpers';
import { JobInfoTable } from './jobInfo';
import { relations } from 'drizzle-orm';

export const InterviewTable = pgTable('interviews', {
  id,
  jobInfoId: uuid()
    .references(() => JobInfoTable.id, { onDelete: 'cascade' })
    .notNull(),
  duration: varchar().notNull(),
  humeChatId: varchar(),
  feedback: varchar(),
  createdAt,
  updatedAt,
});

// RELATIONS
export const interviewRelations = relations(InterviewTable, ({ one }) => ({
  jobInfo: one(JobInfoTable, {
    fields: [InterviewTable.jobInfoId],
    references: [JobInfoTable.id],
  }),
}));