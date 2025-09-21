'use client';

import { Button } from '@/components/ui/button';
import { env } from '@/data/env/client';
import { JobInfoTable } from '@/drizzle/schema';
import {
  createInterview,
  updateInterview,
} from '@/features/interviews/actions';
import { errorToast } from '@/lib/errorToast';
import CondenseMessages from '@/services/hume/components/CondenseMessages';
import { condensedMessages } from '@/services/hume/lib/condensedMessages';
// ========== HUME ============
import { useVoice, VoiceReadyState } from '@humeai/voice-react';
// ========== ICONS ===========
import { Loader2Icon, MicIcon, MicOffIcon, PhoneOffIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function StartCall({
  jobInfo,
  user,
  accessToken,
}: {
  jobInfo: Pick<
    typeof JobInfoTable.$inferInsert,
    'id' | 'title' | 'description' | 'experienceLabel'
  >;
  accessToken: string;
  user: {
    name: string;
    imageUrl: string;
  };
}) {
  const router = useRouter();
  const { connect, readyState, chatMetadata, callDurationTimestamp } =
    useVoice();
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const durationRef = useRef(callDurationTimestamp);
  durationRef.current = callDurationTimestamp;

  // SYNC CHAT ID
  useEffect(() => {
    if (chatMetadata?.chatId == null || interviewId == null) {
      return;
    }
    updateInterview(interviewId, { humeChatId: chatMetadata.chatId });
  }, [chatMetadata?.chatId, interviewId]);

  // SYNC DURATION
  useEffect(() => {
    if (interviewId == null) return;
    const intervalId = setInterval(() => {
      if (durationRef.current == null) return;

      updateInterview(interviewId, { duration: durationRef.current });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [interviewId]);

  // HANDLE DISCONNECT
  useEffect(() => {
    if (readyState !== VoiceReadyState.CLOSED) return;
    if (interviewId == null) {
      return router.push(`/app/job-infos/${jobInfo.id}/interviews`);
    }

    if (durationRef.current != null) {
      updateInterview(interviewId, { duration: durationRef.current });
    }

    router.push(`/app/job-infos/${jobInfo.id}/interviews/${interviewId}`);
  }, [interviewId, readyState, router, jobInfo.id]);

  if (readyState === VoiceReadyState.IDLE) {
    return (
      <div className="flex justify-center items-center h-screen-header">
        <Button
          size="lg"
          onClick={async () => {
            // CREATE INTERVIEW
            if (!jobInfo.id) {
              throw new Error('jobInfoId is undefined');
            }
            const res = await createInterview({ jobInfoId: jobInfo.id });
            if (res.error) {
              return errorToast(res.message);
            }
            setInterviewId(res.id);

            connect({
              auth: { type: 'accessToken', value: accessToken },
              configId: env.NEXT_PUBLIC_HUME_CONFIG_ID,
            });
          }}
        >
          Start Interview
        </Button>
      </div>
    );
  }

  if (
    readyState === VoiceReadyState.CONNECTING ||
    readyState === VoiceReadyState.CLOSED
  ) {
    return (
      <div className="h-screen-header flex items-center justify-center">
        <Loader2Icon className="animate-spin size-24" />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-screen-header flex flex-col-reverse">
      <div className="container py-6 flex flex-col items-center justify-end">
        <Messages user={user} />
        <Controls />
      </div>
    </div>
  );
}

// ============= MESSAGES ==============
function Messages({ user }: { user: { name: string; imageUrl: string } }) {
  const { messages, fft } = useVoice();

  const condenseMessages = useMemo(() => {
    return condensedMessages(messages);
  }, [messages]);

  return (
    <CondenseMessages
      messages={condenseMessages}
      maxFft={Math.max(...fft)}
      user={user}
      className="max-w-5xl"
    />
  );
}

// ============== CONTROLS ===============
function Controls() {
  const { disconnect, isMuted, mute, unmute, micFft, callDurationTimestamp } =
    useVoice();

  return (
    <div className="flex gap-5 rounded border px-5 py-2 w-fit sticky bottom-6 bg-background items-center">
      <Button
        variant="ghost"
        size="icon"
        className="-mx-3"
        onClick={() => (isMuted ? unmute() : mute())}
      >
        {isMuted ? <MicOffIcon className="text-destructive" /> : <MicIcon />}
        <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
      </Button>
      <div className="self-stretch">
        <FftVisualizer ftt={micFft} />
      </div>
      {/* ========== CALL DURATION ========== */}
      <div className="text-sm text-muted-foreground tabular-nums">
        {callDurationTimestamp}
      </div>
      {/* ========== END CALL BTN ========== */}
      <Button
        variant="ghost"
        size="icon"
        onClick={disconnect}
        className="-mx-3"
      >
        <PhoneOffIcon className="text-destructive" />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  );
}

// ============== FFT VISUALIZER ==============
function FftVisualizer({ ftt }: { ftt: number[] }) {
  return (
    <div className="flex gap-1 items-center h-full">
      {ftt.map((value, index) => {
        const percent = (value / 4) * 100;
        return (
          <div
            key={index}
            className="min-h-0.5 bg-primary/75 w-0.5 rounded"
            style={{ height: `${percent < 10 ? 0 : percent}%` }}
          />
        );
      })}
    </div>
  );
}