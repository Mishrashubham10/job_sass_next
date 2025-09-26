'use server';

import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getJobInfoIdTag } from '../jobInfos/dbCache';
import { db } from '@/drizzle/db';
import { and, eq } from 'drizzle-orm';
import { InterviewTable, JobInfoTable } from '@/drizzle/schema';
import { getInterviewIdTag } from './dbCache';
import { insertInterview, updateInterview as updateInterviewDb } from './db';
import { canCreateInterview } from './permissions';
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from '@/lib/errorToast';
import arcjet, { request, tokenBucket } from '@arcjet/next';
import { env } from '@/data/env/server';
import { generateAiInterviewFeedback } from '@/services/ai/interviews';

// ========== ARCJET FOR RATE LIMITING ==========
const aj = arcjet({
  characteristics: ['userId'],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: '1d',
      mode: 'LIVE',
    }),
  ],
});

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
  if (!(await canCreateInterview())) {
    return {
      error: true,
      message: PLAN_LIMIT_MESSAGE,
    };
  }

  // ============= TODO: RATE LIMIT =============
  const decesion = await aj.protect(await request(), {
    userId,
    requested: 1,
  });

  // CHECKING IF DECESION DENIED
  if (decesion.isDenied()) {
    return {
      error: true,
      message: RATE_LIMIT_MESSAGE,
    };
  }

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

// =========== GENERATE FEEDBACK ============
export async function generateInterviewFeedback(interviewId: string) {
  const { userId, user } = await getCurrentUser({ allData: true });
  if (userId == null || user == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const interview = await getInterview(interviewId, userId);
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  if (interview.humeChatId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    };
  }

  const feedback = await generateAiInterviewFeedback({
    humeChatId: interview.humeChatId,
    jobInfo: interview.jobInfo,
    userName: user.name,
  });

  if (feedback == null) {
    return {
      error: true,
      message: 'Failed to generate feedback',
    };
  }

  await updateInterviewDb(interviewId, { feedback });

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
          description: true,
          title: true,
          experienceLabel: true
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