'use client';

// ========= CUSTOM COMPONENTS ===========
import BackLink from '@/components/BackLink';
import { LoadingSwap } from '@/components/ui/loading-swap';

// ========== SHADCN COMPONENTS ============
import { Button } from '@/components/ui/button';
import MarkdownRenderer from '@/components/MarkdownRender';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

// ========= SCHEMA & FORMATTER ==========
import {
  JobInfoTable,
  questionDifficulties,
  QuestionDifficulty,
} from '@/drizzle/schema';
import { formatQuestionDifficulty } from '@/features/questions/formatters';

// ========== REACT ===========
import { useMemo, useState } from 'react';

// ========= AI ============
import { useCompletion } from 'ai/react';
import { errorToast } from '@/lib/errorToast';
import z from 'zod';

type Status = 'awaiting-answer' | 'awaiting-difficulty' | 'init';

export default function NewQuestionClientPage({
  jobInfo,
}: {
  jobInfo: Pick<typeof JobInfoTable.$inferSelect, 'id' | 'name' | 'title'>;
}) {
  const [status, setStatus] = useState<Status>('init');
  const [answer, setAnswer] = useState<string | null>(null);

  // ========== QUESTIONS ==========
  const {
    complete: generateQuestion,
    completion: question,
    setCompletion: setQuestion,
    data,
    isLoading: isGenerationQuestion,
  } = useCompletion({
    api: '/api/ai/questions/generate-question',
    onFinish: (finalData) => {
      console.log('Final generated question:', finalData);
      setStatus('awaiting-answer');
    },
    onError: (error) => {
      errorToast(error.message);
    },
  });

  const questionId = useMemo(()=>{
    const item = data?.at(-1)
    if (item == null) return null
    const parsed = z.object({ questionId: z.string() }).safeParse(item)
    if (!parsed.success) return null

    return parsed.data.questionId
  }, [data])

  // ========== FEEDBACK ==========
  const {
    complete: generateFeedback,
    completion: feedback,
    setCompletion: setFeedback,
    isLoading: isGenerationFeedback,
  } = useCompletion({
    api: '/api/ai/questions/generate-feedback',
    onFinish: () => {
      setStatus('awaiting-difficulty');
    },
    onError: (error) => {
      errorToast(error.message);
    },
  });

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[2000px] mx-auto flex-grow h-screen-header">
      <div className="container flex gap-4 mt-4 items-center justify-between">
        <div className="flex-grow basis-0">
          <BackLink href={`/app/job-infos/${jobInfo.id}/questions`}>
            {jobInfo.name}
          </BackLink>
        </div>
        <Controls
          reset={() => {
            setStatus('init');
            setQuestion('');
            setFeedback('');
            setAnswer(null);
          }}
          disabledAnswerButton={
            answer == null || answer.trim() === '' || questionId == null
          }
          status={status}
          isLoading={isGenerationFeedback || isGenerationQuestion}
          generateFeedback={() => {
            if (answer == null || answer?.trim() || questionId == null) return;
            generateFeedback(answer?.trim(), { body: { questionId } });
          }}
          generateQuestion={(difficulty) => {
            setQuestion('');
            setFeedback('');
            setAnswer(null);
            generateQuestion(difficulty, { body: { jobInfoId: jobInfo.id } });
          }}
        />
        <div className="flex-grow hidden md:block" />
      </div>
      {/* ========== QUESTION CONTAINER =========== */}
      <QuestionContainer
        question={question}
        feedback={feedback}
        answer={answer}
        setAnswer={setAnswer}
        status={status}
      />
    </div>
  );
}

// ============ QuestionContainer =============
function QuestionContainer({
  question,
  feedback,
  answer,
  setAnswer,
  status,
}: {
  question: string | null;
  feedback: string | null;
  answer: string | null;
  status: Status;
  setAnswer: (value: string) => void;
}) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow border-t">
      <ResizablePanel id="question-and-feedback" defaultSize={50} minSize={5}>
        <ResizablePanelGroup direction="vertical" className="flex-grow">
          <ResizablePanel id="question" defaultSize={25} minSize={5}>
            <ScrollArea className="h-full min-h-48 *:h-full">
              {status === 'init' && question == null ? (
                <p className="text-base md:text-lg flex items-center justify-center h-full p-6">
                  Get started by selecting a question difficulty above.
                </p>
              ) : (
                question && (
                  <MarkdownRenderer className="p-6">
                    {question}
                  </MarkdownRenderer>
                )
              )}
            </ScrollArea>
          </ResizablePanel>
          {feedback && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="feedback" defaultSize={75} minSize={5}>
                <ScrollArea className="h-full min-h-48 *:h-full">
                  <MarkdownRenderer className="p-6">
                    {feedback}
                  </MarkdownRenderer>
                </ScrollArea>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="answer" defaultSize={50} minSize={5}>
        <ScrollArea className="h-full min-w-48 *:h-full">
          <Textarea
            disabled={status !== 'awaiting-answer'}
            onChange={(e) => setAnswer(e.target.value)}
            value={answer ?? ''}
            placeholder="Type yoyr answer here..."
            className="w-ful h-full resize-none border-none rounded-none focus-visible:ring focus-visible:ring-inset !text-base p-6"
          />
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// ============ CONTROLS ============
function Controls({
  disabledAnswerButton,
  status,
  isLoading,
  generateQuestion,
  generateFeedback,
  reset,
}: {
  disabledAnswerButton: boolean;
  status: Status;
  isLoading: boolean;
  generateQuestion: (difficulty: QuestionDifficulty) => void;
  generateFeedback: () => void;
  reset: () => void;
}) {
  return (
    <div className="flex gap-2">
      {status === 'awaiting-answer' ? (
        <>
          <Button
            className=""
            onClick={reset}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <LoadingSwap isLoading={isLoading}>Skip</LoadingSwap>
          </Button>
          <Button
            className=""
            onClick={generateFeedback}
            disabled={disabledAnswerButton}
            size="sm"
          >
            <LoadingSwap isLoading={isLoading}>Answer</LoadingSwap>
          </Button>
        </>
      ) : (
        questionDifficulties.map((difficulty) => (
          <Button
            key={difficulty}
            size="sm"
            disabled={isLoading}
            onClick={() => generateQuestion(difficulty)}
          >
            <LoadingSwap isLoading={isLoading}>
              {formatQuestionDifficulty(difficulty)}
            </LoadingSwap>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Button>
        ))
      )}
    </div>
  );
}
