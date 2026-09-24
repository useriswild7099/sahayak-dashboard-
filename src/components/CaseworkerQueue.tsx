import React, { useState } from 'react';
import {
  AlertCircle,
  PhoneCall,
  Clock,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Users,
  Eye,
  Filter,
  Edit3,
  CalendarPlus,
  Play,
  RotateCw,
  Cpu,
  ArrowUpDown,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { AtrocityCase, CheckInRecord, SupportNeedType } from '../types/ivr';
import { ScheduleInteractionModal } from './ScheduleInteractionModal';
import { EditCaseRecordModal } from './EditCaseRecordModal';
import { ScheduledBatchRunnerModal } from './ScheduledBatchRunnerModal';
import { ModelIntegrationModal } from './ModelIntegrationModal';
import { therapyModelService } from '../services/therapyModelService';
import { useLanguage } from '../context/LanguageContext';

export interface DistressUrgencyConfig {
  tier: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  label: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  cardBorderClass: string;
  cardBgClass: string;
  barColor: string;
  rangeLabel: string;
}

/**
 * Returns clean, government-compliant color-coded visual indicator styling
 * for distress score thresholds (WCAG AA compliant contrast):
 * - 75–100: CRITICAL (Dignified Crimson)
 * - 55–74:  HIGH (Muted Amber)
 * - 35–54:  MODERATE (Slate Warm)
 * - 0–34:   LOW (Forest Green)
 */
export const getDistressUrgencyConfig = (score: number): DistressUrgencyConfig => {
  if (score >= 75) {
    return {
      tier: 'CRITICAL',
      label: 'Critical',
      badgeClass: 'bg-red-50 text-red-900 border-red-300',
      dotClass: 'bg-red-700',
      textClass: 'text-red-700',
      cardBorderClass: 'border-l-4 border-l-red-600 border-slate-200',
      cardBgClass: 'bg-white',
      barColor: 'bg-red-700',
      rangeLabel: '75–100',
    };
  }
  if (score >= 55) {
    return {
      tier: 'HIGH',
      label: 'High',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
      dotClass: 'bg-amber-600',
      textClass: 'text-amber-800',
      cardBorderClass: 'border-l-4 border-l-amber-500 border-slate-200',
      cardBgClass: 'bg-white',
      barColor: 'bg-amber-600',
      rangeLabel: '55–74',
    };
  }
  if (score >= 35) {
    return {
      tier: 'MODERATE',
      label: 'Moderate',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
      dotClass: 'bg-slate-500',
      textClass: 'text-slate-800',
      cardBorderClass: 'border-l-4 border-l-slate-400 border-slate-200',
      cardBgClass: 'bg-white',
      barColor: 'bg-slate-500',
      rangeLabel: '35–54',
    };
  }
  return {
    tier: 'LOW',
    label: 'Low',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-700',
    textClass: 'text-emerald-800',
    cardBorderClass: 'border-l-4 border-l-emerald-600 border-slate-200',
    cardBgClass: 'bg-white',
    barColor: 'bg-emerald-700',
    rangeLabel: '0–34',
  };
};

interface CaseworkerQueueProps {
  cases: AtrocityCase[];
  checkIns: CheckInRecord[];
  onOpenPhoneWithCase: (c: AtrocityCase) => void;
  onOpenCaseDetail: (c: AtrocityCase) => void;
}

export const CaseworkerQueue: React.FC<CaseworkerQueueProps> = ({
  cases,
  checkIns: _checkIns,
  onOpenPhoneWithCase,
  onOpenCaseDetail,
}) => {
  const { t, tNeed, tTier } = useLanguage();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [filterType, setFilterType] = useState<
    | 'all'
    | 'lapsed'
    | 'urgent_requests'
    | 'due_today'
    | 'model_critical'
    | 'model_high'
    | 'model_moderate'
    | 'model_low'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'distress_desc' | 'distress_asc' | 'urgency' | 'due_date'>('distress_desc');

  // Modal States
  const [caseToSchedule, setCaseToSchedule] = useState<AtrocityCase | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<AtrocityCase | null>(null);
  const [showBatchRunner, setShowBatchRunner] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [scoringCaseId, setScoringCaseId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const triggerToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleReScoreCase = async (caseId: string) => {
    setScoringCaseId(caseId);
    try {
      await therapyModelService.scoreCase(caseId);
      triggerToast('Beneficiary clinical distress assessment refreshed.');
    } finally {
      setScoringCaseId(null);
    }
  };

  const getDaysSinceLastContact = (lastContactDate: string | null) => {
    if (!lastContactDate) return 999;
    const diff = Math.floor(
      (new Date(todayStr).getTime() - new Date(lastContactDate).getTime()) / (1000 * 3600 * 24)
    );
    return Math.max(0, diff);
  };

  // Metrics computation
  const lapsedCases = cases.filter(
    (c) => getDaysSinceLastContact(c.lastContactDate) > 14 && c.consentStatus !== 'opted_out'
  );
  const urgentCases = cases.filter((c) => c.currentUrgency === 'critical' || c.currentUrgency === 'high');
  const dueTodayCases = cases.filter((c) => c.nextScheduledContact <= todayStr && c.consentStatus === 'active');

  const criticalModelCases = cases.filter((c) => (c.therapyModelResult?.distressScore ?? 0) >= 75);
  const highModelCases = cases.filter((c) => {
    const s = c.therapyModelResult?.distressScore ?? 0;
    return s >= 55 && s < 75;
  });
  const moderateModelCases = cases.filter((c) => {
    const s = c.therapyModelResult?.distressScore ?? 0;
    return s >= 35 && s < 55;
  });
  const lowModelCases = cases.filter((c) => {
    const s = c.therapyModelResult?.distressScore;
    return s !== undefined && s < 35;
  });

  // Filter list
  const filteredCases = cases.filter((c) => {
    const daysSince = getDaysSinceLastContact(c.lastContactDate);
    const score = c.therapyModelResult?.distressScore;

    const matchesSearch =
      c.victimPseudonym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseworkerNotes && c.caseworkerNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDistrict = districtFilter === 'ALL' || c.district === districtFilter;
    const matchesChannel =
      channelFilter === 'ALL' ||
      c.preferredChannel === channelFilter ||
      (!c.preferredChannel && channelFilter === 'IVR_VOICE');

    if (!matchesSearch || !matchesDistrict || !matchesChannel) return false;

    if (filterType === 'lapsed') {
      return daysSince > 14 && c.consentStatus !== 'opted_out';
    }
    if (filterType === 'urgent_requests') {
      return c.currentUrgency === 'critical' || c.currentUrgency === 'high';
    }
    if (filterType === 'due_today') {
      return c.nextScheduledContact <= todayStr && c.consentStatus === 'active';
    }
    if (filterType === 'model_critical') {
      return (score ?? 0) >= 75;
    }
    if (filterType === 'model_high') {
      return (score ?? 0) >= 55 && (score ?? 0) < 75;
    }
    if (filterType === 'model_moderate') {
      return (score ?? 0) >= 35 && (score ?? 0) < 55;
    }
    if (filterType === 'model_low') {
      return score !== undefined && score < 35;
    }
    return true;
  });

  // Sorting
  const sortedCases = [...filteredCases].sort((a, b) => {
    const scoreA = a.therapyModelResult?.distressScore ?? -1;
    const scoreB = b.therapyModelResult?.distressScore ?? -1;

    if (sortBy === 'distress_desc') {
      return scoreB - scoreA;
    }
    if (sortBy === 'distress_asc') {
      return (scoreA === -1 ? 999 : scoreA) - (scoreB === -1 ? 999 : scoreB);
    }
    if (sortBy === 'urgency') {
      const urgencyRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (urgencyRank[b.currentUrgency] || 0) - (urgencyRank[a.currentUrgency] || 0);
    }
    if (sortBy === 'due_date') {
      return a.nextScheduledContact.localeCompare(b.nextScheduledContact);
    }
    return 0;
  });

  const uniqueDistricts = Array.from(new Set(cases.map((c) => c.district)));

  const getNeedLabel = (need: SupportNeedType) => {
    return tNeed(need);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded shadow-lg flex items-center gap-2 border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Institutional Header & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-900">District Welfare Cell</span>
              <span aria-hidden="true">·</span>
              <span>Section 15A Witness Protection Triage</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700">{cases.length} Beneficiaries Registered</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              {t('queueTitle')}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {t('queueSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Model Hub Action */}
            <button
              onClick={() => setShowModelModal(true)}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('modelSettingsBtn')}</span>
            </button>

            {/* Scheduled Batch Runner */}
            <button
              onClick={() => setShowBatchRunner(true)}
              className="px-3 py-1.5 rounded bg-[#0B2545] hover:bg-[#12335C] text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('batchRunnerBtn')}</span>
            </button>
          </div>
        </div>

        {/* 4 Quantitative Rigor Triage Metric Counters (Clean Institutional Style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div
            onClick={() => setFilterType('model_critical')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${
              filterType === 'model_critical'
                ? 'bg-red-50/50 border-red-400'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span className="text-red-700 font-bold uppercase tracking-wider">{t('tierCritical')} (≥75)</span>
              <span className="w-2 h-2 rounded-full bg-red-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {criticalModelCases.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">High clinical distress priority</p>
          </div>

          <div
            onClick={() => setFilterType('lapsed')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${
              filterType === 'lapsed'
                ? 'bg-amber-50/50 border-amber-400'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span className="text-amber-800 font-bold uppercase tracking-wider">{t('statLapsed')} (&gt;14d)</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {lapsedCases.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mandatory follow-up overdue</p>
          </div>

          <div
            onClick={() => setFilterType('urgent_requests')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${
              filterType === 'urgent_requests'
                ? 'bg-amber-50/50 border-amber-400'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span className="text-slate-700 font-bold uppercase tracking-wider">{t('statEntitlements')}</span>
              <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {urgentCases.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pending relief or protection</p>
          </div>

          <div
            onClick={() => setFilterType('due_today')}
            className={`p-3.5 rounded border transition-colors cursor-pointer ${
              filterType === 'due_today'
                ? 'bg-blue-50/50 border-blue-400'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
              <span className="text-[#0B2545] font-bold uppercase tracking-wider">{t('today')}</span>
              <Calendar className="w-3.5 h-3.5 text-[#0B2545]" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {dueTodayCases.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Due for scheduled call</p>
          </div>
        </div>
      </div>

      {/* Clinical Urgency Thresholds Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">Distress Urgency Index:</span>
          <span className="text-slate-500 text-[11px] hidden sm:inline">(Automated PHQ/PoA Speech Assessment)</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType(filterType === 'model_low' ? 'all' : 'model_low')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border ${
              filterType === 'model_low'
                ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'model_low' ? 'bg-white' : 'bg-emerald-600'}`} />
            <span>0–34 Low</span>
            <span className="font-mono tabular-nums opacity-80">({lowModelCases.length})</span>
          </button>

          <button
            onClick={() => setFilterType(filterType === 'model_moderate' ? 'all' : 'model_moderate')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border ${
              filterType === 'model_moderate'
                ? 'bg-slate-800 text-white border-slate-800 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'model_moderate' ? 'bg-white' : 'bg-slate-500'}`} />
            <span>35–54 Moderate</span>
            <span className="font-mono tabular-nums opacity-80">({moderateModelCases.length})</span>
          </button>

          <button
            onClick={() => setFilterType(filterType === 'model_high' ? 'all' : 'model_high')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border ${
              filterType === 'model_high'
                ? 'bg-amber-700 text-white border-amber-700 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'model_high' ? 'bg-white' : 'bg-amber-500'}`} />
            <span>55–74 High</span>
            <span className="font-mono tabular-nums opacity-80">({highModelCases.length})</span>
          </button>

          <button
            onClick={() => setFilterType(filterType === 'model_critical' ? 'all' : 'model_critical')}
            className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5 border ${
              filterType === 'model_critical'
                ? 'bg-red-700 text-white border-red-700 font-bold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterType === 'model_critical' ? 'bg-white' : 'bg-red-600'}`} />
            <span>75–100 Critical</span>
            <span className="font-mono tabular-nums opacity-80">({criticalModelCases.length})</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & View Mode Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-300 flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-white text-xs text-slate-800 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
            >
              <option value="ALL">{t('district')} (All {cases.length})</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-white text-xs text-slate-800 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500"
          >
            <option value="ALL">{t('filterChannelAll')}</option>
            <option value="IVR_VOICE">IVR Voice Call</option>
            <option value="FEATURE_PHONE_SMS">Feature-Phone SMS</option>
          </select>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white text-xs text-slate-800 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:border-slate-500 font-medium"
            >
              <option value="distress_desc">Highest Distress First</option>
              <option value="distress_asc">Lowest Distress First</option>
              <option value="urgency">Self-Reported Urgency</option>
              <option value="due_date">Scheduled Due Date</option>
            </select>
          </div>

          {/* View Mode Toggle (Register Table vs Dossier Cards) */}
          <div className="flex items-center border border-slate-300 rounded p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              title="Switch to Register Table View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Switch to Case Dossier View"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Results View: Either Table Register or Clean Dossier Cards */}
      {sortedCases.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
          No records match the current filter criteria.
        </div>
      ) : viewMode === 'table' ? (
        /* HIGH DENSITY TRIAGE REGISTER TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Beneficiary Pseudonym</th>
                  <th className="py-3 px-4">District / State</th>
                  <th className="py-3 px-4">Court &amp; Relief Stage</th>
                  <th className="py-3 px-4">Recency</th>
                  <th className="py-3 px-4">Distress Urgency</th>
                  <th className="py-3 px-4">Pending Needs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCases.map((c) => {
                  const daysSinceContact = getDaysSinceLastContact(c.lastContactDate);
                  const isLapsed = daysSinceContact > 14 && c.consentStatus !== 'opted_out';
                  const modelRes = c.therapyModelResult;
                  const scoreUrgency = modelRes ? getDistressUrgencyConfig(modelRes.distressScore) : null;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        {c.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.victimPseudonym}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.contactNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{c.district}</div>
                        <div className="text-[11px] text-slate-500">{c.state}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium capitalize">
                          {c.courtStage.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          Relief: {c.reliefCompensationStage.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="tabular-nums font-mono text-slate-800">
                          {c.lastContactDate || 'None'}
                        </div>
                        <div className={`text-[11px] ${isLapsed ? 'text-red-700 font-bold' : 'text-slate-500'}`}>
                          {daysSinceContact === 999 ? 'No contact' : `${daysSinceContact}d ago`}
                          {isLapsed && ' (Lapsed)'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {modelRes && scoreUrgency ? (
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${scoreUrgency.dotClass}`} />
                            <span className="font-mono font-bold tabular-nums text-slate-900">
                              {modelRes.distressScore}/100
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({scoreUrgency.label})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {c.unresolvedNeeds.length > 0 ? (
                          <span className="text-[11px] text-amber-800 font-medium">
                            {c.unresolvedNeeds.map(getNeedLabel).join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None recorded</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPhoneWithCase(c)}
                            title="Initiate IVR Call"
                            className="px-2.5 py-1 rounded bg-[#0B2545] hover:bg-[#12335C] text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <PhoneCall className="w-3 h-3 text-amber-300" />
                            <span>Call</span>
                          </button>
                          <button
                            onClick={() => setCaseToSchedule(c)}
                            title="Schedule Check-In"
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                          >
                            Schedule
                          </button>
                          <button
                            onClick={() => onOpenCaseDetail(c)}
                            title="View Full Dossier"
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* REFINED CASE DOSSIER CARDS VIEW (NO NESTED CARDS WITHIN CARDS) */
        <div className="space-y-3">
          {sortedCases.map((c) => {
            const daysSinceContact = getDaysSinceLastContact(c.lastContactDate);
            const isLapsed = daysSinceContact > 14 && c.consentStatus !== 'opted_out';
            const modelRes = c.therapyModelResult;
            const scoreUrgency = modelRes ? getDistressUrgencyConfig(modelRes.distressScore) : null;

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-lg p-4 transition-colors ${
                  scoreUrgency ? scoreUrgency.cardBorderClass : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Metadata Body */}
                  <div className="space-y-2 flex-1">
                    {/* Header Row: Case ID, Pseudonym, Location, and Urgency Indicator */}
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {c.id}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {c.victimPseudonym}
                      </h3>
                      <span className="text-xs text-slate-500">
                        ({c.district}, {c.state})
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {c.contactNumber}
                      </span>

                      {/* Clinical Distress Tag (Zero Pill Discipline: Crisp rectangular tag) */}
                      {modelRes && scoreUrgency ? (
                        <div
                          onClick={() => onOpenCaseDetail(c)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border cursor-pointer ${scoreUrgency.badgeClass}`}
                          title="Click to inspect model explainability in dossier"
                        >
                          <span className={`w-2 h-2 rounded-full ${scoreUrgency.dotClass}`} />
                          <span>Distress:</span>
                          <span className="font-mono font-bold tabular-nums">
                            {modelRes.distressScore}
                          </span>
                          <span className="text-[10px] opacity-75">/100</span>
                          <span className="text-slate-400">·</span>
                          <span className="uppercase text-[10px]">{scoreUrgency.label}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Assessment Pending</span>
                      )}

                      {isLapsed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3 h-3" />
                          <span>Lapsed: {daysSinceContact}d</span>
                        </span>
                      )}
                    </div>

                    {/* Unboxed Metadata Line with Subtle Dot Separators */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                      <span>
                        Last contact:{' '}
                        <span className="font-semibold text-slate-800">
                          {c.lastContactDate ? `${c.lastContactDate} (${daysSinceContact}d ago)` : 'None'}
                        </span>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span>
                        Next scheduled:{' '}
                        <span className="font-semibold text-slate-800">{c.nextScheduledContact}</span>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span>
                        Channel: <span className="font-medium text-slate-900">{c.preferredChannel || 'IVR_VOICE'}</span>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span>
                        Language: <span className="uppercase font-semibold text-slate-900">{c.preferredLanguage}</span>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span>
                        Court:{' '}
                        <span className="font-medium text-slate-800 capitalize">
                          {c.courtStage.replace(/_/g, ' ')}
                        </span>
                      </span>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <span>
                        Relief:{' '}
                        <span className="font-medium text-slate-800 capitalize">
                          {c.reliefCompensationStage.replace(/_/g, ' ')}
                        </span>
                      </span>
                    </div>

                    {/* Clinical Indicator & Detected Need Text Line */}
                    {modelRes && (
                      <div className="text-xs text-slate-600 pt-0.5">
                        <span className="font-medium text-slate-500">Clinical Signal: </span>
                        <span className="text-slate-800 font-medium">
                          {modelRes.detectedIndicators[0] || 'Standard check-in nominal'}
                        </span>
                        <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                        <span className="text-slate-500">Confidence: </span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {(modelRes.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => handleReScoreCase(c.id)}
                          disabled={scoringCaseId === c.id}
                          className="ml-2.5 text-blue-700 hover:text-blue-900 font-medium underline text-[11px]"
                        >
                          {scoringCaseId === c.id ? 'Scoring...' : 'Re-Evaluate'}
                        </button>
                      </div>
                    )}

                    {/* Expressed Support Needs */}
                    {c.unresolvedNeeds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                        <span className="text-slate-500 font-medium">Recorded Needs:</span>
                        {c.unresolvedNeeds.map((need, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{getNeedLabel(need)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Caseworker Action Controls */}
                  <div className="flex items-center lg:flex-col lg:items-end gap-2 shrink-0 self-start">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenPhoneWithCase(c)}
                        className="px-3 py-1.5 rounded bg-[#0B2545] hover:bg-[#12335C] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
                        <span>{t('btnCall')}</span>
                      </button>

                      <button
                        onClick={() => setCaseToSchedule(c)}
                        className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-300"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-slate-600" />
                        <span>{t('btnSchedule')}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCaseToEdit(c)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t('btnEdit')}</span>
                      </button>

                      <button
                        onClick={() => onOpenCaseDetail(c)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t('btnDossier')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child Modals */}
      {showModelModal && (
        <ModelIntegrationModal
          onClose={() => setShowModelModal(false)}
          onScoresUpdated={() => triggerToast('Clinical scores refreshed across all beneficiaries.')}
        />
      )}

      {caseToSchedule && (
        <ScheduleInteractionModal
          atrocityCase={caseToSchedule}
          onClose={() => setCaseToSchedule(null)}
          onScheduled={(interaction) => {
            triggerToast(`Scheduled ${interaction.channel} for ${interaction.scheduledDate} (${interaction.timeSlot}).`);
          }}
        />
      )}

      {caseToEdit && (
        <EditCaseRecordModal
          atrocityCase={caseToEdit}
          onClose={() => setCaseToEdit(null)}
          onSaved={() => triggerToast('Beneficiary record updated successfully.')}
        />
      )}

      {showBatchRunner && (
        <ScheduledBatchRunnerModal
          onClose={() => setShowBatchRunner(false)}
          onRunCompleted={() => triggerToast('Outreach batch run completed.')}
        />
      )}
    </div>
  );
};
