import React, { useState } from 'react';
import { X, Edit3, Save, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';
import { AtrocityCase, LanguageCode, SUPPORTED_LANGUAGES } from '../types/ivr';
import { storageService } from '../services/storageService';

interface EditCaseRecordModalProps {
  atrocityCase: AtrocityCase;
  onClose: () => void;
  onSaved: () => void;
}

export const EditCaseRecordModal: React.FC<EditCaseRecordModalProps> = ({
  atrocityCase,
  onClose,
  onSaved,
}) => {
  const [courtStage, setCourtStage] = useState(atrocityCase.courtStage);
  const [reliefCompensationStage, setReliefCompensationStage] = useState(atrocityCase.reliefCompensationStage);
  const [currentUrgency, setCurrentUrgency] = useState(atrocityCase.currentUrgency);
  const [preferredChannel, setPreferredChannel] = useState(atrocityCase.preferredChannel || 'IVR_VOICE');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(atrocityCase.preferredLanguage || 'hi');
  const [caseworkerNotes, setCaseworkerNotes] = useState(atrocityCase.caseworkerNotes || '');
  const [officerName, setOfficerName] = useState(atrocityCase.assignedCaseworker?.name || '');
  const [officerPhone, setOfficerPhone] = useState(atrocityCase.assignedCaseworker?.contactNumber || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateCaseRecord(atrocityCase.id, {
      courtStage,
      reliefCompensationStage,
      currentUrgency,
      preferredChannel,
      preferredLanguage,
      caseworkerNotes: caseworkerNotes.trim(),
      assignedCaseworker: {
        name: officerName,
        designation: atrocityCase.assignedCaseworker?.designation || 'District Welfare Officer',
        contactNumber: officerPhone,
      },
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Update Beneficiary Case Record</h3>
              <p className="text-[11px] text-slate-500">Edit legal stage, relief tracking, and officer notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Case Banner */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>{atrocityCase.victimPseudonym} ({atrocityCase.district})</span>
          <span className="font-mono text-blue-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
            {atrocityCase.firNumber}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Court Stage & Relief Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Special Court Stage</label>
              <select
                value={courtStage}
                onChange={(e) => setCourtStage(e.target.value as any)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="FIR_FILED">FIR Registered</option>
                <option value="INVESTIGATION_ONGOING">Investigation Ongoing</option>
                <option value="CHARGESHEET_SUBMITTED">Chargesheet Submitted</option>
                <option value="TRIAL_HEARING">Trial Hearing / Evidence</option>
                <option value="SPECIAL_COURT_APPEAL">Special Court Appeal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Section 15A Relief Stage</label>
              <select
                value={reliefCompensationStage}
                onChange={(e) => setReliefCompensationStage(e.target.value as any)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="NOT_STARTED">Not Started / Sanction Pending</option>
                <option value="FIRST_INSTALLMENT_PAID">1st Installment Paid (FIR)</option>
                <option value="CHARGE_SHEET_RELEASE_PENDING">Chargesheet Release Pending</option>
                <option value="SPECIAL_COURT_TRIAL_RELEASE">Trial Conclusion Release</option>
              </select>
            </div>
          </div>

          {/* Urgency Flag & Preferred Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Case Urgency Level</label>
              <select
                value={currentUrgency}
                onChange={(e) => setCurrentUrgency(e.target.value as any)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="low">Low — Regular Follow-up</option>
                <option value="medium">Medium — Needs Monitoring</option>
                <option value="high">High — Active Support Required</option>
                <option value="critical">Critical — Immediate Escort / Crisis</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Preferred Channel</label>
              <select
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as any)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="IVR_VOICE">IVR Voice Call (Feature Phone)</option>
                <option value="FEATURE_PHONE_SMS">Two-Way SMS (Feature Phone)</option>
                <option value="EITHER">Either (IVR + SMS Fallback)</option>
              </select>
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Beneficiary Preferred Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as any)}
              className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeLabel} ({l.label})
                </option>
              ))}
            </select>
          </div>

          {/* Caseworker Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">District Caseworker Log &amp; Notes</label>
            <textarea
              rows={3}
              value={caseworkerNotes}
              onChange={(e) => setCaseworkerNotes(e.target.value)}
              placeholder="Record case developments, court attendance protection notes, relief sanction status..."
              className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Officer Contact info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Officer Name</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Officer Phone</label>
              <input
                type="text"
                value={officerPhone}
                onChange={(e) => setOfficerPhone(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record Updates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
