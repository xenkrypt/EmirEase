import React, { useState } from 'react';
import Header from './components/Header';
import Auth from './components/Auth';
import DocumentAnalysis from './components/tabs/DocumentAnalysis';
import TextAnalysis from './components/tabs/TextAnalysis';
import type { User } from './types';
import { useTheme } from './hooks/useTheme';

export type Tab = 'document' | 'text';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('emirease_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('document');
  
  const [theme, setTheme] = useTheme();

  const handleLogin = (username: string) => {
    const userData = { username };
    localStorage.setItem('emirease_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('emirease_user');
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen text-[rgb(var(--color-text-primary))]">
      <Header
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        setTheme={setTheme}
      />
      <main className="container mx-auto p-4 md:p-8">
        {activeTab === 'document' && <DocumentAnalysis />}
        {activeTab === 'text' && <TextAnalysis />}
      </main>
    </div>
  );
};

export default App;