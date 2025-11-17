import React, { useState } from 'react';
import ImageModal from './ImageModal';
import { PdfIcon } from './icons/PdfIcon';

interface DocumentViewerProps {
  previews: string[];
  originalFiles: File[];
  signature: string | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ previews, originalFiles, signature }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activePreview = previews[activeIndex];
  const activeFile = originalFiles[activeIndex];
  const isPdf = activeFile?.type === 'application/pdf';

  return (
    <div className="flex flex-col h-full">
        <div className="relative flex-grow bg-[rgb(var(--color-card-secondary))] rounded-lg p-2 mb-4">
            {isPdf ? (
                 <div className="w-full h-full flex flex-col items-center justify-center text-center text-[rgb(var(--color-text-secondary))] p-4">
                    <PdfIcon className="w-24 h-24 text-[rgb(var(--color-text-tertiary))]" />
                    <p className="font-semibold mt-4">PDF Document Uploaded</p>
                    <p className="text-sm">Content is being analyzed by the AI. Preview is not available for PDF files.</p>
                 </div>
            ) : (
                <img
                    src={activePreview}
                    alt={`Document preview ${activeIndex + 1}`}
                    onClick={() => setIsModalOpen(true)}
                    className="w-full h-full max-h-[400px] object-contain rounded-md cursor-pointer"
                />
            )}
             {signature && !isPdf && (
                <img src={signature} alt="User signature" className="absolute bottom-4 right-4 h-16 w-auto pointer-events-none drop-shadow-lg" />
            )}
        </div>

        <div className="flex-shrink-0">
            <div className="flex overflow-x-auto space-x-2 pb-2">
            {previews.map((src, index) => (
                <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`flex-shrink-0 h-20 w-20 rounded-lg p-1 transition-all duration-200 ${
                    activeIndex === index ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--color-bg))] ring-[rgb(var(--color-primary))]' : 'ring-1 ring-[rgb(var(--color-border))]'
                }`}
                >
                <img
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-contain rounded-md bg-white"
                />
                </button>
            ))}
            </div>
        </div>
         {isModalOpen && !isPdf && (
            <ImageModal imageUrl={activePreview} onClose={() => setIsModalOpen(false)} />
        )}
    </div>
  );
};

export default DocumentViewer;
