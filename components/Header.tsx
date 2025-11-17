import React, { useState, useRef, useEffect } from 'react';
import type { User } from '../types';
import { Tab } from '../App';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PencilIcon } from './icons/PencilIcon';
import { EyeIcon } from './icons/EyeIcon';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  theme: string;
  setTheme: (theme: 'light' | 'dark' | 'eye-care') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeTab, onTabChange, theme, setTheme }) => {
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  const tabs: { id: Tab, name: string, icon: React.ReactNode }[] = [
    { id: 'document', name: 'Document Analysis', icon: <DocumentTextIcon /> },
    { id: 'text', name: 'Text Analysis', icon: <PencilIcon /> },
  ];

  const themes = [
    { id: 'light', name: 'Light', icon: <SunIcon /> },
    { id: 'dark', name: 'Dark', icon: <MoonIcon /> },
    { id: 'eye-care', name: 'Eye Care', icon: <EyeIcon /> }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-[rgb(var(--color-card)/0.8)] backdrop-blur-md shadow-sm no-print">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
           <svg className="h-8 w-8 text-[rgb(var(--color-primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] hidden sm:block">Emir<span className="text-[rgb(var(--color-primary))]">Ease</span></h1>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="bg-[rgb(var(--color-card-secondary))] p-1 rounded-lg flex items-center space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center justify-center px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-[rgb(var(--color-card))] text-[rgb(var(--color-primary))] shadow-sm'
                    : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-card)/0.5)]'
                }`}
              >
                <span className="w-5 h-5 mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="p-2 rounded-full text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-card-secondary))] transition-colors"
              aria-label="Select theme"
            >
              {theme === 'light' ? <SunIcon /> : theme === 'dark' ? <MoonIcon /> : <EyeIcon />}
            </button>
            {isThemeOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[rgb(var(--color-card))] rounded-lg shadow-lg border border-[rgb(var(--color-border))]">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id as any); setIsThemeOpen(false); }}
                    className={`w-full flex items-center px-4 py-2 text-sm text-left ${
                      theme === t.id ? 'text-[rgb(var(--color-primary))] font-semibold' : 'text-[rgb(var(--color-text-primary))]'
                    } hover:bg-[rgb(var(--color-card-secondary))]`}
                  >
                    <span className="w-5 h-5 mr-3">{t.icon}</span>
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {user && (
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[rgb(var(--color-primary-text))] bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-card))] focus:ring-[rgb(var(--color-primary))] transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;