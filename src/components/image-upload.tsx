'use client';

import { useRef, forwardRef, useImperativeHandle, ChangeEvent } from 'react';

type ImageUploadProps = {
  onImageSelect: (file: File) => void;
};

export const ImageUpload = forwardRef<{ openFileDialog: () => void }, ImageUploadProps>(
  ({ onImageSelect }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
    };

    const openFileDialog = () => {
      fileInputRef.current?.click();
    };

    useImperativeHandle(ref, () => ({
      openFileDialog,
    }));

    return (
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
    );
  }
);

ImageUpload.displayName = 'ImageUpload';
