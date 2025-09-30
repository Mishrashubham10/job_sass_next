'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { UploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function ResumePageClient({ jobInfoId }: { jobInfoId: string }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<File | null>(null);

  const { object: aiAnalysis } = useObject({});

  // ========= HANDLE FILE UPLOAD ===========
  function handleFileUpload(file: File | null) {
    fileRef.current = file;
    if (file == null) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    // ======= ALLOWED FORMATS ========
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.penxmlformats-officedocument.wordprocessingml.document',
      'application/plain',
    ];

    if (!allowedTypes) {
      toast.error('Please upload a PDF, Word document, or text file');
      return;
    }

    // TODO: GET ANALYSIS
  }

  return (
    <div className="space-y-8 w-full">
      <Card>
        <CardHeader>
          <CardTitle>Upload your resume</CardTitle>
          <CardDescription>
            Get personalized feedback on your resume based on the job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'mt-2 border-2 border-dashed rounded-lg p-6 transition-color relative',
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/50 bg-muted/10 '
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFileUpload(e.dataTransfer.files[0] ?? null);
            }}
          >
            <label htmlFor="resume-upload" className="sr-only">
              Upload your resume
            </label>
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx,.txt"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                handleFileUpload(e.target.files?.[0] ?? null);
              }}
            />
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <UploadIcon className="size-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg">
                  Drag your resume here or click to upload
                </p>
                <p className="text-xs">
                  Supported formats: PDF, Word docs, and text files
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}