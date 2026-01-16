import React, { useEffect, useState } from 'react';
import { JobStatus } from '../lib/types/job';

interface ProgressIndicatorProps {
  status: JobStatus;
  itemsCompleted: number;
  itemsTotal: number;
  startedAt?: Date;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  itemsCompleted,
  itemsTotal,
  startedAt
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<number | null>(null);
  
  // Calculate progress percentage
  const progressPercentage = itemsTotal > 0 
    ? Math.round((itemsCompleted / itemsTotal) * 100) 
    : 0;
  
  // Update elapsed time and estimated time remaining
  useEffect(() => {
    if (!startedAt || status === 'completed' || status === 'failed' || status === 'cancelled') {
      return;
    }
    
    // Calculate initial elapsed time
    const calculateElapsed = () => {
      const now = new Date();
      const started = new Date(startedAt);
      return Math.floor((now.getTime() - started.getTime()) / 1000);
    };
    
    // Set initial elapsed time
    setElapsedSeconds(calculateElapsed());
    
    // Update elapsed time every second
    const timer = setInterval(() => {
      const elapsed = calculateElapsed();
      setElapsedSeconds(elapsed);
      
      // Calculate estimated time remaining
      if (itemsCompleted > 0) {
        const secondsPerItem = elapsed / itemsCompleted;
        const remaining = secondsPerItem * (itemsTotal - itemsCompleted);
        setEstimatedSecondsRemaining(Math.round(remaining));
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startedAt, status, itemsCompleted, itemsTotal]);
  
  // Format time as mm:ss or hh:mm:ss
  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get status color
  const getStatusColor = (): string => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  };
  
  // Get status text
  const getStatusText = (): string => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Progress</h2>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">
            {getStatusText()} - {progressPercentage}%
          </span>
          <span className="text-sm font-medium">
            {itemsCompleted} / {itemsTotal} items
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${getStatusColor()}`} 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Elapsed Time</div>
          <div className="font-medium">{formatTime(elapsedSeconds)}</div>
        </div>
        
        <div>
          <div className="text-gray-500 dark:text-gray-400">Estimated Time Remaining</div>
          <div className="font-medium">
            {status === 'running' && estimatedSecondsRemaining !== null
              ? formatTime(estimatedSecondsRemaining)
              : status === 'completed'
                ? '00:00'
                : '--:--'}
          </div>
        </div>
      </div>
      
      {status === 'failed' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm">
          <div className="font-medium">Processing Error</div>
          <p>One or more items failed to process. Check the results table for details.</p>
        </div>
      )}
      
      {status === 'cancelled' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-md text-sm">
          <div className="font-medium">Job Cancelled</div>
          <p>This job was cancelled before completion.</p>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
