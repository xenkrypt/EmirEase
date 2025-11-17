import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CameraIcon } from './icons/CameraIcon';
import { FILE_SIZE_LIMIT_MB } from '../constants';
import CameraModal from './CameraModal';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const validateFiles = (files: FileList | File[]): File[] => {
    setError(null);
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is ${FILE_SIZE_LIMIT_MB}MB.`);
        return [];
      }
      validFiles.push(file);
    }
    return validFiles;
  };

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const validated = validateFiles(files);
    if (validated.length > 0) {
      onFileUpload(validated);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    setError(null);
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
            const file = new File([blob], `pasted-image.${blob.type.split('/')[1]}`, { type: blob.type });
            if (file.size > FILE_SIZE_LIMIT_MB * 1024 * 1024) {
              setError(`Pasted image is too large. Maximum size is ${FILE_SIZE_LIMIT_MB}MB.`);
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
              setPastedImage(event.target.result as string);
              setPastedFile(file);
            };
            reader.readAsDataURL(blob);
        }
        return;
      }
    }
  }, []);

  const handleConfirmPaste = () => {
    if (pastedFile) {
        onFileUpload([pastedFile]);
    }
  };
  
  const handleCancelPaste = () => {
      setPastedImage(null);
      setPastedFile(null);
  }

  const handleCameraCapture = (file: File) => {
    onFileUpload([file]);
    setIsCameraOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">Welcome to EmirEase</h2>
      <p className="text-lg text-[rgb(var(--color-text-secondary))] mb-8">Your AI assistant for Dubai government services. Upload one or more documents to start.</p>
      
      {error && <p className="text-[rgb(var(--color-danger-text))] mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-8" onPaste={handlePaste}>
        <div className="flex flex-col">
          <label
            htmlFor="file-upload"
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragging ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)]' : 'border-[rgb(var(--color-border))] bg-[rgb(var(--color-card-secondary)/0.5)] hover:bg-[rgb(var(--color-card-secondary))]'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon className={`w-12 h-12 mb-3 ${isDragging ? 'text-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-text-tertiary))]'}`} />
              <p className="mb-2 text-sm text-[rgb(var(--color-text-secondary))]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-[rgb(var(--color-text-tertiary))]">PNG, JPG, or PDF (Max {FILE_SIZE_LIMIT_MB}MB)</p>
            </div>
            <input id="file-upload" type="file" multiple className="hidden" onChange={handleChange} accept="image/png, image/jpeg, application/pdf" />
          </label>
        </div>
        
        <div className="flex flex-col">
          {pastedImage ? (
             <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/0.1)] p-4">
                <img src={pastedImage} alt="Pasted preview" className="max-h-36 object-contain rounded-lg shadow-md" />
                <div className="mt-4 flex justify-center space-x-4">
                    <button onClick={handleConfirmPaste} className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] transition-colors">Confirm & Analyze</button>
                    <button onClick={handleCancelPaste} className="px-4 py-2 bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] font-semibold rounded-lg hover:bg-[rgb(var(--color-border))] transition-colors">Cancel</button>
                </div>
            </div>
          ) : (
             <div tabIndex={0} className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-[rgb(var(--color-border))] bg-[rgb(var(--color-card-secondary)/0.5)] hover:bg-[rgb(var(--color-card-secondary))]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ClipboardIcon className="w-12 h-12 mb-3 text-[rgb(var(--color-text-tertiary))]" />
                    <p className="mb-2 text-sm text-[rgb(var(--color-text-secondary))]"><span className="font-semibold">Paste from clipboard</span></p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Click here and press Ctrl+V</p>
                </div>
            </div>
          )}
        </div>
      </div>
       <div className="mt-8 flex justify-center">
            <button
                onClick={() => setIsCameraOpen(true)}
                className="flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg transition-all duration-300 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] hover:bg-[rgb(var(--color-primary-hover))] shadow-md hover:shadow-lg"
            >
                <CameraIcon className="w-6 h-6 mr-3" />
                Use Camera to Upload
            </button>
        </div>
        <CameraModal 
            isOpen={isCameraOpen}
            onClose={() => setIsCameraOpen(false)}
            onCapture={handleCameraCapture}
        />
    </div>
  );
};

export default FileUpload;