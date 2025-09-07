import { pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from '../schemaHelpers';
import { UserTable } from './user';
import { relations } from 'drizzle-orm';
import { QuestionTable } from './question';
import { InterviewTable } from './interview';

// EXPERIENCE LABEL ENUM
export const experienceLabels = ['junior', 'mid-level', 'senior'] as const;
export const experienceLabelEnum = pgEnum(
  'job_info_experience_level',
  experienceLabels
);

export const JobInfoTable = pgTable('job_info', {
  id,
  title: varchar().notNull(),
  name: varchar().notNull(),
  experienceLabel: experienceLabelEnum().notNull(),
  description: varchar().notNull(),
  userId: varchar()
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt,
  updatedAt,
});

// RELATIONS
export const jobInfoRelations = relations(JobInfoTable, ({ one, many }) => ({
  user: one(UserTable, {
    fields: [JobInfoTable.userId],
    references: [UserTable.id],
  }),
  questions: many(QuestionTable),
  interviews: many(InterviewTable),
}));