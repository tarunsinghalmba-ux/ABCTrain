import React from 'react';

export type BadgeStatus = 'compliant' | 'in-progress' | 'overdue' | 'due-soon' | 'completed';

interface StatusBadgeProps {
  status: BadgeStatus;
  text?: string;
}

const statusConfig: Record<BadgeStatus, { color: string; defaultText: string }> = {
  'compliant': { color: 'bg-green-100 text-green-800 border-green-200', defaultText: 'Compliant' },
  'in-progress': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', defaultText: 'In Progress' },
  'overdue': { color: 'bg-red-100 text-red-800 border-red-200', defaultText: 'Overdue' },
  'due-soon': { color: 'bg-orange-100 text-orange-800 border-orange-200', defaultText: 'Due Soon' },
  'completed': { color: 'bg-blue-100 text-blue-800 border-blue-200', defaultText: 'Completed' }
};

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayText = text || config.defaultText;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
      role="status"
      aria-label={displayText}
    >
      {displayText}
    </span>
  );
}
