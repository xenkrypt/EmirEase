import React, { useState, useEffect } from 'react';
import type { ExtractedData, Workflow, PiiArea } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { EXPIRATION_THRESHOLD_DAYS } from '../constants';
import WorkflowProgress from './WorkflowProgress';
import ImageModal from './ImageModal';
import SignatureModal from './SignatureModal';
import { findPiiForRedaction } from '../services/geminiService';


interface ResultsDisplayProps {
  imagePreviews: string[];
  originalFiles: File[];
  data: ExtractedData[];
  workflow: Workflow;
  crossValidationNotes: string[] | null;
  documentType: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ imagePreviews, originalFiles, data, workflow, crossValidationNotes, documentType }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [redactedPreviews, setRedactedPreviews] = useState<string[]>(imagePreviews);
  const [isRedacting, setIsRedacting] = useState(false);
  
  const handleStepToggle = (stepId: number) => {
    const newCompletedSteps = new Set(completedSteps);
    if (newCompletedSteps.has(stepId)) {
      newCompletedSteps.delete(stepId);
    } else {
      newCompletedSteps.add(stepId);
    }
    setCompletedSteps(newCompletedSteps);
  };
  
  const handleExport = () => {
    window.print();
  };
  
  const handleRedact = async () => {
    setIsRedacting(true);
    const newPreviews = [...imagePreviews];

    for (let i = 0; i < originalFiles.length; i++) {
        const file = originalFiles[i];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise<void>(resolve => {
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                try {
                    const piiAreas = await findPiiForRedaction({ base64Data, mimeType: file.type });
                    
                    const image = new Image();
                    image.src = imagePreviews[i];
                    await new Promise<void>(resolveImg => {
                        image.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = image.naturalWidth;
                            canvas.height = image.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(image, 0, 0);
                                ctx.fillStyle = 'black';
                                piiAreas.forEach(area => {
                                    ctx.fillRect(
                                        area.x * canvas.width,
                                        area.y * canvas.height,
                                        area.width * canvas.width,
                                        area.height * canvas.height
                                    );
                                });
                                newPreviews[i] = canvas.toDataURL();
                            }
                            resolveImg();
                        }
                    });
                } catch(e) {
                    console.error("Redaction failed for image", i, e);
                }
                resolve();
            }
        });
    }
    setRedactedPreviews(newPreviews);
    setIsRedacting(false);
  }

  const isExpiringSoon = (dateStr: string) => {
    try {
        const expiryDate = new Date(dateStr);
        if (isNaN(expiryDate.getTime())) return false;
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() + EXPIRATION_THRESHOLD_DAYS);
        return expiryDate > now && expiryDate <= thresholdDate;
    } catch(e) {
        return false;
    }
  };

  return (
    <div className="space-y-8" id="printable-area">
      <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md">
         <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-1">Analysis Results</h2>
              <p className="text-md text-[rgb(var(--color-text-secondary))]">Detected Document Type: <span className="font-semibold text-[rgb(var(--color-primary))]">{documentType}</span></p>
            </div>
            <div className="flex items-center space-x-2 no-print">
               <button onClick={handleRedact} disabled={isRedacting} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card-secondary))] rounded-md hover:bg-[rgb(var(--color-border))] transition-colors disabled:opacity-50">
                {isRedacting ? <div className="w-4 h-4 border-2 border-[rgb(var(--color-text-tertiary))] border-t-transparent rounded-full animate-spin mr-2"></div> : <ShieldCheckIcon className="w-4 h-4 mr-2" />}
                {isRedacting ? 'Redacting...' : 'Redact PII'}
              </button>
              <button onClick={() => setSignatureModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card-secondary))] rounded-md hover:bg-[rgb(var(--color-border))] transition-colors">
                <PencilSquareIcon className="w-4 h-4 mr-2" />
                Sign Document
              </button>
              <button onClick={handleExport} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-text))] bg-[rgb(var(--color-primary))] rounded-md hover:bg-[rgb(var(--color-primary-hover))] transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export PDF
              </button>
            </div>
         </div>
      </div>
      
      <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))] mb-4">Extracted Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative p-2 bg-[rgb(var(--color-card-secondary))] rounded-lg">
                <div className="flex overflow-x-auto space-x-4">
                  {redactedPreviews.map((src, index) => (
                    <img key={index} src={src} alt={`Document preview ${index + 1}`} onClick={() => setCurrentImage(src)} className="flex-shrink-0 h-48 w-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </div>
                {signature && <img src={signature} alt="User signature" className="absolute bottom-4 right-4 h-12 w-auto pointer-events-none" />}
            </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[rgb(var(--color-border))]">
              <tbody className="bg-[rgb(var(--color-card))] divide-y divide-[rgb(var(--color-border))]">
                {data.map((item, index) => (
                  <tr key={index} className={`transition-colors ${item.label.toLowerCase().includes('expiry') && isExpiringSoon(item.value) ? 'bg-[rgb(var(--color-danger-bg))]' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-secondary))]">{item.label}</td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-primary))] font-semibold">{item.value}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success-text))]">
                          <CheckCircleIcon className="w-4 h-4 mr-1" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
                          <XCircleIcon className="w-4 h-4 mr-1" /> Mock Data
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[rgb(var(--color-text-tertiary))] mt-2 no-print">*Verification is for demonstration purposes only.</p>
          </div>
        </div>
      </div>
      
      {crossValidationNotes && crossValidationNotes.length > 0 && (
        <div className="bg-[rgb(var(--color-primary)/0.1)] p-6 rounded-xl shadow-md border-l-4 border-[rgb(var(--color-primary))]">
          <h3 className="text-xl font-bold text-[rgb(var(--color-primary))] mb-3 flex items-center">
            <InformationCircleIcon className="w-6 h-6 mr-2" />
            Cross-Validation Notes
          </h3>
          <ul className="list-disc list-inside space-y-2 text-[rgb(var(--color-primary))]">
            {crossValidationNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))] mb-2">{workflow.title}</h3>
        <WorkflowProgress totalSteps={workflow.steps.length} completedSteps={completedSteps.size} />
        <div className="mt-6 space-y-4">
            {workflow.steps.map((step) => (
                <div key={step.id} className="flex items-start">
                    <input
                        type="checkbox"
                        id={`step-${step.id}`}
                        checked={completedSteps.has(step.id)}
                        onChange={() => handleStepToggle(step.id)}
                        className="h-5 w-5 rounded border-[rgb(var(--color-border))] text-[rgb(var(--color-primary))] focus:ring-[rgb(var(--color-primary))] mt-1 cursor-pointer no-print"
                    />
                    <div className="ml-4">
                        <label htmlFor={`step-${step.id}`} className={`font-semibold text-[rgb(var(--color-text-primary))] cursor-pointer transition-colors ${completedSteps.has(step.id) ? 'line-through text-[rgb(var(--color-text-secondary))]' : ''}`}>
                            {step.id}. {step.title}
                        </label>
                        <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-1">{step.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
      
      {currentImage && <ImageModal imageUrl={currentImage} onClose={() => setCurrentImage(null)} />}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={(dataUrl) => {
            setSignature(dataUrl);
            setSignatureModalOpen(false);
        }}
      />
    </div>
  );
};

export default ResultsDisplay;