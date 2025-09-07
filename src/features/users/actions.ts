'use server';

import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getUserIdTag } from './dbCache';
import { db } from '@/drizzle/db';
import { eq } from 'drizzle-orm';
import { UserTable } from '@/drizzle/schema';

// GET USER SERVER ACTIONS
export async function getUser(id: string) {
  'use cache';
  cacheTag(getUserIdTag(id));

  return db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });
}