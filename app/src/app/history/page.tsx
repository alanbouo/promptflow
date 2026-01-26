'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { JobSummary } from '../../lib/types/job';

export default function HistoryPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch('/api/jobs');
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  const statusCounts = {
    all: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    running: jobs.filter(j => j.status === 'running').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    pending: jobs.filter(j => j.status === 'pending').length,
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Job History</h1>
        <p className="text-slate-600">View all your processing jobs and their results</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'running', label: 'Running' },
          { key: 'pending', label: 'Pending' },
          { key: 'failed', label: 'Failed' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label} ({statusCounts[key as keyof typeof statusCounts] || 0})
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              {filter === 'all' ? 'No jobs yet' : `No ${filter} jobs`}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {filter === 'all' 
                ? 'Start by configuring a prompt and adding some input data'
                : 'Try selecting a different filter'}
            </p>
            {filter === 'all' && (
              <Link 
                href="/configure"
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Create your first job
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/output?jobId=${job.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {job.name || (job.templateName ? `${job.templateName}` : `Job ${job.id.slice(0, 8)}...`)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {job.itemsCompleted}/{job.itemsTotal} items • {job.tokenUsage || 0} tokens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(job.createdAt)}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!isLoading && jobs.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-sm text-slate-500">Total Jobs</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.running}</p>
            <p className="text-sm text-slate-500">Running</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-2xl font-bold text-slate-900">
              {jobs.reduce((acc, job) => acc + (job.tokenUsage || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Total Tokens</p>
          </div>
        </div>
      )}
    </div>
  );
}
