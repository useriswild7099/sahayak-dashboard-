import React, { useState } from 'react';
import {
  X,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  FileText,
  User,
  MapPin,
  Scale,
  DollarSign,
  Heart,
  MessageSquare,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { AtrocityCase, CheckInRecord, SupportNeedType } from '../types/ivr';
import { storageService } from '../services/storageService';
import { getDistressUrgencyConfig } from './CaseworkerQueue';

interface CaseDetailModalProps {
  atrocityCase: AtrocityCase;
  checkIns: CheckInRecord[];
  onClose: () => void;
  onInitiateCall: (caseId: string) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  atrocityCase,
  checkIns,
  onClose,
  onInitiateCall,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'actions' | 'scheduled' | 'model_analysis'>('timeline');
  const [caseworkerNoteInput, setCaseworkerNoteInput] = useState('');
  const [selectedCheckInForNote, setSelectedCheckInForNote] = useState<string | null>(null);

  const handleResolveNeed = (need: SupportNeedType) => {
    storageService.resolveNeed(atrocityCase.id, need);
  };

  const handleCompleteInteraction = (interactionId: string) => {
    storageService.completeInteraction(atrocityCase.id, interactionId, 'Completed by caseworker during follow-up');
  };

  const handleAddNote = (checkInId: string) => {
    if (caseworkerNoteInput.trim()) {
      storageService.acknowledgeCheckIn(checkInId, caseworkerNoteInput.trim());
      setCaseworkerNoteInput('');
      setSelectedCheckInForNote(null);
    }
  };

  const getNeedLabel = (need: SupportNeedType) => {
    switch (need) {
      case 'police_witness_security':
        return 'Police Protection & Witness Security';
      case 'legal_aid_escort':
        return 'Legal Aid & Court Escort';
      case 'trauma_counselling':
        return 'Trauma Counselling & Therapy';
      case 'compensation_disbursement':
        return 'Section 15A Relief Compensation';
      case 'medical_assistance':
        return 'Medical Treatment & Emergency Aid';
      default:
        return need;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'coping_well':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-xs">Coping Adequately</span>;
      case 'moderate_distress':
        return <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold text-xs">Moderate Distress / Needs Support</span>;
      case 'critical_crisis':
        return <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold text-xs">Critical Crisis / Immediate Help</span>;
      default:
        return <span className="text-slate-500 text-xs">No status recorded</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                {atrocityCase.id}
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {atrocityCase.victimPseudonym}
              </h2>
              <span className="text-xs text-slate-600">
                ({atrocityCase.district}, {atrocityCase.state})
              </span>
              {atrocityCase.therapyModelResult && (
                (() => {
                  const cfg = getDistressUrgencyConfig(atrocityCase.therapyModelResult.distressScore);
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cfg.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                      <span>Distress: {atrocityCase.therapyModelResult.distressScore}/100</span>
                      <span className="opacity-75">· {cfg.label} Urgency</span>
                    </span>
                  );
                })()
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              FIR: {atrocityCase.firNumber} · {atrocityCase.policeStation} · Registered on {atrocityCase.registrationDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onInitiateCall(atrocityCase.id);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call via IVR</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Check-In History ({checkIns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Case Profile &amp; Legal Status</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'actions'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Unresolved Needs ({atrocityCase.unresolvedNeeds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scheduled'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled Outreach ({atrocityCase.scheduledInteractions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('model_analysis')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'model_analysis'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-700" />
            <span>Therapy Model Explainability</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-2">
                <span>Check-in interaction timeline (newest first)</span>
                <span className="font-semibold text-slate-800">Total Contacts: {checkIns.length}</span>
              </div>

              {checkIns.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No check-ins recorded yet for this beneficiary.
                </div>
              ) : (
                <div className="space-y-4">
                  {checkIns.map((chk) => (
                    <div
                      key={chk.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300">
                            {new Date(chk.timestamp).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-bold text-blue-800 uppercase">
                            {chk.channel || 'IVR_VOICE'} ({chk.language.toUpperCase()})
                          </span>
                        </div>
                        <div>{getStatusBadge(chk.status)}</div>
                      </div>

                      {/* Needs captured */}
                      {chk.needs && chk.needs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-slate-600 font-medium">Needs Expressed:</span>
                          {chk.needs.map((need: SupportNeedType, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-semibold"
                            >
                              {getNeedLabel(need)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Voice Note / SMS Transcript */}
                      {(chk.voiceNoteTranscript || chk.voiceNoteUrl) && (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700">
                          <span className="text-slate-500 font-medium block mb-1">
                            Recorded Beneficiary Audio Note / SMS Transcript:
                          </span>
                          <p className="italic text-slate-900">
                            &quot;{chk.voiceNoteTranscript || chk.voiceNoteUrl}&quot;
                          </p>
                        </div>
                      )}

                      {/* Caseworker Notes on this checkin */}
                      <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-600">
                          {chk.caseworkerNotes ? (
                            <div>
                              <strong className="text-slate-800">Caseworker Note:</strong> {chk.caseworkerNotes}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">No caseworker notes logged yet.</span>
                          )}
                        </div>

                        {selectedCheckInForNote === chk.id ? (
                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <input
                              type="text"
                              value={caseworkerNoteInput}
                              onChange={(e) => setCaseworkerNoteInput(e.target.value)}
                              placeholder="Enter follow-up note..."
                              className="bg-white text-xs text-slate-900 border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 w-60"
                            />
                            <button
                              onClick={() => handleAddNote(chk.id)}
                              className="px-2.5 py-1 rounded bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setSelectedCheckInForNote(null)}
                              className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedCheckInForNote(chk.id);
                              setCaseworkerNoteInput(chk.caseworkerNotes || '');
                            }}
                            className="text-xs text-blue-700 hover:text-blue-800 font-semibold"
                          >
                            + Add/Edit Note
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Atrocity Case Registration &amp; Sections
                </h4>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500">Incident Type:</span>{' '}
                    <strong className="text-slate-800">{atrocityCase.incidentType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Applicable Act Sections:</span>{' '}
                    <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {atrocityCase.applicableActSections.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Police Station &amp; FIR:</span>{' '}
                    <strong className="text-slate-800">{atrocityCase.policeStation} · {atrocityCase.firNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">District &amp; State:</span>{' '}
                    <strong className="text-slate-800">{atrocityCase.district}, {atrocityCase.state}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Legal Stage &amp; Relief Funds (Sec 15A)
                </h4>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-500">Special Court Stage:</span>{' '}
                    <strong className="text-emerald-800 uppercase font-semibold">
                      {atrocityCase.courtStage.replace(/_/g, ' ')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Sec 15A Relief Compensation:</span>{' '}
                    <strong className="text-amber-800 uppercase font-semibold">
                      {atrocityCase.reliefCompensationStage.replace(/_/g, ' ')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Assigned Caseworker:</span>{' '}
                    <strong className="text-slate-900">
                      {atrocityCase.assignedCaseworker.name} ({atrocityCase.assignedCaseworker.designation})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Officer Contact:</span>{' '}
                    <span className="font-mono text-slate-800">{atrocityCase.assignedCaseworker.contactNumber}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 md:col-span-2">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Confidential Caseworker Case Log
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {atrocityCase.caseworkerNotes || 'No notes added to case file.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Active Section 15A Statutory Support Needs Requiring Resolution
              </h3>

              {atrocityCase.unresolvedNeeds.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <span>All expressed needs have been resolved by the welfare cell.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {atrocityCase.unresolvedNeeds.map((need, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{getNeedLabel(need)}</h4>
                          <p className="text-slate-600 text-[11px] mt-0.5">
                            Reported directly by survivor during automated multilingual check-in.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleResolveNeed(need)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors self-start sm:self-auto shadow-2xs"
                      >
                        Mark Need Resolved
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">
                Scheduled Future Interactions for {atrocityCase.victimPseudonym}
              </h3>

              {(!atrocityCase.scheduledInteractions || atrocityCase.scheduledInteractions.length === 0) ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No upcoming outreach scheduled. Use &quot;Schedule Interaction&quot; on the queue to set one up.
                </div>
              ) : (
                <div className="space-y-3">
                  {atrocityCase.scheduledInteractions.map((inter) => (
                    <div
                      key={inter.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            {inter.scheduledDate} ({inter.timeSlot})
                          </span>
                          <span className="font-bold text-blue-800 uppercase">{inter.channel}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inter.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {inter.status}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium text-xs mt-1.5">{inter.purpose}</p>
                        <p className="text-slate-500 text-[11px]">Assigned Officer: {inter.assignedOfficer}</p>
                      </div>

                      {inter.status === 'pending' && (
                        <button
                          onClick={() => handleCompleteInteraction(inter.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'model_analysis' && (
            <div className="space-y-4 text-xs">
              {atrocityCase.therapyModelResult ? (
                <div className="space-y-4">
                  {/* Banner */}
                  {(() => {
                    const cfg = getDistressUrgencyConfig(atrocityCase.therapyModelResult.distressScore);
                    return (
                      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cfg.cardBorderClass} ${cfg.cardBgClass}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.badgeClass}`}>
                            <Cpu className="w-5 h-5 text-blue-700" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                              <span>NLP Distress &amp; Clinical Urgency Evaluation</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                {atrocityCase.therapyModelResult.modelSource}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[11px] mt-0.5">
                              Calculated from survivor check-in voice transcripts, SMS chats, and caseworker timeline logs.
                            </div>
                          </div>
                        </div>

                        <div className="text-right self-start sm:self-auto">
                          <div className={`text-2xl font-black font-mono ${cfg.textClass}`}>
                            {atrocityCase.therapyModelResult.distressScore} <span className="text-xs text-slate-500">/ 100</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.badgeClass}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dotClass}`} />
                            {cfg.label} Urgency ({cfg.rangeLabel})
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Continuum Visual Meter */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-emerald-700">0–34 Low Urgency</span>
                      <span className="text-amber-700">35–54 Moderate</span>
                      <span className="text-orange-700">55–74 High</span>
                      <span className="text-red-700">75–100 Critical Urgency</span>
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden bg-slate-200 flex shadow-inner">
                      <div className="w-[35%] bg-emerald-500 h-full border-r border-white" />
                      <div className="w-[20%] bg-amber-400 h-full border-r border-white" />
                      <div className="w-[20%] bg-orange-500 h-full border-r border-white" />
                      <div className="w-[25%] bg-red-600 h-full" />
                    </div>
                    <div className="relative h-4 w-full">
                      <div
                        className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${Math.min(97, Math.max(3, atrocityCase.therapyModelResult.distressScore))}%` }}
                      >
                        <div className="w-2.5 h-2.5 rotate-45 bg-blue-900 ring-2 ring-white shadow-xs" />
                        <span className="text-[10px] font-mono font-bold text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-300 shadow-2xs mt-0.5">
                          {atrocityCase.therapyModelResult.distressScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Indicators & Clinical Explainability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Extracted Stress &amp; Risk Indicators</span>
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        {atrocityCase.therapyModelResult.detectedIndicators.map((ind, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-white border border-slate-200 text-slate-800 text-[11px] font-medium"
                          >
                            • {ind}
                          </div>
                        ))}
                      </div>

                      {atrocityCase.therapyModelResult.extractedPhrases.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-slate-500 text-[10px] block mb-1">Trigger Lexicon Tokens:</span>
                          <div className="flex flex-wrap gap-1">
                            {atrocityCase.therapyModelResult.extractedPhrases.map((phrase, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-white text-slate-700 font-mono text-[10px] border border-slate-200"
                              >
                                &quot;{phrase}&quot;
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended Clinical &amp; Casework Actions</span>
                      </h4>
                      <div className="space-y-2 pt-1">
                        {atrocityCase.therapyModelResult.recommendedInterventions.map((rec, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded bg-white border border-slate-200 text-slate-800 text-[11px] flex items-start gap-2"
                          >
                            <span className="text-emerald-700 font-bold">✓</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No therapy distress model assessment run yet for this beneficiary.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
