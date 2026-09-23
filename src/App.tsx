import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CaseworkerQueue } from './components/CaseworkerQueue';
import { IVRPhoneSimulator } from './components/IVRPhoneSimulator';
import { CitizenPrivacyPortal } from './components/CitizenPrivacyPortal';
import { EthicalCharterModal } from './components/EthicalCharterModal';
import { CaseDetailModal } from './components/CaseDetailModal';
import { storageService } from './services/storageService';
import { ivrEngine } from './services/ivrEngine';
import { therapyModelService } from './services/therapyModelService';
import { AtrocityCase, CheckInRecord } from './types/ivr';

export default function App() {
  const [currentView, setCurrentView] = useState<'caseworker' | 'citizen' | 'simulator' | 'ethics'>('caseworker');
  const [cases, setCases] = useState<AtrocityCase[]>(storageService.getCases());
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>(storageService.getCheckIns());
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<AtrocityCase | null>(null);
  const [selectedCaseForPhoneId, setSelectedCaseForPhoneId] = useState<string>(cases[0]?.id || '');
  const [completionNotification, setCompletionNotification] = useState<string | null>(null);

  // Synchronize state with storageService
  useEffect(() => {
    const updateLocalData = () => {
      setCases(storageService.getCases());
      setCheckIns(storageService.getCheckIns());
    };

    const unsubscribe = storageService.subscribe(updateLocalData);

    // Register IVR engine completion callback to persist check-ins
    ivrEngine.setOnCallCompleted(async (record) => {
      storageService.addCheckInRecord(record);
      await therapyModelService.scoreCase(record.caseId);
      const targetCase = storageService.getCaseById(record.caseId);
      const pseudonym = targetCase ? targetCase.victimPseudonym : 'Beneficiary';
      setCompletionNotification(`Check-in recorded for ${pseudonym}. Case status & therapy model score updated.`);
      setTimeout(() => setCompletionNotification(null), 5000);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenPhoneWithCase = (c?: AtrocityCase) => {
    if (c) {
      setSelectedCaseForPhoneId(c.id);
    }
    setCurrentView('simulator');
  };

  const handleOpenCaseDetail = (c: AtrocityCase) => {
    setSelectedCaseForDetail(c);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        cases={cases}
        onOpenPhoneWithCase={handleOpenPhoneWithCase}
      />

      {/* Floating Check-In Completion Alert */}
      {completionNotification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold border border-emerald-600 flex items-center gap-2 animate-bounce">
          <span>🔔</span>
          <span>{completionNotification}</span>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16">
        {currentView === 'caseworker' && (
          <CaseworkerQueue
            cases={cases}
            checkIns={checkIns}
            onOpenPhoneWithCase={handleOpenPhoneWithCase}
            onOpenCaseDetail={handleOpenCaseDetail}
          />
        )}

        {currentView === 'simulator' && (
          <IVRPhoneSimulator
            cases={cases}
            selectedCaseId={selectedCaseForPhoneId}
            onCaseChange={(id) => setSelectedCaseForPhoneId(id)}
          />
        )}

        {currentView === 'citizen' && (
          <CitizenPrivacyPortal
            cases={cases}
            checkIns={checkIns}
            onOpenPhoneWithCase={handleOpenPhoneWithCase}
          />
        )}

        {currentView === 'ethics' && <EthicalCharterModal />}
      </main>

      {/* Case Details & Ledger Modal */}
      {selectedCaseForDetail && (
        <CaseDetailModal
          atrocityCase={selectedCaseForDetail}
          checkIns={storageService.getCheckInsForCase(selectedCaseForDetail.id)}
          onClose={() => setSelectedCaseForDetail(null)}
          onInitiateCall={(caseId) => {
            const found = cases.find((c) => c.id === caseId);
            if (found) {
              handleOpenPhoneWithCase(found);
            }
          }}
        />
      )}

      {/* Official Government Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-semibold text-slate-800">
                MoSJE Sahayak · SC/ST (Prevention of Atrocities) Act 1989 &amp; Rules 1995/2016
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Department of Social Justice and Empowerment, Ministry of Social Justice and Empowerment, Government of India
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
              <span className="hover:text-blue-700 cursor-pointer">Accessibility Statement (GIGW)</span>
              <span>·</span>
              <span className="hover:text-blue-700 cursor-pointer">Citizen Data Protection &amp; DPDP Act</span>
              <span>·</span>
              <span className="hover:text-blue-700 cursor-pointer">Toll-Free Helpline: 14566 / 1800-11-2026</span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
            <span>Official Portal for District Welfare Officer Caseworker Continuity &amp; Section 15A Witness Protection Triage</span>
            <span>Version 2.4 (Government Light Edition)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
