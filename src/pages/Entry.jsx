import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorsePig from '../components/entry/HorsePig';
import WireAnimation from '../components/entry/WireAnimation';
import SafeDial from '../components/entry/SafeDial';
import { TOKENS } from '../config';

const STEPS = {
  BOX: 'box',
  WIRE: 'wire',
  DIAL: 'dial',
};

export default function Entry() {
  const [step, setStep] = useState(STEPS.BOX);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  function resolveTarget() {
    if (token === TOKENS.her) return '/her';
    if (token === TOKENS.him) return '/him';
    return '/her'; // default for testing without token
  }

  function handleSuccess() {
    navigate(resolveTarget());
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-10"
         style={{ background: 'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)' }}>
      {/* Title */}
      <div className="text-center animate-fadeInUp">
        <h1 className="font-display text-3xl text-text-primary mb-1">💚</h1>
        <p className="text-muted text-sm font-body">שנתיים</p>
      </div>

      {step === STEPS.BOX && (
        <div className="animate-fadeInUp stagger-1 opacity-0-init">
          <HorsePig onSwipe={() => setStep(STEPS.WIRE)} />
        </div>
      )}

      {step === STEPS.WIRE && (
        <div className="flex flex-col items-center gap-8 animate-fadeInUp">
          <div className="text-center">
            <p className="text-muted text-sm font-body">הקופסה נפתחת...</p>
            <p className="text-text-primary text-sm font-body mt-1">משוך את החוט לפתיחת הכספת</p>
          </div>
          <WireAnimation onPull={() => setStep(STEPS.DIAL)} />
        </div>
      )}

      {step === STEPS.DIAL && (
        <div className="w-full max-w-xs animate-fadeInUp">
          <div className="text-center mb-6">
            <p className="text-text-primary font-display text-lg">כספת</p>
            <p className="text-muted text-sm font-body mt-1">הכנס קוד כניסה</p>
          </div>
          <SafeDial onSuccess={handleSuccess} />
        </div>
      )}
    </div>
  );
}
