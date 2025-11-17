import React, { useState } from 'react';
import { analyzeTextFromPrompt } from '../../services/geminiService';
import Loader from '../Loader';
import { languages } from '../../constants';
import type { Language } from '../../types';

type Task = 'summarize' | 'translate' | 'keywords' | 'correct';

const TextAnalysis: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [task, setTask] = useState<Task>('summarize');
    const [language, setLanguage] = useState<Language>(languages[1]);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const taskDescriptions: Record<Task, string> = {
        summarize: 'Provide a concise summary of the following text.',
        translate: `Translate the following text into ${language.name}.`,
        keywords: 'Extract the main keywords from the following text.',
        correct: 'Correct any spelling and grammar mistakes in the following text.'
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to analyze.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const analysisResult = await analyzeTextFromPrompt(inputText, taskDescriptions[task], language.name);
            setResult(analysisResult);
        } catch (e: any) {
            setError(`Analysis failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">Text Analysis</h2>
                <p className="text-lg text-[rgb(var(--color-text-secondary))]">Paste your text below and choose a task for the AI to perform.</p>
            </div>

            <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md space-y-4">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    rows={10}
                    className="w-full p-3 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition"
                    placeholder="Paste your text here..."
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center space-x-2">
                        <label htmlFor="task-select" className="font-medium">Task:</label>
                        <select
                            id="task-select"
                            value={task}
                            onChange={(e) => setTask(e.target.value as Task)}
                            className="appearance-none bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-primary))] py-2 pl-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-colors"
                        >
                            <option value="summarize">Summarize</option>
                            <option value="translate">Translate</option>
                            <option value="keywords">Extract Keywords</option>
                            <option value="correct">Correct Grammar</option>
                        </select>
                    </div>

                    {task === 'translate' && (
                         <div className="flex items-center space-x-2">
                            <label htmlFor="lang-select" className="font-medium">To:</label>
                            <select
                                id="lang-select"
                                value={language.code}
                                onChange={(e) => {
                                    const selectedLang = languages.find(l => l.code === e.target.value);
                                    if (selectedLang) setLanguage(selectedLang);
                                }}
                                className="appearance-none bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] text-[rgb(var(--color-text-primary))] py-2 pl-3 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] transition-colors"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] font-semibold rounded-lg hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                         {isLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
                        {isLoading ? 'Analyzing...' : 'Analyze Text'}
                    </button>
                </div>
            </div>

            {error && <p className="text-[rgb(var(--color-danger-text))] text-center">{error}</p>}

            {isLoading && !result && <Loader message="AI is processing your text..." />}

            {result && (
                 <div className="bg-[rgb(var(--color-card))] p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))] mb-4">Result</h3>
                    <div className="prose prose-red dark:prose-invert max-w-none whitespace-pre-wrap text-[rgb(var(--color-text-secondary))]">
                        {result}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TextAnalysis;