import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Scale,
  Phone,
  Lock,
  HeartHandshake,
  FileCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  Target,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';

export const EthicalCharterModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reality_check' | 'field_problems' | 'sahayak_solution' | 'litmus_test'>('reality_check');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                  Critical Architectural Analysis
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium">SIH26094 Evaluation</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                Are We Solving the Real Problem or Building Something No One Needs?
              </h2>
            </div>
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg max-w-sm">
            <strong className="text-slate-900 block font-semibold">MoSJE Policy Standard:</strong>
            Survivor welfare must deliver statutory Section 15A entitlements—not punitive state surveillance.
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('reality_check')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'reality_check'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>1. The Unfiltered Critique</span>
          </button>
          <button
            onClick={() => setActiveTab('field_problems')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'field_problems'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>2. Real-World Field Realities</span>
          </button>
          <button
            onClick={() => setActiveTab('sahayak_solution')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'sahayak_solution'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>3. How Sahayak Fixes This</span>
          </button>
          <button
            onClick={() => setActiveTab('litmus_test')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'litmus_test'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>4. The 5 Public Impact Litmus Tests</span>
          </button>
        </div>
      </div>

      {/* Tab 1: The Unfiltered Critique */}
      {activeTab === 'reality_check' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-900 leading-relaxed">
            <h3 className="font-bold text-sm text-red-800 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>The Naive Problem Statement Trap: &quot;Predicting Mental Health With AI&quot;</span>
            </h3>
            <p>
              The original hackathon problem statement (SIH26094) proposed: <em>&quot;AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities&quot;</em>.
              If built naively as requested, it results in an invasive, paternalistic system that <strong>no atrocity survivor would ever trust, and no caseworker could safely act upon</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Flawed Approach */}
            <div className="bg-white border border-red-200 rounded-xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm border-b border-red-100 pb-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>What No One Needs (The Artificial Trap)</span>
              </div>

              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">✕</span>
                  <span>
                    <strong>Zero Ground Truth Data:</strong> There is no validated dataset on earth that can accurately correlate a rural survivor&apos;s tone of voice with clinical PTSD. Assigning an arbitrary score (e.g. 78/100) without asking what they need is pseudoscientific.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">✕</span>
                  <span>
                    <strong>State Surveillance Fear:</strong> In SC/ST atrocities, perpetrators are often politically dominant and local police may be compromised. If vulnerable victims suspect the state is &quot;monitoring their mental state,&quot; they will clam up and stop reporting.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">✕</span>
                  <span>
                    <strong>Treating a Material Crisis as a Purely Psychiatric One:</strong> A survivor&apos;s trauma is rarely abstract depression. It is caused by <em>unpaid Section 15A relief money</em>, <em>witness intimidation before trial hearings</em>, and <em>official silence</em>. An AI therapist chatbot cannot feed a family or stop armed goons.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-0.5">✕</span>
                  <span>
                    <strong>The Smartphone Delusion:</strong> The poorest, most vulnerable victims in rural Koraput, Sitapur, or Alwar do not own 5G smartphones with high-speed internet to install complex mobile apps.
                  </span>
                </li>
              </ul>
            </div>

            {/* What Actually Solves It */}
            <div className="bg-white border border-emerald-200 rounded-xl p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-emerald-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Survivors Actually Need (The MoSJE Sahayak Reality)</span>
              </div>

              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                  <span>
                    <strong>Direct, Respectful Needs Questioning:</strong> Don&apos;t guess or predict. Ask directly: <em>&quot;Do you feel safe right now? Do you need a police escort for court? Has your compensation arrived?&quot;</em>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                  <span>
                    <strong>₹800 Feature Phone Telephony (IVR / 2G SMS):</strong> Works on basic voice calls and simple keypad presses without internet, apps, or digital literacy barriers in 9 local languages.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                  <span>
                    <strong>Inverting Surveillance to the State:</strong> The system doesn&apos;t judge the victim; it flags <em>Lapsed Contact (&gt;14 days)</em> and <em>Pending Statutory Compensation</em> to hold District Welfare Officers accountable.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                  <span>
                    <strong>Human-in-the-Loop Clinical Triage:</strong> The therapy model acts strictly as an assistant to highlight trigger phrases (e.g. <em>&quot;threatened&quot;</em>, <em>&quot;unable to sleep&quot;</em>) to help caseworkers prioritize urgent human intervention.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Field Realities */}
      {activeTab === 'field_problems' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-700" />
            <span>Field Reality: Why Atrocity Survivors Fall Through the Cracks in India</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <span>1. Witness Intimidation &amp; Isolation</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Trials under the PoA Act take 2 to 5 years. During this period, victims are pressured or threatened by perpetrators to turn hostile. When caseworkers don&apos;t check in, victims feel abandoned and concede.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>2. Unpaid Section 15A Relief</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The PoA Rules mandate immediate relief (25% on FIR, 50% on charge-sheet, 25% on conviction). In practice, funds get stalled in sub-treasury verification. Without relief money, families cannot even afford bus fares to court.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>3. Language &amp; Dialect Barriers</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Survivors in tribal or rural belts speak local tongues (Odia, Santhali, Gondi, Tamil, Bhojpuri). Official court notices in English or formal state languages are incomprehensible without spoken, conversational assistance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: How Sahayak Fixes This */}
      {activeTab === 'sahayak_solution' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-700" />
            <span>How MoSJE Sahayak Solves the Real Problem</span>
          </h3>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-50 border border-blue-200">
              <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Automated Scheduled Call Cadence on 2G Phone Networks</h4>
                <p className="text-slate-600 mt-0.5">
                  Instead of expecting a victim to navigate an app, the system calls them at their preferred hour in their mother tongue (Hindi, Tamil, Odia, Telugu, Marathi, Bengali, Kannada, Punjabi, Gujarati).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Direct Statutory Entitlement Tracking</h4>
                <p className="text-slate-600 mt-0.5">
                  Every check-in explicitly logs Section 15A statutory needs: Police Escort, Legal Aid, Travel Allowance, and Medical Care. These immediately generate high-priority follow-up tasks for district officers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Therapy Model as Triage Assistant (Explainable &amp; Non-Coercive)</h4>
                <p className="text-slate-600 mt-0.5">
                  The NLP distress score provides an urgency flag (0–100) based on actual transcribed words, complete with trigger phrases (e.g. <em>&quot;threat to life&quot;</em>). It never overrides the survivor&apos;s direct self-reported need.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 5 Public Impact Litmus Tests */}
      {activeTab === 'litmus_test' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            <span>The 5 Public Impact Litmus Tests</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold">
                  <th className="p-3 border border-slate-200">Test Question</th>
                  <th className="p-3 border border-slate-200">Naive AI Surveillance System</th>
                  <th className="p-3 border border-slate-200">MoSJE Sahayak Architecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="p-3 font-semibold text-slate-900 border border-slate-200">
                    1. Will a rural tribal survivor actually use it?
                  </td>
                  <td className="p-3 text-red-700 bg-red-50/50 border border-slate-200">
                    No. Requires smartphone, 4G internet, and literacy.
                  </td>
                  <td className="p-3 text-emerald-800 bg-emerald-50/50 border border-slate-200 font-medium">
                    Yes. Operates via standard incoming phone calls on any ₹800 feature phone in 9 local languages.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 border border-slate-200">
                    2. Does it reduce witness intimidation?
                  </td>
                  <td className="p-3 text-red-700 bg-red-50/50 border border-slate-200">
                    No. Generates a clinical graph without mobilizing police.
                  </td>
                  <td className="p-3 text-emerald-800 bg-emerald-50/50 border border-slate-200 font-medium">
                    Yes. Directly captures threats and triggers an instant Section 15A police protection order.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 border border-slate-200">
                    3. Does it hold the government accountable?
                  </td>
                  <td className="p-3 text-red-700 bg-red-50/50 border border-slate-200">
                    No. Judges the victim&apos;s mental health, not the state&apos;s inaction.
                  </td>
                  <td className="p-3 text-emerald-800 bg-emerald-50/50 border border-slate-200 font-medium">
                    Yes. Flags caseworkers when contact has lapsed (&gt;14 days) or compensation remains unpaid.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 border border-slate-200">
                    4. Can the model be audited for bias?
                  </td>
                  <td className="p-3 text-red-700 bg-red-50/50 border border-slate-200">
                    No. Proprietary black-box prediction.
                  </td>
                  <td className="p-3 text-emerald-800 bg-emerald-50/50 border border-slate-200 font-medium">
                    Yes. Model explainability shows detected indicators and trigger words alongside confidence scores.
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900 border border-slate-200">
                    5. Does the citizen have dignity &amp; consent?
                  </td>
                  <td className="p-3 text-red-700 bg-red-50/50 border border-slate-200">
                    No. Mandatory surveillance without clear opt-out.
                  </td>
                  <td className="p-3 text-emerald-800 bg-emerald-50/50 border border-slate-200 font-medium">
                    Yes. Explicit privacy portal, safety timing check before every call, and one-click consent pause.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
