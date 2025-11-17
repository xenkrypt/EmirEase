import React, { useState } from 'react';
import type { ExtractedData } from '../types';
import { BellIcon } from './icons/BellIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface AlertsProps {
  documents: ExtractedData[];
}

const Alerts: React.FC<AlertsProps> = ({ documents }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!documents.length || !isVisible) {
    return null;
  }

  return (
    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <BellIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Expiration Alert
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>You have {documents.length} document(s) expiring soon:</p>
              <ul className="list-disc list-inside mt-1">
                {documents.map((doc, index) => (
                    <li key={index}>
                        <strong>{doc.label}:</strong> Expires on {new Date(doc.value).toLocaleDateString()}
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => setIsVisible(false)}
              className="inline-flex rounded-md bg-yellow-50 dark:bg-transparent p-1.5 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
