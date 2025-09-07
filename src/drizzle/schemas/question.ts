import { pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from '../schemaHelpers';
import { relations } from 'drizzle-orm';
import { JobInfoTable } from './jobInfo';

// EXPERIENCE LABEL ENUM
export const questionDifficulties = ['easy', 'medium', 'hard'] as const;
export const questionDifficultyEnum = pgEnum(
  'questions_question_difficulty',
  questionDifficulties
);

export const QuestionTable = pgTable('questions', {
  id,
  jobInfoId: uuid()
    .references(() => JobInfoTable.id, { onDelete: 'cascade' })
    .notNull(),
  text: varchar().notNull(),
  difficulty: questionDifficultyEnum().notNull(),
  createdAt,
  updatedAt,
});

// RELATIONS
export const questionRelations = relations(QuestionTable, ({ one }) => ({
  jobInfo: one(JobInfoTable, {
    fields: [QuestionTable.jobInfoId],
    references: [JobInfoTable.id],
  }),
}));