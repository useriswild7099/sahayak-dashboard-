import React, { useState } from 'react';
import {
  Cpu,
  Code2,
  CheckCircle2,
  Send,
  MessageSquare,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Server,
  Terminal,
} from 'lucide-react';
import { AtrocityCase } from '../types/ivr';
import { therapyModelService } from '../services/therapyModelService';

interface CompanionIntegrationViewProps {
  cases: AtrocityCase[];
  onScoresUpdated: () => void;
}

export const CompanionIntegrationView: React.FC<CompanionIntegrationViewProps> = ({
  cases,
  onScoresUpdated,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [testScore, setTestScore] = useState<number>(82);
  const [testSnippet, setTestSnippet] = useState<string>(
    'Nighttime anxiety is very high. Accused relatives were seen watching our lane and made threatening remarks about Tuesday court testimony.'
  );
  const [companionType, setCompanionType] = useState<'journal' | 'chatbot' | 'both'>('both');
  const [injectedSuccess, setInjectedSuccess] = useState<string | null>(null);

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleSimulateIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;

    const sourceName =
      companionType === 'both'
        ? 'LOCAL_PC_CHATBOT_AND_JOURNAL'
        : companionType === 'journal'
        ? 'LOCAL_PC_JOURNALING_COMPANION'
        : 'LOCAL_PC_CHATBOT_COMPANION';

    const result = therapyModelService.ingestExternalScore(
      selectedCaseId,
      testScore,
      undefined,
      {
        sourceProject: sourceName,
        journalSnippet: testSnippet,
        detectedIndicators: [
          companionType === 'journal'
            ? 'Diary Reflection: High Fear & Intimidation Signal'
            : 'Chatbot Dialogue: Witness Retaliation Concern',
          'Somatic Distress Index & Hypervigilance',
        ],
        extractedPhrases: [testSnippet.slice(0, 75)],
        recommendedInterventions: [
          testScore >= 75
            ? 'Urgent Caseworker Outreach & Verification of Section 15A Witness Protection Escort'
            : 'Schedule follow-up check-in and verify safe contact hours',
        ],
      }
    );

    if (result) {
      onScoresUpdated();
      setInjectedSuccess(
        `Successfully ingested score (${testScore}/100, ${result.riskTier}) for ${selectedCase?.victimPseudonym || selectedCaseId}. Caseworker triage queue is now updated.`
      );
      setTimeout(() => setInjectedSuccess(null), 5000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Server className="w-4 h-4 text-emerald-700" />
              <span>External Local Integration Gateway</span>
              <span aria-hidden="true">·</span>
              <span>PC Companion &amp; Journal Bridge</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Chatbot &amp; Journaling Score Ingestion Hub
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Designed to connect with your separate local PC chatbot and journaling project.
              When your local companion evaluates a survivor&apos;s daily thoughts or chat sessions, it sends the computed distress
              score directly to this endpoint to prioritize triage for the District Welfare Officer.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded text-xs shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="font-semibold text-slate-900">Ingestion Port Ready</div>
              <div className="text-[11px] text-slate-500 font-mono">POST /api/companion/ingest</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {injectedSuccess && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-300 rounded text-emerald-900 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{injectedSuccess}</span>
        </div>
      )}

      {/* Main Grid: Interactive Test Ingestion & API Code Specification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Ingestion Simulator Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#0B2545]" />
                <span>Simulate Score Ingestion from Your PC Companion</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Test how incoming scores from your local chatbot or journaling project update the live caseworker queue.
              </p>
            </div>

            <form onSubmit={handleSimulateIngestion} className="space-y-4">
              {/* Select Case */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Beneficiary Profile</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full bg-white text-slate-900 rounded border border-slate-300 px-3 py-1.5 focus:outline-none font-semibold text-xs"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} · {c.victimPseudonym} ({c.district}) — Current Score:{' '}
                      {c.therapyModelResult?.distressScore ?? 'None'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Companion Source Type */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Local PC Project Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: 'Chatbot + Journal', icon: Cpu },
                    { id: 'chatbot', label: 'Chatbot Companion', icon: MessageSquare },
                    { id: 'journal', label: 'Journaling Diary', icon: BookOpen },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      onClick={() => setCompanionType(id as any)}
                      className={`p-2.5 rounded border text-left flex items-center gap-1.5 transition-colors ${
                        companionType === id
                          ? 'bg-slate-100 border-[#0B2545] text-[#0B2545] font-semibold ring-1 ring-[#0B2545]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#0B2545] shrink-0" />
                      <span className="text-[11px]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distress Score Slider & Number */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-semibold">
                    Computed Distress Score (0 – 100)
                  </label>
                  <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                    {testScore} / 100{' '}
                    <span
                      className={`text-xs font-sans ${
                        testScore >= 75
                          ? 'text-red-700'
                          : testScore >= 50
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      ({testScore >= 75 ? 'CRITICAL' : testScore >= 50 ? 'ELEVATED' : testScore >= 25 ? 'MODERATE' : 'LOW'})
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={testScore}
                  onChange={(e) => setTestScore(Number(e.target.value))}
                  className="w-full cursor-pointer accent-[#0B2545]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>0 (Nominal)</span>
                  <span>35 (Moderate)</span>
                  <span>55 (Elevated)</span>
                  <span>75 (Critical Danger)</span>
                  <span>100</span>
                </div>
              </div>

              {/* Journal / Chat Transcript Sample */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Sample Journal Entry or Chat Excerpt (Extracted on PC)
                </label>
                <textarea
                  rows={3}
                  value={testSnippet}
                  onChange={(e) => setTestSnippet(e.target.value)}
                  placeholder="Paste snippet analyzed by your local PC model..."
                  className="w-full bg-white text-slate-900 rounded border border-slate-300 p-2.5 focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Submit Ingestion */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Updates beneficiary file &amp; triage priority instantly
                </span>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0B2545] hover:bg-[#12335C] text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>Send Ingestion Payload</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Score State for Selected Beneficiary */}
          {selectedCase && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              <h3 className="font-bold text-slate-900">
                Active Score State for {selectedCase.victimPseudonym}:
              </h3>
              {selectedCase.therapyModelResult ? (
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Distress Score:</span>
                    <strong className="font-mono font-bold text-slate-900 tabular-nums">
                      {selectedCase.therapyModelResult.distressScore} / 100
                    </strong>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-800">
                      Tier: {selectedCase.therapyModelResult.riskTier}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      Source: {selectedCase.therapyModelResult.modelSource}
                    </span>
                  </div>
                  <div className="text-[11px]">
                    <span className="text-slate-500">Detected Signals: </span>
                    <span>{selectedCase.therapyModelResult.detectedIndicators.join(', ')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">No distress score recorded yet for this case.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Code Snippets & API Schema for Local PC Project (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-xs">
          {/* API Endpoint Documentation */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Terminal className="w-4 h-4 text-[#0B2545]" />
              <h3 className="font-bold text-slate-900">
                Local PC Project Connection Guide
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              When your local PC chatbot or journaling script computes a score, invoke this simple HTTP POST payload to sync with the Caseworker portal:
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <span className="font-sans font-semibold text-slate-800">Python Example (for your local script):</span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded overflow-x-auto leading-snug">
{`import requests

url = "http://localhost:3000/api/companion/ingest"
payload = {
    "caseId": "${selectedCase?.id || 'CASE-2026-ALW-019'}",
    "distressScore": 82,
    "riskTier": "CRITICAL",
    "journalSnippet": "Saw accused near my house...",
    "source": "PC_LOCAL_CHATBOT_AND_JOURNAL"
}

response = requests.post(url, json=payload)
print(response.status_code)`}
              </pre>
            </div>

            <div className="space-y-2 font-mono text-[11px] pt-2">
              <span className="font-sans font-semibold text-slate-800">JavaScript / Fetch Example:</span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded overflow-x-auto leading-snug">
{`await fetch('/api/companion/ingest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caseId: '${selectedCase?.id || 'CASE-2026-ALW-019'}',
    distressScore: 82,
    riskTier: 'CRITICAL',
    journalSnippet: 'Feeling unsafe today...'
  })
});`}
              </pre>
            </div>
          </div>

          {/* Privacy & Ethical Guarantee Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Zero Raw Data Leakage</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              To protect survivor confidentiality under the DPDP Act 2023, your local PC companion can compute sentiment locally on device and transmit ONLY numerical distress thresholds and safety flags, preserving complete diary privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
