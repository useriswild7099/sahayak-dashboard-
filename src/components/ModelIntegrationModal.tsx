import React, { useState } from 'react';
import {
  X,
  Cpu,
  Server,
  Play,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Code2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { therapyModelService } from '../services/therapyModelService';
import { TherapyModelConfig, TherapyModelResult } from '../types/ivr';

interface ModelIntegrationModalProps {
  onClose: () => void;
  onScoresUpdated: () => void;
}

const SAMPLE_TEXT_BENCHMARKS = [
  {
    title: 'High Threat / Intimidation',
    text: 'रात को आरोपी के रिश्तेदार घर के चक्कर लगा रहे थे और गवाही न देने की धमकी दी। जान का खतरा लग रहा है, बहुत डर लग रहा है।',
  },
  {
    title: 'Severe Trauma / Insomnia',
    text: 'Unable to sleep for the last four days. Constantly shaking and experiencing panic attacks whenever there is a knock at the door.',
  },
  {
    title: 'Relief Compensation & Legal Delay',
    text: 'Court hearing was adjourned again for the third time. The lawyer is demanding fees and the Section 15A compensation is still stuck at the treasury.',
  },
  {
    title: 'Stable / Coping Adequately',
    text: 'Things have been quiet this week. The village social worker accompanied us to file the verification form. Feeling safe right now.',
  },
];

export const ModelIntegrationModal: React.FC<ModelIntegrationModalProps> = ({
  onClose,
  onScoresUpdated,
}) => {
  const [config, setConfig] = useState<TherapyModelConfig>(therapyModelService.getConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'playground' | 'api_schema'>('config');

  // Test playground state
  const [testInputText, setTestInputText] = useState(SAMPLE_TEXT_BENCHMARKS[0].text);
  const [isInferring, setIsInferring] = useState(false);
  const [testResult, setTestResult] = useState<TherapyModelResult | null>(null);

  // Batch scoring state
  const [isBatchScoring, setIsBatchScoring] = useState(false);
  const [batchScoreSuccess, setBatchScoreSuccess] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    therapyModelService.saveConfig(config);
    setBatchScoreSuccess(true);
    setTimeout(() => setBatchScoreSuccess(false), 3000);
  };

  const handleRunPlaygroundInference = async () => {
    if (!testInputText.trim()) return;
    setIsInferring(true);
    try {
      const res = await therapyModelService.analyzeText(testInputText.trim());
      setTestResult(res);
    } finally {
      setIsInferring(false);
    }
  };

  const handleRunBatchScoring = async () => {
    setIsBatchScoring(true);
    try {
      await therapyModelService.scoreAllCases();
      onScoresUpdated();
      setBatchScoreSuccess(true);
      setTimeout(() => setBatchScoreSuccess(false), 4000);
    } finally {
      setIsBatchScoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Therapy &amp; Distress Scoring Model Integration Hub</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  {config.mode === 'CUSTOM_ENDPOINT' ? 'Custom API' : 'Built-in Adapter'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Connect your custom trained ML/NLP therapy model or use the built-in clinical crisis adapter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Model Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'playground'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Inference Playground</span>
          </button>

          <button
            onClick={() => setActiveTab('api_schema')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'api_schema'
                ? 'border-blue-700 text-blue-900 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>REST API Endpoint Specification</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {batchScoreSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Model configuration and batch scores have been updated successfully.</span>
            </div>
          )}

          {/* TAB 1: CONFIGURATION */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-slate-800 font-bold mb-2">Model Execution Engine</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setConfig({ ...config, mode: 'BUILTIN_ADAPTER' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.mode === 'BUILTIN_ADAPTER'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-700" />
                      <span>Built-in Clinical Distress Adapter</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Calibrated for PoA Act survivor scenarios: detects witness intimidation, insomnia, legal fatigue, and crisis ideation.
                    </p>
                  </div>

                  <div
                    onClick={() => setConfig({ ...config, mode: 'CUSTOM_ENDPOINT' })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.mode === 'CUSTOM_ENDPOINT'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-700" />
                      <span>Custom External Therapy Model (REST API)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Connect your custom trained model URL (FastAPI, Flask, PyTorch, HuggingFace, or microservice endpoint).
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoint Fields (active if Custom Endpoint) */}
              {config.mode === 'CUSTOM_ENDPOINT' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-700" />
                    <span>External Model HTTP Parameters</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Inference Endpoint URL</label>
                    <input
                      type="url"
                      required
                      value={config.endpointUrl}
                      onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                      placeholder="https://your-model-server.com/api/predict-distress"
                      className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">API Key / Bearer Token (Optional)</label>
                      <input
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        placeholder="Bearer token or API Secret..."
                        className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Model Architecture / Tag</label>
                      <input
                        type="text"
                        value={config.modelName}
                        onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                        placeholder="e.g. RoBERTa-Distress-EnHi-v1"
                        className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Triage Thresholds */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-700" />
                  <span>Distress Score Classification Thresholds (0 – 100)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-slate-700 font-semibold mb-1">
                      <span>Critical Crisis Threshold:</span>
                      <span className="font-mono text-red-700 font-bold">{config.scoreThresholdCritical}/100</span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={95}
                      value={config.scoreThresholdCritical}
                      onChange={(e) => setConfig({ ...config, scoreThresholdCritical: Number(e.target.value) })}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Scores above this trigger urgent caseworker priority.</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-semibold mb-1">
                      <span>Elevated Distress Threshold:</span>
                      <span className="font-mono text-amber-700 font-bold">{config.scoreThresholdElevated}/100</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={70}
                      value={config.scoreThresholdElevated}
                      onChange={(e) => setConfig({ ...config, scoreThresholdElevated: Number(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Scores above this flag need for trauma counselling.</p>
                  </div>
                </div>
              </div>

              {/* Save & Batch Score Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRunBatchScoring}
                  disabled={isBatchScoring}
                  className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBatchScoring ? 'animate-spin' : ''}`} />
                  <span>{isBatchScoring ? 'Scoring Cases...' : 'Batch Score All Beneficiaries Now'}</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: LIVE PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Select Benchmark or Enter Chat Transcript:</span>
                <span className="text-[11px] text-slate-500">Tests custom or adapter inference</span>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_TEXT_BENCHMARKS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTestInputText(sample.text)}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 text-left transition-colors"
                  >
                    <div className="font-bold text-blue-900 text-xs">{sample.title}</div>
                    <div className="text-[11px] text-slate-600 truncate mt-0.5">{sample.text}</div>
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div>
                <textarea
                  rows={3}
                  value={testInputText}
                  onChange={(e) => setTestInputText(e.target.value)}
                  placeholder="Paste or type survivor check-in voice transcript or SMS text message..."
                  className="w-full bg-white text-slate-900 rounded-lg border border-slate-300 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunPlaygroundInference}
                  disabled={isInferring}
                  className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-2 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isInferring ? 'Running Model...' : 'Run Therapy Model Inference'}</span>
                </button>
              </div>

              {/* Inference Results Output */}
              {testResult && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      <span className="font-bold text-slate-900">Model Evaluation Output</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Source: {testResult.modelSource} · Confidence: {(testResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Score & Risk Tier Banner */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-slate-600 text-[11px] font-semibold">Computed Distress Score:</div>
                      <div className="text-2xl font-bold font-mono text-slate-900 mt-1 flex items-baseline gap-1">
                        <span
                          className={
                            testResult.distressScore >= 75
                              ? 'text-red-700'
                              : testResult.distressScore >= 50
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {testResult.distressScore}
                        </span>
                        <span className="text-xs text-slate-500">/ 100</span>
                      </div>
                      {/* Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            testResult.distressScore >= 75
                              ? 'bg-red-600'
                              : testResult.distressScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${testResult.distressScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="text-slate-600 text-[11px] font-semibold">Priority / Urgency Tier:</div>
                      <div className="mt-1">
                        <span
                          className={`px-2.5 py-1 rounded text-xs font-bold uppercase inline-block border ${
                            testResult.riskTier === 'CRITICAL'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : testResult.riskTier === 'ELEVATED'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {testResult.riskTier} PRIORITY
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        {testResult.riskTier === 'CRITICAL'
                          ? 'Requires immediate casework outreach within 24h'
                          : 'Standard monitoring protocol'}
                      </div>
                    </div>
                  </div>

                  {/* Detected Indicators */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block mb-1">
                      Detected Psychological &amp; Situational Markers:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {testResult.detectedIndicators.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[11px] font-medium"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Interventions */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block mb-1">
                      Recommended Clinical &amp; Casework Actions:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {testResult.recommendedInterventions.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REST API SPECIFICATION */}
          {activeTab === 'api_schema' && (
            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-700 font-sans leading-relaxed">
                To connect your already built therapy model, deploy it as an HTTP service (e.g. FastAPI / Flask)
                and return the JSON format below. MoSJE Sahayak will send conversation transcripts and SMS updates to your endpoint:
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-blue-900 font-bold font-sans">1. Outbound Request Schema (Sent by MoSJE Sahayak):</span>
                <pre className="text-slate-800 overflow-x-auto p-3 bg-white border border-slate-200 rounded-lg">
{`POST /api/predict-distress HTTP/1.1
Content-Type: application/json
Authorization: Bearer <YOUR_API_KEY>

{
  "text": "रात को आरोपी के रिश्तेदार चक्कर लगा रहे हैं, बहुत डर लग रहा है।",
  "context": {
    "caseId": "CASE-2026-ALW-019",
    "selfReportedStatus": "critical_crisis",
    "needs": ["police_witness_security"]
  },
  "model_name": "Clinical-Trauma-NLP-v2"
}`}
                </pre>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-emerald-900 font-bold font-sans">2. Expected Response Schema (From Your Therapy Model):</span>
                <pre className="text-slate-800 overflow-x-auto p-3 bg-white border border-slate-200 rounded-lg">
{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "distressScore": 88,
  "riskTier": "CRITICAL",
  "confidence": 0.94,
  "detectedIndicators": [
    "Direct Witness Intimidation / Fear of Retaliation",
    "Acute Hypervigilance"
  ],
  "extractedPhrases": ["आरोपी के रिश्तेदार", "डर लग रहा है"],
  "recommendedInterventions": [
    "Immediate activation of Section 15A Witness Protection Escort",
    "Police van patrolling at victim residence"
  ]
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
