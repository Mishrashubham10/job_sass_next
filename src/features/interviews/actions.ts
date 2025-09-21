'use server';

import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getJobInfoIdTag } from '../jobInfos/dbCache';
import { db } from '@/drizzle/db';
import { and, eq } from 'drizzle-orm';
import { InterviewTable, JobInfoTable } from '@/drizzle/schema';
import { getInterviewIdTag } from './dbCache';
import { insertInterview, updateInterview as updateInterviewDb } from './db';

// =========== CREATE INTERVIEW ==========
export async function createInterview({
  jobInfoId,
}: {
  jobInfoId: string;
}): Promise<
  | {
      error: true;
      message: string;
    }
  | { error: false; id: string }
> {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  // ========== TODO: CHECK PERMISSIONS ==========
  // ============= TODO: RATE LIMIT =============
  // ============= CHECK JOB INFO =============
  const jobInfo = await getJobInfo(jobInfoId, userId);
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  // ============= CREATE INTERVIEW =============
  const interview = await insertInterview({ jobInfoId, duration: '00:00:00' });

  return { error: false, id: interview.id };
}

// =========== UPDATE INTERVIEW ===========
export async function updateInterview(
  id: string,
  data: {
    humeChatId?: string;
    duration?: string;
  }
) {
  const { userId } = await getCurrentUser();
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const interview = await getInterview(id, userId);
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  await updateInterviewDb(id, data);

  return { error: false };
}

// =========== GET JOBINFO ==========
async function getJobInfo(id: string, userId: string) {
  'use cache';
  cacheTag(getJobInfoIdTag(id));

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  });
}

// =========== GET INTERVIEW ===========
async function getInterview(id: string, userId: string) {
  'use cache';
  cacheTag(getInterviewIdTag(id));

  const interview = await db.query.InterviewTable.findFirst({
    where: eq(InterviewTable.id, id),
    with: {
      jobInfo: {
        columns: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (interview == null) return null;

  cacheTag(getJobInfoIdTag(interview.jobInfo.id));
  if (interview.jobInfo.userId !== userId) {
    return null;
  }

  return interview;
}