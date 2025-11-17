import React, { useState, useRef, useEffect } from 'react';
import { runSimulationTurn } from '../../services/geminiService';
import { searchKnowledgeBase, KnowledgeBaseChunk } from '../../services/qdrantService';
import type { ChatMessage } from '../../types';
import { SendIcon } from '../icons/SendIcon';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

interface Scenario {
    id: string;
    title: string;
    description: string;
    initialMessage: string;
}

const scenarios: Scenario[] = [
  { id: 'eid', title: 'Renew Emirates ID', description: 'Simulate the process of renewing your Emirates ID.', initialMessage: "Hello! I am the Opus Simulation Agent. I see you want to simulate renewing your Emirates ID. To start, could you tell me if your ID is already expired or is it about to expire?" },
  { id: 'gv', title: 'Apply for Golden Visa', description: 'Walk through the eligibility checks and application for a long-term visa.', initialMessage: "Hello! I'm the Opus Simulation Agent. I can guide you through the Golden Visa application process. Are you applying as an investor, a professional, or another category?" },
  { id: 'tf', title: 'Settle Traffic Fines', description: 'Learn how to check, contest, and pay traffic violations.', initialMessage: "Welcome. I am the Opus Simulation Agent. Let's simulate settling a traffic fine. Do you know the violation number, or would you like to check for fines using a license plate?" },
];

const ServiceSimulation: React.FC = () => {
    const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ragStatus, setRagStatus] = useState<{ status: 'searching' | 'found' | 'none', chunks?: KnowledgeBaseChunk[] }>({ status: 'none' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [chatHistory]);

    const handleSelectScenario = (scenario: Scenario) => {
        setSelectedScenario(scenario);
        setChatHistory([{ sender: 'ai', text: scenario.initialMessage }]);
    };

    const handleBack = () => {
        setSelectedScenario(null);
        setChatHistory([]);
        setError('');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !selectedScenario) return;

        const userMessage: ChatMessage = { sender: 'user', text: input.trim() };
        setChatHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError('');

        try {
            // 1. Search Vector DB (RAG)
            setRagStatus({ status: 'searching' });
            const retrievedChunks = await searchKnowledgeBase(input.trim(), selectedScenario.title);
            setRagStatus({ status: 'found', chunks: retrievedChunks });

            // 2. Call Gemini (Opus)
            const contextForModel = retrievedChunks.map(c => `[${c.topic}]: ${c.content}`);
            const answer = await runSimulationTurn([...chatHistory, userMessage], contextForModel, 'English');
            const aiMessage: ChatMessage = { sender: 'ai', text: answer };
            setChatHistory(prev => [...prev, aiMessage]);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setRagStatus({ status: 'none' });
        }
    };

    if (!selectedScenario) {
        return (
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">Service Simulation</h2>
                <p className="text-lg text-[rgb(var(--color-text-secondary))] mb-8">Choose a government procedure to walk through with our advanced AI agent.</p>
                <div className="grid md:grid-cols-3 gap-6">
                    {scenarios.map(s => (
                        <button key={s.id} onClick={() => handleSelectScenario(s)} className="p-6 bg-[rgb(var(--color-card))] rounded-xl shadow-md text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))]">
                            <h3 className="text-xl font-bold text-[rgb(var(--color-primary))] mb-2">{s.title}</h3>
                            <p className="text-[rgb(var(--color-text-secondary))]">{s.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-h-[75vh] bg-[rgb(var(--color-card))] rounded-xl shadow-lg border border-[rgb(var(--color-border))]">
            <div className="p-4 border-b border-[rgb(var(--color-border))] flex items-center">
                <button onClick={handleBack} className="p-2 mr-2 rounded-full hover:bg-[rgb(var(--color-card-secondary))]">
                    <ArrowLeftIcon />
                </button>
                <div>
                    <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))]">Simulating: {selectedScenario.title}</h3>
                    <p className="text-sm text-[rgb(var(--color-text-secondary))]">Powered by Opus Agent & Qdrant</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                            <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"> AI </div>
                        )}
                        <div className={`flex flex-col max-w-lg leading-1.5 p-4 border-[rgb(var(--color-border))] ${msg.sender === 'user' ? 'bg-[rgb(var(--color-primary))] rounded-s-xl rounded-ee-xl text-[rgb(var(--color-primary-text))]' : 'bg-[rgb(var(--color-card-secondary))] rounded-e-xl rounded-es-xl text-[rgb(var(--color-text-primary))]'}`}>
                            <p className="text-sm font-normal whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"> AI </div>
                        <div className="flex flex-col max-w-[320px] leading-1.5 p-4 border-[rgb(var(--color-border))] rounded-e-xl rounded-es-xl bg-[rgb(var(--color-card-secondary))]">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse delay-75"></div>
                                <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                {ragStatus.status === 'searching' && <div className="text-sm text-center text-[rgb(var(--color-text-tertiary))] animate-pulse">Searching knowledge base...</div>}
                {ragStatus.status === 'found' && ragStatus.chunks && ragStatus.chunks.length > 0 && (
                     <div className="text-sm text-center text-green-600 dark:text-green-400">
                        ✓ Retrieved context on: {ragStatus.chunks.map(c => `'${c.topic}'`).join(', ')}
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-[rgb(var(--color-border))] mt-auto">
                {error && <p className="text-sm text-center text-[rgb(var(--color-danger-text))] mb-2">{error}</p>}
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1 p-3 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition"
                        disabled={isLoading} />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] rounded-lg hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServiceSimulation;
