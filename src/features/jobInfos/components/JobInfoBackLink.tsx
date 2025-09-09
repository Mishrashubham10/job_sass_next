import BackLink from '@/components/BackLink';
import { db } from '@/drizzle/db';
import { JobInfoTable } from '@/drizzle/schema';
import { cn } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { Suspense } from 'react';
import { getJobInfoIdTag } from '../dbCache';

export default function JobInfoBackLink({
  jobInfoId,
  className,
}: {
  jobInfoId: string;
  className?: string;
}) {
  return (
    <BackLink
      href={`/app/job-infos/${jobInfoId}`}
      className={cn('mb-4', className)}
    >
      <Suspense fallback="Job Description">
        <JobName jobInfoId={jobInfoId} />
      </Suspense>
    </BackLink>
  );
}

// JOB INFO NAME
async function JobName({ jobInfoId }: { jobInfoId: string }) {
  const jobInfo = await getJobInfo(jobInfoId);

  return jobInfo?.name ?? 'Job Description';
}

// GET JOB INFO FROM DB
async function getJobInfo(id: string) {
  'use cache';
  cacheTag(getJobInfoIdTag(id));

  return db.query.JobInfoTable.findFirst({
    where: eq(JobInfoTable.id, id),
  });
}