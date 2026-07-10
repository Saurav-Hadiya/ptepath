'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onFileSelected: (file: File | null) => void;
  existingImageUrl?: string | null;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function ImageUpload({ onFileSelected, existingImageUrl, maxSizeMB = 5 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG or PNG files are accepted.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be ${maxSizeMB}MB or smaller.`);
      return;
    }
    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayUrl = preview ?? (!preview ? existingImageUrl : null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndSet(file);
        }}
      />

      {displayUrl ? (
        <div className="flex flex-col gap-2">
          <div className="relative h-40 w-full overflow-hidden rounded-input border border-border-default bg-bg-page">
            <Image src={displayUrl} alt="Question image preview" fill className="object-contain" unoptimized />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              Replace image
            </Button>
            {preview && (
              <Button type="button" variant="ghost" size="sm" className="text-feedback-error" onClick={handleRemove}>
                <X className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-input border-2 border-dashed border-border-default px-4 py-6 text-center transition-colors hover:border-action-default"
        >
          <ImagePlus className="size-6 text-text-muted" />
          <p className="text-body-sm text-text-secondary">
            <span className="text-action-default">Click to upload</span> or drag and drop
          </p>
          <p className="text-label-sm text-text-muted">JPG, PNG · Max {maxSizeMB}MB</p>
        </div>
      )}

      {error && <p className="mt-1.5 text-label-sm text-feedback-error">{error}</p>}
    </div>
  );
}
