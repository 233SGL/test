
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Megaphone, Save, CheckCircle } from 'lucide-react';

export const StylingSettings: React.FC = () => {
  const { settings, updateSettings, isSaving } = useData();
  const { hasPermission } = useAuth();
  
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [showSuccess, setShowSuccess] = useState(false);

  const canEdit = hasPermission('MANAGE_SYSTEM') || hasPermission('EDIT_WEIGHTS');

  const handleSave = async () => {
      await updateSettings({ announcement });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!canEdit) {
      return <div>权限不足</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                    <Megaphone size={22} />
                </div>
                定型工段设置
            </h1>
            <p className="text-slate-500 mt-1 text-sm">管理该工段的公共显示内容</p>
        </div>

        {showSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-3 animate-fade-in-up">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                  <CheckCircle size={18} />
              </div>
              <span className="font-medium">设置已保存</span>
          </div>
        )}

        <div className="card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
                    <Megaphone size={22} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">车间公告 / 跑马灯</h3>
                    <p className="text-sm text-slate-500">配置车间大屏底部的滚动通知内容</p>
                </div>
            </div>
            <div className="p-6">
                <textarea 
                    className="input h-32 resize-none focus:ring-pink-500 focus:border-pink-500"
                    value={announcement}
                    onChange={e => setAnnouncement(e.target.value)}
                    placeholder="输入公告内容..."
                />
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-xl hover:from-pink-700 hover:to-pink-600 transition-all shadow-lg shadow-pink-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} /> 保存配置
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
