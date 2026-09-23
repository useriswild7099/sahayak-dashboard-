import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Globe,
  Radio,
  FileAudio,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Send,
  Hash,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ivrEngine } from '../services/ivrEngine';
import { IVRSessionState, LanguageCode, SUPPORTED_LANGUAGES, AtrocityCase, SMSMessage } from '../types/ivr';
import { IVR_SCRIPTS } from '../services/ivrScriptData';
import { smsService } from '../services/smsService';

interface IVRPhoneSimulatorProps {
  cases: AtrocityCase[];
  selectedCaseId?: string;
  onCaseChange?: (caseId: string) => void;
}

export const IVRPhoneSimulator: React.FC<IVRPhoneSimulatorProps> = ({
  cases,
  selectedCaseId,
  onCaseChange,
}) => {
  const [session, setSession] = useState<IVRSessionState>(ivrEngine.getState());
  const [customVoiceNote, setCustomVoiceNote] = useState('');
  const [activeCaseId, setActiveCaseId] = useState<string>(selectedCaseId || (cases[0]?.id ?? ''));
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [phoneMode, setPhoneMode] = useState<'VOICE_IVR' | 'SMS_TEXT' | 'USSD_CALLBACK'>('VOICE_IVR');
  
  // SMS simulation state
  const [smsInput, setSmsInput] = useState('');
  const [smsThread, setSmsThread] = useState<SMSMessage[]>([]);
  const [ussdDialInput, setUssdDialInput] = useState('*142#');
  const [ussdAlert, setUssdAlert] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const smsScrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to IVR state updates
  useEffect(() => {
    const unsubscribe = ivrEngine.subscribe((newState) => {
      setSession(newState);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to SMS service updates
  useEffect(() => {
    const updateThread = () => {
      if (activeCaseId) {
        setSmsThread(smsService.getMessagesForCase(activeCaseId));
      }
    };
    updateThread();
    const unsubscribe = smsService.subscribe(updateThread);
    return () => unsubscribe();
  }, [activeCaseId]);

  // Update selected case if prop changes
  useEffect(() => {
    if (selectedCaseId) {
      setActiveCaseId(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Scroll log to bottom on updates
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [session.callLog]);

  // Scroll SMS thread to bottom on updates
  useEffect(() => {
    if (smsScrollRef.current) {
      smsScrollRef.current.scrollTop = smsScrollRef.current.scrollHeight;
    }
  }, [smsThread, phoneMode]);

  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  const handleStartCall = () => {
    if (currentCase) {
      setPhoneMode('VOICE_IVR');
      ivrEngine.initiateCall(currentCase.id, currentCase.preferredLanguage || 'hi');
    }
  };

  const handleEndCall = () => {
    ivrEngine.endCall(true);
  };

  const handleKeyPress = (key: string) => {
    if (phoneMode === 'VOICE_IVR') {
      ivrEngine.pressKey(key);
    } else if (phoneMode === 'USSD_CALLBACK') {
      setUssdDialInput((prev) => prev + key);
    } else if (phoneMode === 'SMS_TEXT') {
      setSmsInput((prev) => prev + key);
    }
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    ivrEngine.setLanguage(lang);
  };

  const handleToggleSpeaker = () => {
    ivrEngine.toggleSpeaker();
  };

  const handleToggleMute = () => {
    ivrEngine.toggleMute();
  };

  const handleSubmitVoiceNote = () => {
    if (customVoiceNote.trim()) {
      ivrEngine.recordVoiceNote(customVoiceNote.trim());
      setCustomVoiceNote('');
    }
  };

  const handleSendSMS = (textToSend?: string) => {
    const message = textToSend || smsInput;
    if (!message.trim() || !currentCase) return;

    smsService.receiveInboundSMS(currentCase.contactNumber, message);
    if (!textToSend) setSmsInput('');
  };

  const handleSendOutboundScheduledSMS = () => {
    if (!currentCase) return;
    smsService.sendScheduledOutboundSMS(currentCase.id);
  };

  const handleTriggerUssdCallback = () => {
    setUssdAlert('Request sent! National Atrocity Relief Gateway (14566) will call this feature phone within 60 seconds.');
    setTimeout(() => {
      setUssdAlert(null);
      handleStartCall();
    }, 2500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentScript = IVR_SCRIPTS[session.step];
  const isCallActive =
    session.step !== 'IDLE' && session.step !== 'ENDED';

  // Browser speech recognition for voice notes
  const startMicListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === session.language);
      recognition.lang = langConfig ? langConfig.speechLocale : 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecordingMic(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCustomVoiceNote(transcript);
        setIsRecordingMic(false);
      };
      recognition.onerror = () => setIsRecordingMic(false);
      recognition.onend = () => setIsRecordingMic(false);

      recognition.start();
    } catch {
      setIsRecordingMic(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner Explaining Feature Phone Simulation (Clean Light Government Theme) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 text-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>MoSJE Feature-Phone Telephony &amp; SMS Gateway</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Equips survivors on basic ₹800 feature phones with two reliable channels: automated multilingual IVR voice calls
              and two-way SMS check-ins. No smartphones, internet connectivity, or mobile applications are required.
            </p>
          </div>

          {/* Case Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 self-start md:self-auto">
            <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">Target Beneficiary:</span>
            <select
              value={activeCaseId}
              onChange={(e) => {
                setActiveCaseId(e.target.value);
                if (onCaseChange) onCaseChange(e.target.value);
              }}
              disabled={isCallActive}
              className="bg-white text-slate-900 text-xs rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.victimPseudonym} ({c.district}) · Pref: {c.preferredChannel || 'IVR'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Physical Feature Phone Handset Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 rounded-[40px] p-5 shadow-xl border-4 border-zinc-700 relative">
            {/* Top Ear Speaker Earpiece */}
            <div className="w-16 h-1.5 bg-zinc-950 rounded-full mx-auto mb-3 border border-zinc-700"></div>

            {/* Feature Phone Mode Selector Tabs (Voice IVR vs SMS vs USSD) */}
            <div className="grid grid-cols-3 gap-1 mb-3 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-[10px]">
              <button
                onClick={() => setPhoneMode('VOICE_IVR')}
                className={`py-1 rounded font-bold transition-colors ${
                  phoneMode === 'VOICE_IVR'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Voice IVR
              </button>
              <button
                onClick={() => setPhoneMode('SMS_TEXT')}
                className={`py-1 rounded font-bold transition-colors ${
                  phoneMode === 'SMS_TEXT'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                SMS ({smsThread.length})
              </button>
              <button
                onClick={() => setPhoneMode('USSD_CALLBACK')}
                className={`py-1 rounded font-bold transition-colors ${
                  phoneMode === 'USSD_CALLBACK'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                USSD *142#
              </button>
            </div>

            {/* Backlit Phone Screen (Monochrome LCD Telephony Display) */}
            <div className="bg-[#112211] text-[#99ee88] font-mono rounded-xl p-3 border-2 border-[#1e3a1e] shadow-inner min-h-[220px] max-h-[220px] flex flex-col justify-between relative overflow-hidden">
              {/* Top Status Bar */}
              <div className="flex items-center justify-between text-[10px] pb-1 border-b border-[#254d25] text-[#77cc66]">
                <div className="flex items-center gap-1">
                  <span>📶 MoSJE-TEL</span>
                  <span className="text-[9px]">4G</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase">{currentCase?.preferredLanguage || session.language}</span>
                  <span>{phoneMode === 'VOICE_IVR' ? formatDuration(session.elapsedSeconds) : '10:45'}</span>
                  <span>🔋 92%</span>
                </div>
              </div>

              {/* Mode 1: VOICE IVR DISPLAY */}
              {phoneMode === 'VOICE_IVR' && (
                <div className="py-2 text-center my-auto overflow-y-auto">
                  {session.step === 'IDLE' ? (
                    <div>
                      <div className="text-xs text-[#aaff99] font-bold">MoSJE Sahayak</div>
                      <div className="text-[10px] text-[#66bb55] mt-1">Scheduled Voice Check-In</div>
                      <div className="text-[10px] text-[#55aa44] mt-2">Press GREEN key to receive call</div>
                    </div>
                  ) : session.step === 'DIALING' ? (
                    <div className="animate-pulse">
                      <div className="text-[11px] text-[#66bb55]">Incoming Call...</div>
                      <div className="text-xs text-[#aaff99] font-bold mt-1">1800-11-2026</div>
                      <div className="text-[9px] text-[#66bb55] mt-1">District Welfare Cell</div>
                    </div>
                  ) : session.step === 'RINGING' ? (
                    <div className="animate-pulse">
                      <div className="text-[11px] text-amber-300">Ringing...</div>
                      <div className="text-xs text-[#aaff99] font-bold mt-1">
                        {currentCase?.victimPseudonym || 'Beneficiary'}
                      </div>
                      <div className="text-[9px] text-[#66bb55] mt-1">{currentCase?.contactNumber}</div>
                    </div>
                  ) : session.step === 'ENDED' ? (
                    <div>
                      <div className="text-xs text-red-400 font-bold">Call Ended</div>
                      <div className="text-[10px] text-[#66bb55] mt-1">
                        Total Duration: {formatDuration(session.elapsedSeconds)}
                      </div>
                      <div className="text-[9px] text-[#55aa44] mt-2">Status logged to Caseworker</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-300 font-semibold uppercase">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                        <span>IN CALL: {session.step.replace('_', ' ')}</span>
                      </div>

                      {/* Sound wave activity animation */}
                      <div className="flex items-center justify-center gap-1 my-2 h-4">
                        {session.currentPromptAudioPlaying ? (
                          <>
                            <div className="w-1 bg-[#88ee77] h-3 animate-bounce"></div>
                            <div className="w-1 bg-[#88ee77] h-4 animate-bounce delay-75"></div>
                            <div className="w-1 bg-[#88ee77] h-2 animate-bounce delay-150"></div>
                            <div className="w-1 bg-[#88ee77] h-4 animate-bounce delay-100"></div>
                            <div className="w-1 bg-[#88ee77] h-1 animate-bounce"></div>
                          </>
                        ) : (
                          <span className="text-[9px] text-[#66aa55]">Press keypad number...</span>
                        )}
                      </div>

                      {session.keypadInputBuffer && (
                        <div className="text-[11px] text-white bg-[#1a381a] px-2 py-0.5 rounded inline-block mt-1 font-mono">
                          Key pressed: [{session.keypadInputBuffer.slice(-1)}]
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: SMS / TEXT DISPLAY */}
              {phoneMode === 'SMS_TEXT' && (
                <div
                  ref={smsScrollRef}
                  className="py-1 my-auto overflow-y-auto space-y-1.5 text-[10px] max-h-[145px] pr-1"
                >
                  <div className="text-[9px] text-[#55aa44] text-center pb-1 border-b border-[#254d25]">
                    SMS Inbox: MoSJE-1800112026
                  </div>
                  {smsThread.length === 0 ? (
                    <div className="text-center py-6 text-[#55aa44] text-[10px]">
                      No messages. Click &quot;Send Scheduled SMS&quot; to test.
                    </div>
                  ) : (
                    smsThread.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-1.5 rounded ${
                          msg.direction === 'INBOUND'
                            ? 'bg-[#1e441e] text-[#bbfbb0] text-right ml-4'
                            : 'bg-[#152e15] text-[#88ee77] text-left mr-4'
                        }`}
                      >
                        <div className="text-[8px] text-[#66aa55] flex justify-between">
                          <span>{msg.direction === 'INBOUND' ? 'Sent' : 'MoSJE Sahayak'}</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="mt-0.5 leading-snug">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Mode 3: USSD CALLBACK DISPLAY */}
              {phoneMode === 'USSD_CALLBACK' && (
                <div className="py-2 text-center my-auto">
                  <div className="text-xs text-[#aaff99] font-bold">Toll-Free Missed Call / USSD</div>
                  <div className="text-[10px] text-[#77cc66] mt-1">Dial *142# for urgent callback</div>
                  <div className="mt-3 bg-[#152e15] p-2 rounded border border-[#254d25]">
                    <div className="text-sm font-bold text-white tracking-widest">{ussdDialInput}</div>
                  </div>
                  {ussdAlert && (
                    <div className="text-[9px] text-amber-300 mt-2 animate-pulse leading-tight">
                      {ussdAlert}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Display Status */}
              <div className="text-[9px] pt-1 border-t border-[#254d25] flex justify-between text-[#66aa55]">
                <span>{phoneMode === 'VOICE_IVR' ? (session.isMuted ? 'MUTED' : 'MIC ON') : 'CH: 2G/4G'}</span>
                <span>{phoneMode === 'VOICE_IVR' ? (session.isSpeakerOn ? 'SPEAKER' : 'EARPIECE') : 'MSG READY'}</span>
              </div>
            </div>

            {/* Brand Logo on Handset */}
            <div className="text-center my-2 text-[10px] font-sans font-bold tracking-widest text-zinc-500 uppercase">
              BHARAT TELECOM · 4G FEATURE PHONE
            </div>

            {/* In-Call Action Control Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={phoneMode === 'USSD_CALLBACK' ? handleTriggerUssdCallback : handleStartCall}
                disabled={phoneMode === 'VOICE_IVR' && isCallActive}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  phoneMode === 'VOICE_IVR' && isCallActive
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>{phoneMode === 'USSD_CALLBACK' ? 'Dial USSD' : 'Call / Answer'}</span>
              </button>

              <button
                onClick={handleEndCall}
                disabled={session.step === 'IDLE' && phoneMode === 'VOICE_IVR'}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  session.step === 'IDLE' && phoneMode === 'VOICE_IVR'
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-600 text-white active:scale-95'
                }`}
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>

            {/* Audio & Speaker Controls (for voice call mode) */}
            {phoneMode === 'VOICE_IVR' && (
              <div className="flex items-center justify-between mb-4 px-2 text-zinc-400">
                <button
                  onClick={handleToggleSpeaker}
                  title="Toggle Speakerphone"
                  className={`p-2 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
                    session.isSpeakerOn
                      ? 'bg-zinc-700 text-amber-300 border-zinc-600'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}
                >
                  {session.isSpeakerOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">Audio {session.isSpeakerOn ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={handleToggleMute}
                  title="Toggle Mute"
                  className={`p-2 rounded-lg text-xs flex items-center gap-1 border transition-colors ${
                    session.isMuted
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {session.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{session.isMuted ? 'Muted' : 'Unmuted'}</span>
                </button>

                <button
                  onClick={() => ivrEngine.playCurrentStepPrompt()}
                  disabled={!isCallActive}
                  title="Replay Current Prompt"
                  className="p-2 rounded-lg text-xs flex items-center gap-1 border bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Replay</span>
                </button>
              </div>
            )}

            {/* SMS Send Bar (when in SMS mode) */}
            {phoneMode === 'SMS_TEXT' && (
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={smsInput}
                    onChange={(e) => setSmsInput(e.target.value)}
                    placeholder="Type: 1, 2, 3 or NEED3..."
                    className="flex-1 bg-zinc-950 text-xs text-white px-2.5 py-1.5 rounded border border-zinc-700 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleSendSMS()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* 12-Key Mechanical DTMF Keypad */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-zinc-950/70 rounded-2xl border border-zinc-800">
              {[
                { key: '1', sub: '.,' },
                { key: '2', sub: 'ABC' },
                { key: '3', sub: 'DEF' },
                { key: '4', sub: 'GHI' },
                { key: '5', sub: 'JKL' },
                { key: '6', sub: 'MNO' },
                { key: '7', sub: 'PQRS' },
                { key: '8', sub: 'TUV' },
                { key: '9', sub: 'WXYZ' },
                { key: '*', sub: 'MIC' },
                { key: '0', sub: '+' },
                { key: '#', sub: 'END' },
              ].map(({ key, sub }) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="bg-gradient-to-b from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 active:from-amber-600 active:to-amber-700 text-white rounded-xl py-2 px-1 flex flex-col items-center justify-center shadow transition-all active:scale-90 border border-zinc-600/50"
                >
                  <span className="text-base font-bold leading-none">{key}</span>
                  <span className="text-[9px] text-zinc-400 leading-none mt-1 uppercase font-mono">{sub}</span>
                </button>
              ))}
            </div>

            {/* Bottom Mic Pinhole */}
            <div className="w-1.5 h-1.5 bg-zinc-950 rounded-full mx-auto mt-4 border border-zinc-700"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: Multilingual Guidance, Two-Way SMS Tester & Live Telephony Log (Clean Light Theme) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick-Action Feature Phone Testing Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Feature-Phone Test Tools &amp; Actions
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-600 font-mono">
                  Channel: {phoneMode}
                </span>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={session.language}
                  onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                  className="bg-white text-xs text-slate-900 border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeLabel} ({lang.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Two-Way SMS Quick Tester */}
            {phoneMode === 'SMS_TEXT' ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-700" />
                    <span>Send Inbound Response as Beneficiary (Feature Phone SMS):</span>
                  </h4>
                  <button
                    onClick={handleSendOutboundScheduledSMS}
                    className="text-xs text-blue-700 hover:text-blue-800 underline font-semibold"
                  >
                    Simulate Scheduled MoSJE Outbound SMS
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleSendSMS('1')}
                    className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-emerald-900">Reply &apos;1&apos; — Coping Well</div>
                    <div className="text-[11px] text-emerald-700">Status is stable, no immediate danger</div>
                  </button>

                  <button
                    onClick={() => handleSendSMS('2')}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-amber-900">Reply &apos;2&apos; — Distress / Anxious</div>
                    <div className="text-[11px] text-amber-700">Experiencing difficulties during ongoing trial</div>
                  </button>

                  <button
                    onClick={() => handleSendSMS('3 NEED3 Police protection needed; accused visited home')}
                    className="p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-red-900">Reply &apos;3 NEED3&apos; — Urgent Police Escort</div>
                    <div className="text-[11px] text-red-700">Flags immediate witness intimidation alert</div>
                  </button>

                  <button
                    onClick={() => handleSendSMS('NEED4 Relief compensation delayed')}
                    className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-left transition-colors"
                  >
                    <div className="text-xs font-bold text-blue-900">Reply &apos;NEED4&apos; — Sec 15A Relief</div>
                    <div className="text-[11px] text-blue-700">Tracks disbursement of statutory relief fund</div>
                  </button>
                </div>
              </div>
            ) : (
              /* VOICE IVR Current Spoken Prompt Box */
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span className="flex items-center gap-1.5 font-bold text-blue-900">
                    <FileAudio className="w-3.5 h-3.5 text-blue-700" />
                    <span>IVR Voice Narration (Text-To-Speech)</span>
                  </span>
                  {session.currentPromptAudioPlaying && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 animate-pulse">
                      Synthesized Voice Playing
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {session.currentPromptText ||
                    (session.step === 'IDLE'
                      ? 'Press "Call / Answer" on the feature phone to simulate receiving a scheduled follow-up call from MoSJE.'
                      : 'Connecting call...')}
                </p>
              </div>
            )}

            {/* Interactive DTMF Keypad Options (when in voice call) */}
            {phoneMode === 'VOICE_IVR' && currentScript?.options && currentScript.options.length > 0 && isCallActive && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                  <span>Valid Keypad Responses for Current Node (Press or Click):</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentScript.options.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleKeyPress(opt.key)}
                      className="p-3 text-left rounded-lg bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all flex items-start gap-2.5 group"
                    >
                      <span className="w-6 h-6 rounded bg-blue-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        {opt.key}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                          {opt.label[session.language] || opt.label['en']}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {opt.actionDescription}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Note Input Section (During VOICE_MESSAGE step or anytime in call) */}
            {phoneMode === 'VOICE_IVR' && session.step === 'VOICE_MESSAGE' && (
              <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-300">
                <div className="flex items-center justify-between text-xs text-amber-950 font-bold mb-2">
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-amber-700" />
                    <span>Beneficiary Spoken Voice Note / Caseworker Message</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Speak into microphone or enter text</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customVoiceNote}
                    onChange={(e) => setCustomVoiceNote(e.target.value)}
                    placeholder="e.g. Need police escort for Tuesday court hearing, FIR copy needed..."
                    className="flex-1 bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    onClick={startMicListening}
                    title="Speak using browser microphone"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1 ${
                      isRecordingMic
                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 text-red-600" />
                    <span>{isRecordingMic ? 'Listening...' : 'Mic'}</span>
                  </button>
                  <button
                    onClick={handleSubmitVoiceNote}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white transition-colors"
                  >
                    Send Note (#)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Telephony Audit Trail & Transcript (Clean Light Government Theme) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Live Telephony Audit Trail &amp; Call Transcript
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                {session.callLog.length} events logged
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="mt-3 bg-slate-50 rounded-xl p-3 h-52 overflow-y-auto space-y-2 font-mono text-xs border border-slate-200"
            >
              {session.callLog.length === 0 ? (
                <div className="text-slate-500 text-center py-12 text-xs">
                  No voice call in progress. Press &quot;Call / Answer&quot; on the feature phone to begin.
                </div>
              ) : (
                session.callLog.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 p-2 rounded-lg ${
                      log.sender === 'USER'
                        ? 'bg-white text-blue-900 border-l-3 border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-l-3 border-slate-400 shadow-2xs'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        log.sender === 'USER'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {log.sender}
                    </span>
                    <span className="text-xs break-words flex-1 font-sans">{log.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
