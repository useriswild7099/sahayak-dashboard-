import React, { useState } from 'react';
import { X, Calendar, Clock, Phone, MessageSquare, Shield, User, CheckCircle2 } from 'lucide-react';
import { AtrocityCase, ScheduledInteraction } from '../types/ivr';
import { storageService } from '../services/storageService';

interface ScheduleInteractionModalProps {
  atrocityCase: AtrocityCase;
  onClose: () => void;
  onScheduled: (interaction: ScheduledInteraction) => void;
}

export const ScheduleInteractionModal: React.FC<ScheduleInteractionModalProps> = ({
  atrocityCase,
  onClose,
  onScheduled,
}) => {
  // Default to tomorrow's date or 3 days from now
  const defaultDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>(atrocityCase.preferredTimeSlot || 'morning');
  const [channel, setChannel] = useState<'IVR_VOICE' | 'FEATURE_PHONE_SMS' | 'CASEWORKER_VISIT' | 'SPECIAL_COURT_ESCORT'>('IVR_VOICE');
  const [purpose, setPurpose] = useState('Scheduled Follow-Up & Wellbeing Check-in');
  const [assignedOfficer, setAssignedOfficer] = useState(atrocityCase.assignedCaseworker?.name || 'District Welfare Officer');
  const [frequencyDays, setFrequencyDays] = useState(atrocityCase.checkInFrequencyDays || 7);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInteraction: ScheduledInteraction = {
      id: 'sch-' + Math.random().toString(36).substring(2, 9),
      caseId: atrocityCase.id,
      scheduledDate,
      timeSlot,
      channel,
      purpose,
      assignedOfficer,
      status: 'pending',
      notes: notes.trim() || undefined,
    };

    storageService.scheduleFutureInteraction(newInteraction);
    if (frequencyDays !== atrocityCase.checkInFrequencyDays) {
      storageService.updateCaseRecord(atrocityCase.id, { checkInFrequencyDays: frequencyDays });
    }

    onScheduled(newInteraction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Schedule Future Outreach Interaction</h3>
              <p className="text-[11px] text-slate-500">Log scheduled follow-up or Section 15A court escort</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Case Context banner */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>Beneficiary: <strong className="text-slate-900">{atrocityCase.victimPseudonym}</strong></span>
          <span className="font-mono text-blue-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
            {atrocityCase.id}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Date & Time Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Preferred Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value as any)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="morning">Morning (10:00 AM – 12:00 PM)</option>
                <option value="afternoon">Afternoon (02:00 PM – 04:30 PM)</option>
                <option value="evening">Evening (06:00 PM – 08:00 PM)</option>
              </select>
            </div>
          </div>

          {/* Contact Channel */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Interaction Channel</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'IVR_VOICE', label: 'Automated IVR Voice Call', icon: Phone },
                { id: 'FEATURE_PHONE_SMS', label: 'Feature-Phone SMS', icon: MessageSquare },
                { id: 'SPECIAL_COURT_ESCORT', label: 'Sec 15A Court Escort', icon: Shield },
                { id: 'CASEWORKER_VISIT', label: 'In-Person Welfare Visit', icon: User },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setChannel(id as any)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    channel === id
                      ? 'bg-blue-50 text-blue-900 border-blue-400 font-bold ring-2 ring-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0 text-blue-700" />
                  <span className="text-[11px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Purpose presets */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Purpose / Agenda</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                'Special Court Witness Statement Escort',
                'Section 15A Relief Disbursement Follow-up',
                'Trauma Counselling Tele-Session',
                'Regular Automated Wellbeing Check-in',
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setPurpose(preset)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Officer & Recurring Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Caseworker</label>
              <input
                type="text"
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Check-in Cadence</label>
              <select
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(Number(e.target.value))}
                className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value={7}>Every 7 Days (Weekly)</option>
                <option value={14}>Every 14 Days (Bi-weekly)</option>
                <option value={30}>Every 30 Days (Monthly)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Case Notes / Special Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Ensure Hindi translation; coordinate with Special Public Prosecutor..."
              className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
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
              className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm &amp; Schedule Interaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
