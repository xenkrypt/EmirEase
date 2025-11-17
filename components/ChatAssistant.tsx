import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Language } from '../types';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';

interface ChatAssistantProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  currentLanguage: Language;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ history, onSendMessage, isLoading, currentLanguage }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // Using any for SpeechRecognition

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.lang = currentLanguage.code;
    }
  }, [currentLanguage]);

  const handleToggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage.code;
      window.speechSynthesis.cancel(); // Cancel any previous speech
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] bg-[rgb(var(--color-card))] rounded-xl shadow-md">
      <div className="p-4 border-b border-[rgb(var(--color-border))]">
        <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))]">AI Assistant</h3>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">Ask a follow-up question</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center text-white font-bold flex-shrink-0"> AI </div>
            )}
            <div className={`flex flex-col max-w-[320px] leading-1.5 p-4 border-[rgb(var(--color-border))] rounded-e-xl rounded-es-xl ${
                msg.sender === 'user'
                  ? 'bg-[rgb(var(--color-primary))] rounded-s-xl rounded-es-none text-[rgb(var(--color-primary-text))]'
                  : 'bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))]'
              }`}>
              <p className="text-sm font-normal">{msg.text}</p>
            </div>
            {msg.sender === 'ai' && (
                <button onClick={() => handleSpeak(msg.text)} className="p-2 text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors">
                    <SpeakerWaveIcon />
                </button>
            )}
          </div>
        ))}
         {isLoading && history.length > 0 && history[history.length-1].sender === 'user' && (
            <div className="flex items-start gap-2.5">
               <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center text-white font-bold flex-shrink-0"> AI </div>
              <div className="flex flex-col max-w-[320px] leading-1.5 p-4 border-[rgb(var(--color-border))] rounded-e-xl rounded-es-xl bg-[rgb(var(--color-card-secondary))]">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-tertiary))] animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-[rgb(var(--color-border))] mt-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type or speak your message..."
            className="flex-1 p-3 border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-transparent transition"
            disabled={isLoading}
          />
          {recognitionRef.current && (
            <button type="button" onClick={handleToggleListening} className={`p-3 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-[rgb(var(--color-card-secondary))] text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-border))]'}`}>
              <MicrophoneIcon />
            </button>
          )}
          <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-text))] rounded-lg hover:bg-[rgb(var(--color-primary-hover))] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;