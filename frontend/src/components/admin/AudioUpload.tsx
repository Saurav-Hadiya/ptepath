'use client';

import { useRef, useState } from 'react';
import { Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioUploadProps {
  onFileSelected: (file: File | null) => void;
  existingAudioUrl?: string | null;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AudioUpload({ onFileSelected, existingAudioUrl, maxSizeMB = 5 }: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(file: File) {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
    if (!isValidType) {
      setError('Only MP3, WAV, or M4A files are accepted.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be ${maxSizeMB}MB or smaller.`);
      return;
    }
    setError(null);
    setSelectedFile(file);
    onFileSelected(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }

  function handleRemove() {
    setSelectedFile(null);
    setError(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const showExisting = existingAudioUrl && !selectedFile && !replacing;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav,.m4a,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSet(file);
        }}
      />

      {showExisting ? (
        <div className="flex flex-col gap-2 rounded-input border border-border-default bg-bg-page p-3">
          <audio controls src={existingAudioUrl} className="w-full" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => {
              setReplacing(true);
              inputRef.current?.click();
            }}
          >
            Replace audio
          </Button>
        </div>
      ) : selectedFile ? (
        <div className="flex items-center gap-3 rounded-input border border-border-default bg-bg-page p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-action-subtle">
            <Music className="size-4 text-action-default" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-text-primary">{selectedFile.name}</p>
            <p className="text-label-sm text-text-muted">{formatSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 text-feedback-error"
            aria-label="Remove audio file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-input border-2 border-dashed border-border-default px-4 py-6 text-center transition-colors hover:border-action-default"
        >
          <Music className="size-6 text-text-muted" />
          <p className="text-body-sm text-text-secondary">
            <span className="text-action-default">Click to upload</span> or drag and drop
          </p>
          <p className="text-label-sm text-text-muted">MP3, WAV, M4A · Max {maxSizeMB}MB</p>
        </div>
      )}

      {error && <p className="mt-1.5 text-label-sm text-feedback-error">{error}</p>}
    </div>
  );
}
