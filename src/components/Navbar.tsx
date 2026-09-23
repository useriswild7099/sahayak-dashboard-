import React from 'react';
import { PhoneCall, ShieldAlert, Users, FileText, CheckCircle2, PhoneForwarded, HelpCircle } from 'lucide-react';
import { AtrocityCase } from '../types/ivr';

interface NavbarProps {
  currentView: 'caseworker' | 'citizen' | 'simulator' | 'ethics';
  onSelectView: (view: 'caseworker' | 'citizen' | 'simulator' | 'ethics') => void;
  cases: AtrocityCase[];
  onOpenPhoneWithCase: (c?: AtrocityCase) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  cases,
  onOpenPhoneWithCase,
}) => {
  // Compute lapsed contacts (> 14 days)
  const today = new Date().toISOString().split('T')[0];
  const lapsedCount = cases.filter((c) => {
    if (!c.lastContactDate) return true;
    const diffDays = Math.floor(
      (new Date(today).getTime() - new Date(c.lastContactDate).getTime()) / (1000 * 3600 * 24)
    );
    return diffDays > 14 && c.consentStatus !== 'opted_out';
  }).length;

  const urgentCount = cases.filter((c) => c.currentUrgency === 'critical' || c.currentUrgency === 'high').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Indian National Tricolour Top Strip */}
      <div className="h-1.5 w-full flex">
        <div className="flex-1 bg-[#FF9933]" title="Saffron (Courage & Sacrifice)" />
        <div className="flex-1 bg-white" title="White (Truth & Peace)" />
        <div className="flex-1 bg-[#138808]" title="Green (Prosperity & Faith)" />
      </div>

      {/* Official Government of India Top Banner */}
      <div className="bg-[#0b2545] text-white px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            {/* Ashoka Emblem Placeholder / Crest */}
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-serif text-amber-300 font-bold border border-amber-300/40 text-sm">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 tracking-wider">भारत सरकार</span>
                <span className="text-white/40">|</span>
                <span className="font-semibold text-white">GOVERNMENT OF INDIA</span>
              </div>
              <div className="text-[11px] text-slate-300">
                सामाजिक न्याय और अधिकारिता मंत्रालय · Ministry of Social Justice and Empowerment
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300 self-end sm:self-auto">
            <span className="flex items-center gap-1 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>National IVR Gateway Online</span>
            </span>
            <span className="hidden md:inline text-white/50">|</span>
            <span className="font-semibold text-white">
              Toll-Free Helpline: <span className="text-amber-300 font-mono">1800-11-2026 / 14566</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main App Title & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Act Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">MoSJE Sahayak</h1>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded border border-blue-200">
                PoA Follow-Up Portal
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Scheduled Multilingual Check-ins &amp; Section 15A Witness Protection Continuity
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectView('caseworker')}
            className={`px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              currentView === 'caseworker'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-300 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>District Casework Queue</span>
            {lapsedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-red-100 text-red-700 font-bold border border-red-200">
                {lapsedCount} Lapsed
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectView('citizen')}
            className={`px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              currentView === 'citizen'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-300 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>Citizen Rights &amp; Preferences</span>
          </button>

          <button
            onClick={() => onSelectView('simulator')}
            className={`px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              currentView === 'simulator'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-300 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
            <span>Feature Phone Simulator</span>
          </button>

          <button
            onClick={() => onSelectView('ethics')}
            className={`px-3 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              currentView === 'ethics'
                ? 'bg-white text-amber-800 shadow-xs border border-amber-300 font-bold'
                : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Problem Critique &amp; Reality Check</span>
          </button>
        </nav>

        {/* Quick Launch Call Action */}
        <div>
          <button
            onClick={() => {
              onSelectView('simulator');
              onOpenPhoneWithCase();
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs flex items-center gap-2"
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            <span>Simulate Live IVR Call</span>
          </button>
        </div>
      </div>
    </header>
  );
};
