import {
  CheckInRecord,
  IVRSessionState,
  IVRStep,
  LanguageCode,
  SelfReportedStatus,
  SUPPORTED_LANGUAGES,
  SupportNeedType,
} from '../types/ivr';
import { dtmfAudioService } from './dtmfAudioService';
import { IVR_SCRIPTS } from './ivrScriptData';

type Listener = (state: IVRSessionState) => void;

class IVREngineService {
  private state: IVRSessionState = this.getInitialState('hi');
  private listeners: Set<Listener> = new Set();
  private timerInterval: number | null = null;
  private currentCaseId: string | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onCallCompletedCallback: ((record: CheckInRecord) => void) | null = null;
  private isSyntheticVoiceAvailable: boolean = typeof window !== 'undefined' && 'speechSynthesis' in window;

  private getInitialState(lang: LanguageCode = 'hi'): IVRSessionState {
    return {
      step: 'IDLE',
      language: lang,
      elapsedSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      keypadInputBuffer: '',
      currentPromptText: '',
      currentPromptAudioPlaying: false,
      answers: {
        selectedNeeds: [],
      },
      callLog: [],
    };
  }

  public getState(): IVRSessionState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public setOnCallCompleted(callback: (record: CheckInRecord) => void): void {
    this.onCallCompletedCallback = callback;
  }

  public setLanguage(lang: LanguageCode): void {
    this.state.language = lang;
    this.notify();
    if (this.state.step !== 'IDLE' && this.state.step !== 'ENDED') {
      this.playCurrentStepPrompt();
    }
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    if (this.state.isMuted) {
      this.stopSpeech();
    } else {
      this.playCurrentStepPrompt();
    }
    this.notify();
  }

  public toggleSpeaker(): void {
    this.state.isSpeakerOn = !this.state.isSpeakerOn;
    this.notify();
  }

  /**
   * Start an IVR call to a beneficiary case
   */
  public initiateCall(caseId: string, preferredLanguage: LanguageCode = 'hi'): void {
    this.endCall(false); // Clean any previous call
    this.currentCaseId = caseId;
    this.state = this.getInitialState(preferredLanguage);
    this.state.step = 'DIALING';
    this.notify();

    // Start timer for duration
    this.timerInterval = window.setInterval(() => {
      if (this.state.step !== 'IDLE' && this.state.step !== 'ENDED') {
        this.state.elapsedSeconds += 1;
        this.notify();
      }
    }, 1000);

    // After 1 second of dialing, switch to ringing
    setTimeout(() => {
      if (this.state.step === 'DIALING') {
        this.state.step = 'RINGING';
        if (this.state.isSpeakerOn) {
          dtmfAudioService.startRingingTone();
        }
        this.notify();

        // Simulate pickup after 2.8 seconds
        setTimeout(() => {
          if (this.state.step === 'RINGING') {
            dtmfAudioService.stopRingingTone();
            this.transitionToStep('WELCOME');
          }
        }, 2800);
      }
    }, 1200);
  }

  /**
   * Transition to a specific IVR step and execute speech/prompt
   */
  public transitionToStep(step: IVRStep): void {
    dtmfAudioService.stopRingingTone();
    this.state.step = step;
    this.state.keypadInputBuffer = '';

    const script = IVR_SCRIPTS[step];
    if (script) {
      const text = script.promptText[this.state.language] || script.promptText['en'];
      this.state.currentPromptText = text;
      this.state.callLog.push({
        sender: 'SYSTEM',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      this.notify();
      this.speakText(text, () => {
        // Step specific auto-advancements
        if (step === 'WELCOME') {
          setTimeout(() => {
            if (this.state.step === 'WELCOME') {
              this.transitionToStep('CONSENT_CHECK');
            }
          }, 600);
        } else if (step === 'CONFIRMATION') {
          setTimeout(() => {
            this.finishCall('completed');
          }, 1800);
        }
      });
    } else {
      this.notify();
    }
  }

  /**
   * Handle user keypad (DTMF) button press
   */
  public pressKey(key: string): void {
    if (this.state.step === 'IDLE' || this.state.step === 'ENDED') {
      // Just play DTMF sound if phone is idle
      dtmfAudioService.playKeyTone(key);
      return;
    }

    // Play real DTMF dual-frequency tone
    dtmfAudioService.playKeyTone(key);

    this.state.keypadInputBuffer += key;
    this.state.callLog.push({
      sender: 'USER',
      text: `Keypad: [ ${key} ]`,
      key,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    this.notify();

    // Interrupt current prompt when key is pressed (Telephony Barge-In capability)
    this.stopSpeech();

    // Handle key according to current step
    switch (this.state.step) {
      case 'CONSENT_CHECK':
        if (key === '1') {
          this.state.answers.consentConfirmed = true;
          this.transitionToStep('STATUS_ASSESSMENT');
        } else if (key === '2') {
          this.state.answers.rescheduleRequested = true;
          this.state.currentPromptText = 'Check-in rescheduled for tomorrow. Take care.';
          this.speakText(
            this.state.language === 'hi'
              ? 'आपकी अनुरोध पर यह चेक-इन कल के लिए पुनर्निर्धारित कर दिया गया है। धन्यवाद।'
              : 'Your check-in has been rescheduled for tomorrow as requested. Thank you.',
            () => {
              this.finishCall('rescheduled');
            }
          );
        } else if (key === '9') {
          this.state.answers.consentConfirmed = false;
          this.speakText(
            this.state.language === 'hi'
              ? 'आपकी इच्छा का सम्मान करते हुए चेक-इन रोक दिया गया है। आप किसी भी समय अपनी प्राथमिकताएं बदल सकते हैं।'
              : 'Respecting your decision, automated check-ins have been paused. You may reactivate anytime.',
            () => {
              this.finishCall('opted_out');
            }
          );
        }
        break;

      case 'STATUS_ASSESSMENT':
        if (key === '1') {
          this.state.answers.selfReportedStatus = 'coping_well';
          this.transitionToStep('NEEDS_SELECTION');
        } else if (key === '2') {
          this.state.answers.selfReportedStatus = 'moderate_distress';
          this.transitionToStep('NEEDS_SELECTION');
        } else if (key === '3') {
          this.state.answers.selfReportedStatus = 'critical_crisis';
          this.transitionToStep('NEEDS_SELECTION');
        }
        break;

      case 'NEEDS_SELECTION': {
        const needsMap: Record<string, SupportNeedType> = {
          '1': 'legal_aid_escort',
          '2': 'trauma_counselling',
          '3': 'police_witness_security',
          '4': 'compensation_disbursement',
          '5': 'none_required',
        };
        const selected = needsMap[key];
        if (selected) {
          if (!this.state.answers.selectedNeeds) {
            this.state.answers.selectedNeeds = [];
          }
          if (!this.state.answers.selectedNeeds.includes(selected)) {
            this.state.answers.selectedNeeds.push(selected);
          }
          // Move to voice message / details step
          this.transitionToStep('VOICE_MESSAGE');
          // Sound beep for voice recording
          setTimeout(() => {
            dtmfAudioService.playPromptBeep();
          }, 800);
        }
        break;
      }

      case 'VOICE_MESSAGE':
        // Pressing # or any key completes voice message
        this.transitionToStep('CONFIRMATION');
        break;

      default:
        break;
    }
  }

  /**
   * Submit a typed or speech-recognized voice note
   */
  public submitVoiceNote(text: string): void {
    this.state.answers.voiceNote = text;
    this.state.callLog.push({
      sender: 'USER',
      text: `Spoken note: "${text}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
    this.notify();
    this.transitionToStep('CONFIRMATION');
  }

  public recordVoiceNote(text: string): void {
    this.submitVoiceNote(text);
  }

  /**
   * Complete the call and produce CheckInRecord
   */
  public finishCall(outcome: 'completed' | 'rescheduled' | 'opted_out'): void {
    dtmfAudioService.stopRingingTone();
    dtmfAudioService.playCallEndTone();
    this.stopSpeech();

    const record: CheckInRecord = {
      id: 'chk_' + Math.random().toString(36).substring(2, 9),
      caseId: this.currentCaseId || 'CASE_DEFAULT',
      timestamp: new Date().toISOString(),
      language: this.state.language,
      callDurationSeconds: this.state.elapsedSeconds,
      consentGiven: outcome !== 'opted_out' && this.state.answers.consentConfirmed !== false,
      status: this.state.answers.selfReportedStatus || null,
      needs: this.state.answers.selectedNeeds || [],
      voiceNoteTranscript: this.state.answers.voiceNote,
      channel: 'IVR_VOICE',
      outcome,
      caseworkerAcknowledged: false,
    };

    if (this.onCallCompletedCallback) {
      this.onCallCompletedCallback(record);
    }

    this.state.step = 'ENDED';
    this.state.currentPromptAudioPlaying = false;
    this.notify();

    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Force disconnect call
   */
  public endCall(triggerSound: boolean = true): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.stopSpeech();
    dtmfAudioService.stopRingingTone();
    if (triggerSound && this.state.step !== 'IDLE' && this.state.step !== 'ENDED') {
      dtmfAudioService.playCallEndTone();
    }
    this.state.step = 'ENDED';
    this.state.currentPromptAudioPlaying = false;
    this.notify();
  }

  /**
   * Reset session back to IDLE
   */
  public resetToIdle(): void {
    this.endCall(false);
    this.state = this.getInitialState(this.state.language);
    this.notify();
  }

  /**
   * Play current prompt again
   */
  public playCurrentStepPrompt(): void {
    if (this.state.step === 'IDLE' || this.state.step === 'ENDED' || this.state.step === 'RINGING' || this.state.step === 'DIALING') {
      return;
    }
    const script = IVR_SCRIPTS[this.state.step];
    if (script) {
      const text = script.promptText[this.state.language] || script.promptText['en'];
      this.state.currentPromptText = text;
      this.notify();
      this.speakText(text);
    }
  }

  private stopSpeech(): void {
    if (this.isSyntheticVoiceAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.state.currentPromptAudioPlaying = false;
  }

  private speakText(text: string, onEnd?: () => void): void {
    this.stopSpeech();
    if (this.state.isMuted || !this.state.isSpeakerOn || !this.isSyntheticVoiceAvailable) {
      if (onEnd) {
        // Provide reasonable pacing when muted or audio is not playing
        const simulatedDuration = Math.max(1200, Math.min(6000, text.length * 40));
        setTimeout(onEnd, simulatedDuration);
      }
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === this.state.language);
      const targetLocale = langInfo ? langInfo.speechLocale : 'en-IN';
      utterance.lang = targetLocale;
      utterance.rate = 0.95; // Clear, calm, respectful tempo
      utterance.pitch = 1.0;

      // Try selecting regional voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith(this.state.language) || v.lang.toLowerCase().includes(targetLocale.toLowerCase())
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        this.state.currentPromptAudioPlaying = true;
        this.notify();
      };

      utterance.onend = () => {
        this.state.currentPromptAudioPlaying = false;
        this.notify();
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.state.currentPromptAudioPlaying = false;
        this.notify();
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.state.currentPromptAudioPlaying = false;
      this.notify();
      if (onEnd) setTimeout(onEnd, 2000);
    }
  }
}

export const ivrEngine = new IVREngineService();
