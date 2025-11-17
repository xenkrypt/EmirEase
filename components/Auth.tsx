import React, { useState } from 'react';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    setError('');
    onLogin(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--color-bg))] px-4">
      <div className="max-w-md w-full bg-[rgb(var(--color-card))] p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <svg className="h-10 w-10 text-[rgb(var(--color-primary))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))]">Emir<span className="text-[rgb(var(--color-primary))]">Ease</span></h1>
            </div>
          <h2 className="text-xl text-[rgb(var(--color-text-secondary))]">{isLogin ? 'Sign in to your account' : 'Create a new account'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-card-secondary))] border border-[rgb(var(--color-border))] rounded-md shadow-sm placeholder-[rgb(var(--color-text-tertiary))] focus:outline-none focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] sm:text-sm"
              placeholder="e.g. john.doe"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-[rgb(var(--color-text-primary))]">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-[rgb(var(--color-card-secondary))] border border-[rgb(var(--color-border))] rounded-md shadow-sm placeholder-[rgb(var(--color-text-tertiary))] focus:outline-none focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-[rgb(var(--color-danger-text))]">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[rgb(var(--color-primary-text))] bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--color-primary))]"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-hover))]"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;