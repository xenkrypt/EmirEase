import React, { useState, useCallback, useEffect } from 'react';
import FileUpload from '../FileUpload';
import ResultsDisplay from '../ResultsDisplay';
import ChatAssistant from '../ChatAssistant';
import Loader from '../Loader';
import Alerts from '../Alerts';
import { Language } from '../../types';
import type { ExtractedData, Workflow, ChatMessage, GeminiResponse } from '../../types';
import { extractAndGuide, getFaqAnswer, translateData } from '../../services/geminiService';
import { languages, EXPIRATION_THRESHOLD_DAYS } from '../../constants';
import { PdfIconDataUri } from '../icons/PdfIcon';

const DocumentAnalysis: React.FC = () => {
  const [language, setLanguage] = useState<Language>(languages[1]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [apiResponse, setApiResponse] = useState<GeminiResponse | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expiringDocuments, setExpiringDocuments] = useState<ExtractedData[]>([]);

  const checkExpirations = useCallback(() => {
    const user = localStorage.getItem('emirease_user');
    if (!user) return;
    const username = JSON.parse(user).username;
    const allDocsRaw = localStorage.getItem(`expiring_docs_${username}`);
    if (allDocsRaw) {
      const allDocs: ExtractedData[] = JSON.parse(allDocsRaw);
      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(now.getDate() + EXPIRATION_THRESHOLD_DAYS);

      const upcomingExpirations = allDocs.filter(doc => {
        try {
          const expiryDate = new Date(doc.value);
          return !isNaN(expiryDate.getTime()) && expiryDate > now && expiryDate <= thresholdDate;
        } catch(e) { return false; }
      });
      setExpiringDocuments(upcomingExpirations);
    }
  }, []);

  useEffect(() => {
    checkExpirations();
  }, [checkExpirations]);

  const handleReset = () => {
    setUploadedFiles([]);
    setFilePreviews([]);
    setApiResponse(null);
    setChatHistory([]);
    setError(null);
    setIsLoading(false);
  };

  const processApiResponse = useCallback((result: GeminiResponse) => {
    if (result && result.extractedData && result.workflow) {
      setApiResponse(result);
      
      const user = localStorage.getItem('emirease_user');
      if (!user) return;
      const username = JSON.parse(user).username;

      const allDocsRaw = localStorage.getItem(`expiring_docs_${username}`);
      let allDocs: ExtractedData[] = allDocsRaw ? JSON.parse(allDocsRaw) : [];
      const expiryFields = result.extractedData.filter(d => d.label.toLowerCase().includes('expiry'));
      
      expiryFields.forEach(field => {
        const existingIndex = allDocs.findIndex(d => d.value === field.value && d.label === field.label);
        if (existingIndex > -1) {
          allDocs[existingIndex] = field;
        } else {
          allDocs.push(field);
        }
      });

      localStorage.setItem(`expiring_docs_${username}`, JSON.stringify(allDocs));
      checkExpirations();
      
      setChatHistory([{
        sender: 'ai',
        text: `I have analyzed your document(s). It appears to be a ${result.documentType || 'government document'}. You can see the extracted details and next steps. How else can I assist you?`
      }]);
    } else {
      throw new Error('Invalid response structure from AI.');
    }
  }, [checkExpirations]);

  const processFilesForApi = useCallback(async (filesToProcess: File[]) => {
    if (filesToProcess.length === 0) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing your document(s)...');
    setError(null);
    setApiResponse(null); // Clear previous results while processing new set
    setChatHistory([]);
    
    const filePromises = filesToProcess.map(file => {
      return new Promise<{ base64Data: string, mimeType: string, preview: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const resultDataUrl = reader.result as string;
          const preview = file.type === 'application/pdf' ? PdfIconDataUri : resultDataUrl;

          resolve({
            base64Data: resultDataUrl.split(',')[1],
            mimeType: file.type,
            preview: preview
          });
        };
        reader.onerror = error => reject(error);
      });
    });

    try {
      const fileContents = await Promise.all(filePromises);
      setFilePreviews(fileContents.map(f => f.preview));

      const result = await extractAndGuide(fileContents.map(({ base64Data, mimeType }) => ({ base64Data, mimeType })), language.name);
      processApiResponse(result);

    } catch (err: any) {
      console.error(err);
      setError(`Failed to process the document(s). ${err.message || 'The file might be corrupted or in an unsupported format. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [language, processApiResponse]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    setUploadedFiles(files);
    await processFilesForApi(files);
  }, [processFilesForApi]);
  
  const handleAddFiles = useCallback(async (newFiles: File[]) => {
    const combinedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(combinedFiles);
    await processFilesForApi(combinedFiles);
  }, [uploadedFiles, processFilesForApi]);


  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (apiResponse) {
      setIsLoading(true);
      setLoadingMessage(`Translating to ${newLanguage.name}...`);
      try {
        const { extractedData, workflow, crossValidationNotes } = apiResponse;
        const translatedResult = await translateData({ extractedData, workflow, crossValidationNotes }, newLanguage.name);
        setApiResponse(prev => prev ? { ...prev, ...translatedResult } : null);
      } catch (err) {
        setError(`Failed to translate content to ${newLanguage.name}.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    const userMessage: ChatMessage = { sender: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setLoadingMessage('Thinking...');

    try {
      const context = {
          extractedData: apiResponse?.extractedData,
          workflow: apiResponse?.workflow
      }
      const answer = await getFaqAnswer(message, context, language.name);
      const aiMessage: ChatMessage = { sender: 'ai', text: answer };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiResponse, language]);
  
  return (
    <div>
        <div className="flex justify-end items-center mb-4 space-x-4 no-print">
            <div className="relative">
                <select
                value={language.code}
                onChange={(e) => {
                    const selectedLang = languages.find(l => l.code === e.target.value);
                    if (selectedLang) handleLanguageChange(selectedLang);
                }}
                className="appearance-none bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-primary))] py-2 pl-4 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-colors"
                aria-label="Select language"
                >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
                </select>
            </div>
            {apiResponse && (
                <button
                    onClick={handleReset}
                    className="px-4 py-2 border border-[rgb(var(--color-border))] text-sm font-medium rounded-md text-[rgb(var(--color-text-primary))] bg-[rgb(var(--color-card))] hover:bg-[rgb(var(--color-card-secondary))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary))] transition-colors"
                >
                Start Over
                </button>
            )}
        </div>

        <Alerts documents={expiringDocuments} />

        {!apiResponse && !isLoading && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}

        {isLoading && !apiResponse && <Loader message={loadingMessage} />}
        
        {error && (
          <div className="text-center p-8 bg-[rgb(var(--color-danger-bg))] border border-[rgb(var(--color-danger))] text-[rgb(var(--color-danger-text))] rounded-lg">
            <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
            <p>{error}</p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-[rgb(var(--color-danger))] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {apiResponse && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <ResultsDisplay
                imagePreviews={filePreviews}
                originalFiles={uploadedFiles}
                data={apiResponse.extractedData}
                workflow={apiResponse.workflow}
                crossValidationNotes={apiResponse.crossValidationNotes || null}
                documentType={apiResponse.documentType}
                onAddFiles={handleAddFiles}
              />
            </div>
            <div className="lg:col-span-2">
              <ChatAssistant
                history={chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isLoading && !!apiResponse}
                currentLanguage={language}
              />
            </div>
          </div>
        )}
    </div>
  );
}

export default DocumentAnalysis;
