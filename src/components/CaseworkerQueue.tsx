import React, { useState } from 'react';
import {
  AlertCircle,
  PhoneCall,
  Clock,
  Shield,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Scale,
  Users,
  Eye,
  Filter,
  MessageSquare,
  Edit3,
  CalendarPlus,
  Play,
  RotateCw,
  Cpu,
  Sparkles,
  Zap,
  Activity,
  ArrowUpDown,
  SlidersHorizontal,
  Building2,
  FileCheck,
  ChevronRight,
} from 'lucide-react';
import { AtrocityCase, CheckInRecord, SupportNeedType, ScheduledInteraction } from '../types/ivr';
import { ScheduleInteractionModal } from './ScheduleInteractionModal';
import { EditCaseRecordModal } from './EditCaseRecordModal';
import { ScheduledBatchRunnerModal } from './ScheduledBatchRunnerModal';
import { ModelIntegrationModal } from './ModelIntegrationModal';
import { therapyModelService } from '../services/therapyModelService';

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
 * from Green to Red based on distress score thresholds:
 * - 75–100: CRITICAL (Red)
 * - 55–74:  HIGH (Orange)
 * - 35–54:  MODERATE (Amber / Yellow)
 * - 0–34:   LOW (Emerald / Green)
 */
export const getDistressUrgencyConfig = (score: number): DistressUrgencyConfig => {
  if (score >= 75) {
    return {
      tier: 'CRITICAL',
      label: 'Critical',
      badgeClass: 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-200',
      dotClass: 'bg-red-600 animate-pulse',
      textClass: 'text-red-700',
      cardBorderClass: 'border-red-300',
      cardBgClass: 'bg-red-50/20',
      barColor: 'bg-red-600',
      rangeLabel: '75–100',
    };
  }
  if (score >= 55) {
    return {
      tier: 'HIGH',
      label: 'High',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-200',
      dotClass: 'bg-orange-500',
      textClass: 'text-orange-700',
      cardBorderClass: 'border-orange-300',
      cardBgClass: 'bg-orange-50/20',
      barColor: 'bg-orange-500',
      rangeLabel: '55–74',
    };
  }
  if (score >= 35) {
    return {
      tier: 'MODERATE',
      label: 'Moderate',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-700',
      cardBorderClass: 'border-amber-300',
      cardBgClass: 'bg-amber-50/15',
      barColor: 'bg-amber-500',
      rangeLabel: '35–54',
    };
  }
  return {
    tier: 'LOW',
    label: 'Low',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
    cardBorderClass: 'border-slate-200',
    cardBgClass: 'bg-white',
    barColor: 'bg-emerald-600',
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
  checkIns,
  onOpenPhoneWithCase,
  onOpenCaseDetail,
}) => {
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
  const [sortBy, setSortBy] = useState<'distress_desc' | 'distress_asc' | 'urgency' | 'due_date' | 'default'>('distress_desc');

  // Modals state
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
      triggerToast('Beneficiary re-scored using therapy distress model.');
    } finally {
      setScoringCaseId(null);
    }
  };

  // Helper to calculate days since last contact
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
  
  // Model score tier counts
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
    switch (need) {
      case 'police_witness_security':
        return 'Police Protection / Witness Security';
      case 'legal_aid_escort':
        return 'Court Escort & Legal Aid';
      case 'trauma_counselling':
        return 'Trauma Counselling';
      case 'compensation_disbursement':
        return 'Sec 15A Relief Compensation';
      case 'medical_assistance':
        return 'Medical Care';
      default:
        return need;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Government Title & Operational Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                District Welfare Cell · SC/ST Protection Division
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">Caseworker Triage Ledger</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <span>Beneficiary Continuity &amp; Welfare Follow-Up Queue</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Consolidated triage portal tracking scheduled check-ins, Section 15A statutory entitlements, and
              NLP therapy model distress scores (Green to Red) across registered atrocity cases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {/* Custom Model Hub Button */}
            <button
              onClick={() => setShowModelModal(true)}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-700" />
              <span>Model Config &amp; API</span>
            </button>

            {/* Run Scheduled Outreach Batch Button */}
            <button
              onClick={() => setShowBatchRunner(true)}
              className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Scheduled Batch</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Metric Cards (Light Government Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Card 1: Critical Distress (Score >=75) */}
          <div
            onClick={() => setFilterType('model_critical')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterType === 'model_critical'
                ? 'bg-red-50 border-red-400 ring-2 ring-red-200 shadow-xs'
                : 'bg-white border-slate-200 hover:border-red-300 hover:bg-red-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span>Critical Distress (&ge;75)</span>
              </span>
              <span className="text-2xl font-bold text-red-700 font-mono">{criticalModelCases.length}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Survivors exhibiting severe trauma, active witness threats, or acute distress.
            </p>
          </div>

          {/* Card 2: Lapsed Contact Alert */}
          <div
            onClick={() => setFilterType('lapsed')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterType === 'lapsed'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Lapsed Contact (&gt;14 Days)</span>
              </span>
              <span className="text-2xl font-bold text-amber-800 font-mono">{lapsedCases.length}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              No recorded caseworker follow-up in over two weeks during trial or investigation.
            </p>
          </div>

          {/* Card 3: Expressed Needs */}
          <div
            onClick={() => setFilterType('urgent_requests')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterType === 'urgent_requests'
                ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200 shadow-xs'
                : 'bg-white border-slate-200 hover:border-orange-300 hover:bg-orange-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Expressed Needs Flag</span>
              </span>
              <span className="text-2xl font-bold text-orange-800 font-mono">{urgentCases.length}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Survivors requesting urgent police protection, court escort, or Section 15A relief money.
            </p>
          </div>

          {/* Card 4: Scheduled For Today */}
          <div
            onClick={() => setFilterType('due_today')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              filterType === 'due_today'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Scheduled for Outreach Today</span>
              </span>
              <span className="text-2xl font-bold text-blue-800 font-mono">{dueTodayCases.length}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-2">
              Automated IVR calls and feature phone SMS outreach scheduled for today.
            </p>
          </div>
        </div>
      </div>

      {/* COLOR-CODED DISTRESS URGENCY THRESHOLDS SCALE BAR (LIGHT GOVERNMENT THEME) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Activity className="w-4 h-4 text-blue-700" />
          <span className="font-bold text-slate-800">Distress Urgency Scale:</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">(Green &rarr; Amber &rarr; Orange &rarr; Red)</span>
        </div>

        {/* Threshold clickable scale items */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Low Tier: 0 - 34 */}
          <button
            onClick={() => setFilterType(filterType === 'model_low' ? 'all' : 'model_low')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filterType === 'model_low'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold ring-2 ring-emerald-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Filter to cases with Low Distress score (<35)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="font-bold font-mono">0–34</span>
            <span>Low Urgency</span>
            <span className="px-1.5 py-0.2 rounded bg-white text-emerald-800 text-[10px] font-mono border border-emerald-200">
              {lowModelCases.length}
            </span>
          </button>

          {/* Moderate Tier: 35 - 54 */}
          <button
            onClick={() => setFilterType(filterType === 'model_moderate' ? 'all' : 'model_moderate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filterType === 'model_moderate'
                ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold ring-2 ring-amber-200'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Filter to cases with Moderate Distress score (35–54)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="font-bold font-mono">35–54</span>
            <span>Moderate</span>
            <span className="px-1.5 py-0.2 rounded bg-white text-amber-800 text-[10px] font-mono border border-amber-200">
              {moderateModelCases.length}
            </span>
          </button>

          {/* High Tier: 55 - 74 */}
          <button
            onClick={() => setFilterType(filterType === 'model_high' ? 'all' : 'model_high')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filterType === 'model_high'
                ? 'bg-orange-100 text-orange-900 border-orange-400 font-bold ring-2 ring-orange-200'
                : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
            }`}
            title="Filter to cases with High Distress score (55–74)"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="font-bold font-mono">55–74</span>
            <span>High</span>
            <span className="px-1.5 py-0.2 rounded bg-white text-orange-800 text-[10px] font-mono border border-orange-200">
              {highModelCases.length}
            </span>
          </button>

          {/* Critical Tier: 75 - 100 */}
          <button
            onClick={() => setFilterType(filterType === 'model_critical' ? 'all' : 'model_critical')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filterType === 'model_critical'
                ? 'bg-red-100 text-red-900 border-red-400 font-bold ring-2 ring-red-200'
                : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
            }`}
            title="Filter to cases with Critical Distress score (75–100)"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-bold font-mono">75–100</span>
            <span>Critical Urgency</span>
            <span className="px-1.5 py-0.2 rounded bg-white text-red-800 text-[10px] font-mono border border-red-200">
              {criticalModelCases.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Clean Light Background) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-300 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by pseudonym, FIR number, district, caseworker notes..."
            className="bg-transparent text-xs text-slate-900 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        {/* District Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-white text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Districts ({cases.length})</option>
            {uniqueDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-white text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">All Communication Channels</option>
            <option value="IVR_VOICE">IVR Voice Call</option>
            <option value="FEATURE_PHONE_SMS">Feature-Phone SMS</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white text-xs text-slate-800 font-semibold border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="distress_desc">Highest Distress (Red &rarr; Green)</option>
            <option value="distress_asc">Lowest Distress (Green &rarr; Red)</option>
            <option value="urgency">Citizen Self-Reported Urgency</option>
            <option value="due_date">Scheduled Due Date</option>
          </select>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({cases.length})
          </button>
          <button
            onClick={() => setFilterType('model_critical')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
              filterType === 'model_critical'
                ? 'bg-red-700 text-white font-bold'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>Critical &ge;75 ({criticalModelCases.length})</span>
          </button>
          <button
            onClick={() => setFilterType('lapsed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'lapsed'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Lapsed ({lapsedCases.length})
          </button>
          <button
            onClick={() => setFilterType('urgent_requests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'urgent_requests'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-orange-800 hover:bg-orange-50'
            }`}
          >
            Needs ({urgentCases.length})
          </button>
          <button
            onClick={() => setFilterType('due_today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterType === 'due_today'
                ? 'bg-blue-700 text-white font-bold'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            Due Today ({dueTodayCases.length})
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {sortedCases.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
            No beneficiaries match the current filter selection.
          </div>
        ) : (
          sortedCases.map((c) => {
            const daysSinceContact = getDaysSinceLastContact(c.lastContactDate);
            const isLapsed = daysSinceContact > 14 && c.consentStatus !== 'opted_out';
            const isDueToday = c.nextScheduledContact <= todayStr;
            const modelRes = c.therapyModelResult;
            const distressScore = modelRes?.distressScore;
            const scoreUrgency = distressScore !== undefined ? getDistressUrgencyConfig(distressScore) : null;

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-xl p-5 transition-all shadow-xs hover:shadow-sm ${
                  isLapsed
                    ? 'border-red-300 bg-red-50/15'
                    : scoreUrgency
                    ? `${scoreUrgency.cardBorderClass} ${scoreUrgency.cardBgClass}`
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Identifiers, Distress Score Badge, Recency & Needs */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {c.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {c.victimPseudonym}
                      </h3>
                      <span className="text-xs text-slate-600">
                        ({c.district}, {c.state})
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-600 font-mono">{c.contactNumber}</span>

                      {/* PROMINENT NUMERICAL THERAPY MODEL DISTRESS SCORE & COLOR-CODED INDICATOR (GREEN TO RED) */}
                      {modelRes && scoreUrgency ? (
                        <div
                          onClick={() => onOpenCaseDetail(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-all hover:scale-102 ${scoreUrgency.badgeClass}`}
                          title={`Therapy Model Distress Score: ${modelRes.distressScore}/100. Urgency Tier: ${scoreUrgency.label} (${scoreUrgency.rangeLabel}). Click to view clinical explainability.`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${scoreUrgency.dotClass} flex-shrink-0`} />
                          <span className="text-[11px] font-bold">
                            Distress Score:
                          </span>
                          <span className="font-mono font-black text-sm tracking-tight">
                            {modelRes.distressScore}
                          </span>
                          <span className="text-[10px] opacity-75 font-mono">/100</span>
                          <span className="mx-0.5 opacity-30">|</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {scoreUrgency.label} Urgency
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Score: Pending</span>
                        </div>
                      )}

                      {/* Citizen Urgency Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          c.currentUrgency === 'critical'
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : c.currentUrgency === 'high'
                            ? 'bg-orange-50 text-orange-800 border-orange-300'
                            : c.currentUrgency === 'medium'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        Self-Report: {c.currentUrgency}
                      </span>

                      {/* Lapsed Contact Alert Badge */}
                      {isLapsed && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          <span>Lapsed: {daysSinceContact} Days</span>
                        </span>
                      )}

                      {/* Due Today Badge */}
                      {!isLapsed && isDueToday && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-700" />
                          <span>Due Today</span>
                        </span>
                      )}

                      {/* Paused Status */}
                      {c.consentStatus === 'paused' && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-medium">
                          Check-ins Paused by Citizen
                        </span>
                      )}
                    </div>

                    {/* Metadata line: Last contact date, next date, court stage, relief compensation */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>
                        Last Contact:{' '}
                        <strong className="text-slate-800">
                          {c.lastContactDate ? `${c.lastContactDate} (${daysSinceContact}d ago)` : 'Never contacted'}
                        </strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>Next Due: <strong className="text-slate-800">{c.nextScheduledContact}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>Channel: <strong className="text-blue-800">{c.preferredChannel || 'IVR_VOICE'}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>Language: <strong className="uppercase text-slate-800">{c.preferredLanguage}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>Court: <strong className="text-emerald-800">{c.courtStage.replace(/_/g, ' ')}</strong></span>
                      <span className="text-slate-300">·</span>
                      <span>Relief: <strong className="text-amber-800">{c.reliefCompensationStage.replace(/_/g, ' ')}</strong></span>
                    </div>

                    {/* THERAPY MODEL DISTRESS EVALUATION BOX (CLEAN LIGHT THEME) */}
                    {modelRes && scoreUrgency ? (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Numerical Score Box */}
                            <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg bg-white border border-slate-300 min-w-[76px] shadow-2xs">
                              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5 text-blue-700" />
                                <span>Distress</span>
                              </span>
                              <div className="flex items-baseline gap-0.5">
                                <span className={`text-2xl font-black font-mono tracking-tight ${scoreUrgency.textClass}`}>
                                  {modelRes.distressScore}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">/100</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${scoreUrgency.badgeClass}`}>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${scoreUrgency.dotClass}`} />
                                  {scoreUrgency.label} Urgency ({scoreUrgency.rangeLabel})
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  Confidence: {(modelRes.confidence * 100).toFixed(0)}% · Adapter: {modelRes.modelSource}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-700">
                                <span className="text-slate-500 font-medium">Detected Clinical Signal: </span>
                                <span className="text-slate-900 font-semibold">{modelRes.detectedIndicators[0] || 'Active assessment'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              onClick={() => handleReScoreCase(c.id)}
                              disabled={scoringCaseId === c.id}
                              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 transition-colors shadow-2xs"
                              title="Re-run therapy distress model inference"
                            >
                              <RotateCw className={`w-3 h-3 ${scoringCaseId === c.id ? 'animate-spin' : ''}`} />
                              <span>{scoringCaseId === c.id ? 'Scoring...' : 'Re-Score'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual Linear Continuum Meter (Green to Red Scale) */}
                        <div className="pt-1 bg-white p-2.5 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                            <span className="text-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>0–34 Low Urgency</span>
                            </span>
                            <span className="text-amber-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span>35–54 Moderate</span>
                            </span>
                            <span className="text-orange-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span>55–74 High</span>
                            </span>
                            <span className="text-red-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              <span>75–100 Critical</span>
                            </span>
                          </div>

                          {/* Multi-segment continuous color track */}
                          <div className="relative h-2 rounded-full overflow-hidden bg-slate-200 flex shadow-inner">
                            <div className="w-[35%] bg-emerald-500 h-full border-r border-white" title="Low Urgency (0–34)" />
                            <div className="w-[20%] bg-amber-400 h-full border-r border-white" title="Moderate Urgency (35–54)" />
                            <div className="w-[20%] bg-orange-500 h-full border-r border-white" title="High Urgency (55–74)" />
                            <div className="w-[25%] bg-red-600 h-full" title="Critical Urgency (75–100)" />
                          </div>

                          {/* Pointer Pin / Needle with Numerical Value */}
                          <div className="relative h-4 w-full">
                            <div
                              className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                              style={{ left: `${Math.min(97, Math.max(3, modelRes.distressScore))}%` }}
                            >
                              <div className={`w-2.5 h-2.5 rotate-45 ${scoreUrgency.barColor} ring-2 ring-white shadow-xs`} />
                              <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded border shadow-2xs mt-0.5 ${scoreUrgency.badgeClass}`}>
                                {modelRes.distressScore}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                        <span>Therapy model score pending for this beneficiary.</span>
                        <button
                          onClick={() => handleReScoreCase(c.id)}
                          disabled={scoringCaseId === c.id}
                          className="text-blue-700 hover:text-blue-800 underline font-semibold text-xs"
                        >
                          Run Model Score
                        </button>
                      </div>
                    )}

                    {/* Expressed Needs Badges */}
                    {c.unresolvedNeeds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-600 font-semibold">Expressed Needs:</span>
                        {c.unresolvedNeeds.map((need, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-semibold flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>{getNeedLabel(need)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Upcoming Scheduled Interactions */}
                    {c.scheduledInteractions && c.scheduledInteractions.filter(i => i.status === 'pending').length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-blue-900">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                        <span className="font-semibold">Upcoming Scheduled:</span>
                        {c.scheduledInteractions.filter(i => i.status === 'pending').map((inter) => (
                          <span
                            key={inter.id}
                            className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px] text-blue-900 font-medium"
                          >
                            {inter.scheduledDate} ({inter.timeSlot}): {inter.purpose}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Caseworker Action Controls */}
                  <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-stretch lg:items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => onOpenPhoneWithCase(c)}
                      className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{c.preferredChannel === 'FEATURE_PHONE_SMS' ? 'Simulate SMS/IVR' : 'Launch IVR Call'}</span>
                    </button>

                    <button
                      onClick={() => setCaseToSchedule(c)}
                      className="px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Schedule Interaction</span>
                    </button>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => setCaseToEdit(c)}
                        className="flex-1 lg:flex-initial px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Update Record</span>
                      </button>

                      <button
                        onClick={() => onOpenCaseDetail(c)}
                        className="flex-1 lg:flex-initial px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors border border-slate-300"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Ledger</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Model Integration Modal */}
      {showModelModal && (
        <ModelIntegrationModal
          onClose={() => setShowModelModal(false)}
          onScoresUpdated={() => {
            triggerToast('Scores refreshed across all beneficiaries.');
          }}
        />
      )}

      {/* Schedule Interaction Modal */}
      {caseToSchedule && (
        <ScheduleInteractionModal
          atrocityCase={caseToSchedule}
          onClose={() => setCaseToSchedule(null)}
          onScheduled={(interaction) => {
            triggerToast(`Scheduled ${interaction.channel} for ${interaction.scheduledDate} (${interaction.timeSlot}).`);
          }}
        />
      )}

      {/* Edit Case Record Modal */}
      {caseToEdit && (
        <EditCaseRecordModal
          atrocityCase={caseToEdit}
          onClose={() => setCaseToEdit(null)}
          onSaved={() => {
            triggerToast('Victim record updated successfully.');
          }}
        />
      )}

      {/* Scheduled Batch Runner Modal */}
      {showBatchRunner && (
        <ScheduledBatchRunnerModal
          onClose={() => setShowBatchRunner(false)}
          onRunCompleted={() => {
            triggerToast('Scheduled outreach batch executed.');
          }}
        />
      )}
    </div>
  );
};
