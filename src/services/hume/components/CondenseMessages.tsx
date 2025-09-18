import UserAvatar from '@/features/users/components/UserAvatar';
import { cn } from '@/lib/utils';
import { BrainCircuitIcon } from 'lucide-react';
import React from 'react';

export default function CondenseMessages({
  messages,
  user,
  className,
  maxFft = 0,
}: {
  messages: { isUser: boolean; content: string[] }[];
  user: { name: string; imageUrl: string };
  className?: string;
  maxFft: number;
}) {
  return (
    <div className={cn('flex flex-col gap-4 w-full', className)}>
      {messages.map((message, index) => {
        const shouldAnimate = false;
        return (
          <div
            key={index}
            className={cn(
              'flex items-center gap-6 border pl-4 pr-6 py-4 rounded max-w-3/4',
              message.isUser ? 'self-end' : 'self-start'
            )}
          >
            {message.isUser ? (
              <UserAvatar user={user} className="size-6 flex-shrink-0" />
            ) : (
              <div className="relative">
                <div
                  className={cn(
                    'absolute inset-0 border-muted border-4 rounded-full',
                    shouldAnimate ? 'animate-ping' : 'hidden'
                  )}
                />
                <BrainCircuitIcon
                  className="size-6 flex-shrink-0"
                  style={shouldAnimate ? { scale: maxFft / 2 + 1 } : undefined}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}