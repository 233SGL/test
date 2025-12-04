import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'indigo';
}

const colorStyles = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color = 'blue' }) => {
  return (
    <div className={`p-6 rounded-xl border bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-start justify-between group`}>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1 group-hover:text-slate-600 transition-colors">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorStyles[color]} bg-opacity-50 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
    </div>
  );
};