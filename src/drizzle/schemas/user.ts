import { pgTable, varchar } from 'drizzle-orm/pg-core';
import { createdAt, updatedAt } from '../schemaHelpers';
import { relations } from 'drizzle-orm';
import { JobInfoTable } from './jobInfo';

export const UserTable = pgTable('users', {
  id: varchar().primaryKey(),
  email: varchar().notNull().unique(),
  name: varchar().notNull(),
  imageUrl: varchar().notNull(),
  createdAt,
  updatedAt,
});

// RELATIONS
export const userRelations = relations(UserTable, ({ many }) => ({
  jobInfos: many(JobInfoTable),
}));