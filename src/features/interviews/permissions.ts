import { db } from '@/drizzle/db';
import { InterviewTable, JobInfoTable } from '@/drizzle/schema';
import { getCurrentUser } from '@/services/clerk/lib/getCurrentUser';
import { hasPermission } from '@/services/clerk/lib/hasPermission';
import { and, count, eq, isNotNull } from 'drizzle-orm';

// ============ CAN CREATE INTERVIEW ==============
export async function canCreateInterview() {
  return await Promise.any([
    hasPermission('unlimited_interviews').then(
      (bool) => bool || Promise.reject()
    ),
    Promise.all([hasPermission('1_interview'), getUserInterviewCount()]).then(
      ([has, c]) => {
        if (has && c < 1) return true;
        return Promise.reject();
      }
    ),
  ]).catch(() => false);
}

// ========= GET USER INTERVIEW COUNT ===========
async function getUserInterviewCount() {
  const { userId } = await getCurrentUser();
  if (userId == null) return 0;

  return getInterviewCount(userId);
}

// ========= GET INTERVIEW COUNT ===========
async function getInterviewCount(userId: string) {
  const [{ count: c }] = await db
    .select({ count: count() })
    .from(InterviewTable)
    .innerJoin(JobInfoTable, eq(InterviewTable.jobInfoId, JobInfoTable.id))
    .where(
      and(eq(JobInfoTable.userId, userId), isNotNull(InterviewTable.humeChatId))
    );

  return c;
}