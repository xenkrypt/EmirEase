import React, { useState, useEffect, useRef } from 'react';
import type { ExtractedData, Workflow } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DocumentReportIcon } from './icons/DocumentReportIcon';
import { DocumentRedactIcon } from './icons/DocumentRedactIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';

import { EXPIRATION_THRESHOLD_DAYS } from '../constants';
import WorkflowProgress from './WorkflowProgress';
import SignatureModal from './SignatureModal';
import DocumentViewer from './DocumentViewer';
import { findPiiForRedaction } from '../services/geminiService';
import { validateFiles } from '../utils/fileUtils';

declare var jsPDF: any;

interface ResultsDisplayProps {
  imagePreviews: string[];
  originalFiles: File[];
  data: ExtractedData[];
  workflow: Workflow;
  crossValidationNotes: string[] | null;
  documentType: string;
  onAddFiles: (files: File[]) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ imagePreviews, originalFiles, data, workflow, crossValidationNotes, documentType, onAddFiles }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [redactedPreviews, setRedactedPreviews] = useState<string[]>(imagePreviews);
  const [isRedacting, setIsRedacting] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const groupedData = data.reduce((acc, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {} as Record<string, ExtractedData[]>);

  const sectionOrder = ['Personal Information', 'Document Identification', 'Validity & Dates', 'Location & Address', 'Miscellaneous'];
  const orderedSections = sectionOrder.filter(section => groupedData[section]);

  useEffect(() => {
    setRedactedPreviews(imagePreviews);
  }, [imagePreviews]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleStepToggle = (stepId: number) => {
    const newCompletedSteps = new Set(completedSteps);
    if (newCompletedSteps.has(stepId)) {
      newCompletedSteps.delete(stepId);
    } else {
      newCompletedSteps.add(stepId);
    }
    setCompletedSteps(newCompletedSteps);
  };
  
  const handleExportReport = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  const handleExportRedacted = async () => {
    const imageFiles = originalFiles.filter(f => f.type.startsWith('image/'));
    if(imageFiles.length === 0) {
      alert("No images available to redact and export.");
      return;
    }
    
    // Assumes redactedPreviews are up-to-date and correspond to image files
    const doc = new jsPDF();
    redactedPreviews.forEach((dataUrl, index) => {
      if (originalFiles[index].type.startsWith('image/')) {
        if(index > 0) doc.addPage();
        const img = new Image();
        img.src = dataUrl;
        // You might need to adjust width/height logic based on image aspect ratio and PDF page size
        doc.addImage(img, 'PNG', 10, 10, 190, 0); 
      }
    });
    doc.save(`EmirEase-Redacted-${Date.now()}.pdf`);
    setIsExportMenuOpen(false);
  }
  
  const handleRedact = async () => {
    setIsRedacting(true);
    const newPreviews = [...imagePreviews];

    for (let i = 0; i < originalFiles.length; i++) {
        const file = originalFiles[i];
        if(!file.type.startsWith('image/')) continue;

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

  const handleAddFilesClick = () => {
    addFilesInputRef.current?.click();
  };

  const handleAddFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const { validFiles, error } = validateFiles(e.target.files);
      if (error) {
        alert(error);
      } else if (validFiles.length > 0) {
        onAddFiles(validFiles);
      }
      e.target.value = ''; // Allow re-uploading the same file
    }
  };


  return (
    <div className="space-y-8" id="printable-area">
      <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md print-card">
         <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-1">Analysis Results</h2>
              <p className="text-md text-[rgb(var(--color-text-secondary))]">Detected Document Type: <span className="font-semibold text-[rgb(var(--color-primary))]">{documentType}</span></p>
            </div>
            <div className="flex items-center space-x-2 no-print">
              <input type="file" multiple ref={addFilesInputRef} className="hidden" onChange={handleAddFilesChange} accept="image/png, image/jpeg, application/pdf" />
              <button onClick={handleAddFilesClick} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card-secondary))] rounded-md hover:bg-[rgb(var(--color-border))] transition-colors">
                <PlusCircleIcon className="w-4 h-4 mr-2" />
                Add Document
              </button>
               <button onClick={handleRedact} disabled={isRedacting} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card-secondary))] rounded-md hover:bg-[rgb(var(--color-border))] transition-colors disabled:opacity-50">
                {isRedacting ? <div className="w-4 h-4 border-2 border-[rgb(var(--color-text-tertiary))] border-t-transparent rounded-full animate-spin mr-2"></div> : <ShieldCheckIcon className="w-4 h-4 mr-2" />}
                {isRedacting ? 'Redacting...' : 'Redact PII'}
              </button>
              <button onClick={() => setSignatureModalOpen(true)} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card-secondary))] rounded-md hover:bg-[rgb(var(--color-border))] transition-colors">
                <PencilSquareIcon className="w-4 h-4 mr-2" />
                Sign Document
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button onClick={() => setIsExportMenuOpen(prev => !prev)} className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-text))] bg-[rgb(var(--color-primary))] rounded-md hover:bg-[rgb(var(--color-primary-hover))] transition-colors">
                  Export
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[rgb(var(--color-card))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] z-10">
                    <button onClick={handleExportReport} className="w-full flex items-center px-4 py-2 text-sm text-left text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-card-secondary))]">
                      <DocumentReportIcon className="w-4 h-4 mr-3"/> Export Analysis Report
                    </button>
                    <button onClick={handleExportRedacted} className="w-full flex items-center px-4 py-2 text-sm text-left text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-card-secondary))]">
                      <DocumentRedactIcon className="w-4 h-4 mr-3"/> Export Redacted Document
                    </button>
                  </div>
                )}
              </div>
            </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
            <DocumentViewer
              previews={redactedPreviews}
              originalFiles={originalFiles}
              signature={signature}
            />
        </div>

        <div className="md:col-span-3 bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md print-card">
          <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))] mb-4">Extracted Information</h3>
          <div className="space-y-4">
            {orderedSections.map(section => (
              <div key={section}>
                <h4 className="font-semibold text-[rgb(var(--color-text-secondary))] mb-2">{section}</h4>
                <div className="space-y-2">
                    {groupedData[section].map((item, index) => (
                      <div key={index} className={`border border-[rgb(var(--color-border))] rounded-lg transition-all duration-300 ${item.label.toLowerCase().includes('expiry') && isExpiringSoon(item.value) ? 'bg-[rgb(var(--color-danger-bg))]' : 'bg-[rgb(var(--color-card-secondary))]'}`}>
                        <button onClick={() => setExpandedItem(expandedItem === item.label ? null : item.label)} className="w-full flex justify-between items-center p-3 text-left">
                          <span className="font-medium text-[rgb(var(--color-text-primary))]">{item.label}: <span className="font-normal text-[rgb(var(--color-text-secondary))]">{item.value}</span></span>
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedItem === item.label ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedItem === item.label && (
                           <div className="px-3 pb-3 text-sm">
                            <div className="flex items-center space-x-2">
                              {item.verified ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success-text))]">
                                  <CheckCircleIcon className="w-4 h-4 mr-1" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
                                  <XCircleIcon className="w-4 h-4 mr-1" /> Mock Data
                                </span>
                              )}
                              <p className="text-[rgb(var(--color-text-tertiary))] italic">{item.reason}</p>
                            </div>
                           </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {crossValidationNotes && crossValidationNotes.length > 0 && (
        <div className="bg-[rgb(var(--color-primary)/0.1)] p-6 rounded-xl shadow-md border-l-4 border-[rgb(var(--color-primary))] print-card">
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

      <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md print-card">
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
