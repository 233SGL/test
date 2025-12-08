/**
 * 指标卡片组件
 * 
 * 用于展示关键数据指标，支持趋势显示和多种配色方案
 * 设计规范: UI_UX_DESIGN_SPEC_V2.md
 */
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  /** 指标标签 */
  label: string;
  /** 指标数值 */
  value: string | number;
  /** 图标组件 */
  icon: LucideIcon;
  /** 趋势数据 */
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** 配色方案 */
  color?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose';
  /** 副标题/描述 */
  subtitle?: string;
}

// 12级色阶系统 - 图标背景和颜色
const colorStyles = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    trend: 'text-indigo-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    trend: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    trend: 'text-amber-600',
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    trend: 'text-sky-600',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    trend: 'text-rose-600',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  color = 'indigo',
  subtitle 
}) => {
  const styles = colorStyles[color];
  
  return (
    <div className="card p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        {/* 左侧: 数据区域 */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500 group-hover:text-slate-600 transition-colors">
            {label}
          </p>
          <p className="text-3xl font-bold tabular-nums text-slate-900 tracking-tight">
            {value}
          </p>
          
          {/* 趋势显示 */}
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {trend.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">vs 上月</span>
            </div>
          )}
          
          {/* 副标题 */}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* 右侧: 图标 */}
        <div className={`p-3 rounded-xl ${styles.bg} group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={24} className={styles.icon} />
        </div>
      </div>
    </div>
  );
};