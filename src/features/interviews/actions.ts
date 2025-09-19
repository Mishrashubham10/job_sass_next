'use server';

import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getJobInfoIdTag } from '../jobInfos/dbCache';
import { db } from '@/drizzle/db';
import { and, eq } from 'drizzle-orm';
import { JobInfoTable } from '@/drizzle/schema';
import { duration } from 'drizzle-orm/gel-core';

export async function createInterview({ jobInfoId }: { jobInfoId: string }) {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  // ========== CHECK PERMISSIONS ==========
  // ============= RATE LIMIT =============
  // ============= CHECK JOB INFO =============
  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) {
    return {
        error: true,
        message: "You don't have permission to do this"
    }
  }

  // ============= CREATE INTERVIEW =============
  const interview = await insertInterview(jobInfoId, duration: "00:00:00")

  return { error: false, id: interview.id }
}

// =========== GET JOBINFO ==========
async function getJobInfo(id: string, userId: string) {
  'use cache';
  cacheTag(getJobInfoIdTag(id));

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  });
}