import React from 'react';

interface WorkflowProgressProps {
  totalSteps: number;
  completedSteps: number;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ totalSteps, completedSteps }) => {
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="my-4">
      <div className="flex justify-between mb-1">
        <span className="text-base font-medium text-[rgb(var(--color-primary))]">Progress</span>
        <span className="text-sm font-medium text-[rgb(var(--color-primary))]">{completedSteps} of {totalSteps} steps completed</span>
      </div>
      <div className="w-full bg-[rgb(var(--color-card-secondary))] rounded-full h-2.5">
        <div 
          className="bg-[rgb(var(--color-primary))] h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default WorkflowProgress;