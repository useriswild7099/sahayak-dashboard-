import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Clock,
  Phone,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Send,
  ToggleLeft,
  ToggleRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { AtrocityCase, CheckInRecord, LanguageCode, SUPPORTED_LANGUAGES } from '../types/ivr';
import { storageService } from '../services/storageService';

interface CitizenPrivacyPortalProps {
  cases: AtrocityCase[];
  checkIns: CheckInRecord[];
  onOpenPhoneWithCase: (c: AtrocityCase) => void;
}

export const CitizenPrivacyPortal: React.FC<CitizenPrivacyPortalProps> = ({
  cases,
  checkIns,
  onOpenPhoneWithCase,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const caseCheckIns = checkIns.filter((chk) => chk.caseId === activeCase?.id);

  const handleToggleConsent = () => {
    if (!activeCase) return;
    const newStatus = activeCase.consentStatus === 'active' ? 'paused' : 'active';
    storageService.updateCaseConsent(activeCase.id, newStatus);
    showToast(newStatus === 'active' ? 'Automated check-ins reactivated.' : 'Automated check-ins paused. No automated calls will be made.');
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    if (!activeCase) return;
    storageService.updateCaseConsent(activeCase.id, activeCase.consentStatus, lang, activeCase.preferredTimeSlot);
    showToast(`Preferred language updated to ${SUPPORTED_LANGUAGES.find(l => l.code === lang)?.label}.`);
  };

  const handleTimeSlotChange = (slot: 'morning' | 'afternoon' | 'evening') => {
    if (!activeCase) return;
    storageService.updateCaseConsent(activeCase.id, activeCase.consentStatus, activeCase.preferredLanguage, slot);
    showToast(`Preferred call time slot updated to ${slot}.`);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-emerald-600">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner Explaining Citizen Self-Determination & Rights */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Citizen Agency &amp; Data Self-Determination</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Beneficiary Control, Privacy &amp; Contact Preferences
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Under the MoSJE Sahayak Charter, psychological surveillance is strictly prohibited.
              Beneficiaries possess the unconditional statutory right to pause check-ins, choose their preferred language,
              set safe call hours, and audit every ledger entry maintained by district welfare officers.
            </p>
          </div>

          {/* Citizen Account Selector */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Beneficiary Account:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-white text-xs text-slate-900 px-3 py-1.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.victimPseudonym} ({c.district})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeCase && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Citizen Preferences & Consent Controls (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Box 1: Consent & Call Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-700" />
                    <span>Consent &amp; Outreach Participation</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pause or resume automated follow-ups at any time without affecting legal aid or relief funds.
                  </p>
                </div>

                <button
                  onClick={handleToggleConsent}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    activeCase.consentStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {activeCase.consentStatus === 'active' ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-700" />
                      <span>Active (Receiving Calls)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" />
                      <span>Paused (Opted Out)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Language Choice */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Globe className="w-3.5 h-3.5 text-blue-700" />
                  <span>Preferred Language for Automated IVR Calls</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-2.5 rounded-lg text-xs border text-left transition-all ${
                        activeCase.preferredLanguage === lang.code
                          ? 'bg-blue-50 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold">{lang.nativeLabel}</div>
                      <div className="text-[10px] text-slate-500">{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Channel (Voice Call vs SMS) */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  <span>Preferred Feature-Phone Channel</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { ch: 'IVR_VOICE', label: 'Voice Call (IVR)', desc: 'Spoken voice prompts' },
                    { ch: 'FEATURE_PHONE_SMS', label: 'SMS Text Message', desc: 'Simple 2-way text' },
                    { ch: 'EITHER', label: 'Either Channel', desc: 'Call with SMS fallback' },
                  ].map((item) => (
                    <div
                      key={item.ch}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer ${
                        (activeCase.preferredChannel || 'IVR_VOICE') === item.ch
                          ? 'bg-blue-50 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safe Time Slot Choice */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Safe &amp; Private Call Hours</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { slot: 'morning' as const, label: 'Morning (09:00 - 12:00)' },
                    { slot: 'afternoon' as const, label: 'Afternoon (14:00 - 17:00)' },
                    { slot: 'evening' as const, label: 'Evening (18:00 - 20:30)' },
                  ].map((s) => (
                    <button
                      key={s.slot}
                      onClick={() => handleTimeSlotChange(s.slot)}
                      className={`p-2.5 rounded-lg text-xs border text-center transition-all ${
                        activeCase.preferredTimeSlot === s.slot
                          ? 'bg-blue-50 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2: Transparent Case Audit Ledger for Beneficiary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-700" />
                <span>Transparent Case Ledger (What the Welfare Officer Sees)</span>
              </h3>
              <p className="text-xs text-slate-600">
                You have the full right to audit and view what records and notes are maintained under your case ID.
              </p>

              <div className="space-y-3 pt-2">
                {caseCheckIns.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No check-in entries logged yet.
                  </div>
                ) : (
                  caseCheckIns.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="font-mono text-slate-800 font-semibold">{chk.timestamp.slice(0, 16).replace('T', ' ')}</span>
                        <span className="text-blue-800 font-bold uppercase">{chk.channel || 'IVR_VOICE'}</span>
                      </div>
                      <div className="text-slate-800">
                        <span className="text-slate-500">Self-Reported Status: </span>
                        <strong>{(chk.status || 'not_recorded').replace('_', ' ')}</strong>
                      </div>
                      {(chk.voiceNoteTranscript || chk.voiceNoteUrl) && (
                        <div className="text-slate-700 bg-white p-2 rounded border border-slate-200 italic">
                          &quot;{chk.voiceNoteTranscript || chk.voiceNoteUrl}&quot;
                        </div>
                      )}
                      {chk.caseworkerNotes && (
                        <div className="text-blue-900 bg-blue-50/50 p-2 rounded border border-blue-200">
                          <strong>Officer Follow-up: </strong> {chk.caseworkerNotes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Statutory Rights & Immediate Help Cards (1 col) */}
          <div className="space-y-5">
            {/* Direct Statutory Rights Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>Your Section 15A Statutory Rights</span>
              </h4>
              <ul className="space-y-2 text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Right to police escort to and from the Special Court on hearing dates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Right to free certified copies of all police charge-sheets and court orders.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Right to mandatory interim relief disbursement into your registered bank account.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Right to witness protection if facing pressure or intimidation from accused persons.</span>
                </li>
              </ul>
            </div>

            {/* Test Call Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs space-y-3 text-xs">
              <h4 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-blue-700" />
                <span>Test Audio Call Simulator</span>
              </h4>
              <p className="text-blue-900 leading-relaxed">
                Test how the automated call sounds in your chosen language ({SUPPORTED_LANGUAGES.find(l => l.code === activeCase.preferredLanguage)?.label}) on a simulated 2G mobile phone.
              </p>
              <button
                onClick={() => onOpenPhoneWithCase(activeCase)}
                className="w-full py-2 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Launch Simulator With This Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
