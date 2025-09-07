'use server';

import z from 'zod';
import { jobInfoSchema } from './schemas';
import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { redirect } from 'next/navigation';
import { insertJobInfo, updateJobInfo as updateJobInfoDB } from './db';
import { db } from '@/drizzle/db';
import { and, eq } from 'drizzle-orm';
import { JobInfoTable } from '@/drizzle/schema';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getJobInfoIdTag } from './dbCache';

// CREATE JOB INFO ACTION
export async function createJobInfo(unsafeData: z.infer<typeof jobInfoSchema>) {
  const { userId } = await getCurrentUser();

  // CHECK IF USER EXISTS
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData);

  if (!success) {
    return {
      error: true,
      message: 'Invalid job data',
    };
  }

  const jobInfo = await insertJobInfo({
    ...data,
    title: data.title ?? '',
    userId,
  });

  redirect(`/app/job-infos/${jobInfo.id}`);
}

// UPDATE JOB INFO ACTION
export async function updateJobInfo(
  id: string,
  unsafeData: z.infer<typeof jobInfoSchema>
) {
  const { userId } = await getCurrentUser();

  // CHECK IF USER EXISTS
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const { success, data } = jobInfoSchema.safeParse(unsafeData);

  if (!success) {
    return {
      error: true,
      message: 'Invalid job data',
    };
  }

  const existingJobInfo = getJobInfos(id, userId);
  if (existingJobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const jobInfo = await updateJobInfoDB(id, {
    ...data,
    title: data.title ?? '',
  });

  redirect(`/app/job-infos/${jobInfo.id}`);
}

// GET JOB INFO
async function getJobInfos(id: string, userId: string) {
  'use cache';
  cacheTag(getJobInfoIdTag(id));

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  });
}