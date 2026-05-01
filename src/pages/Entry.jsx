import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorsePig from '../components/entry/HorsePig';
import WireAnimation from '../components/entry/WireAnimation';
import SafeDial from '../components/entry/SafeDial';
import { TOKENS } from '../config';

// Stages:
//   pig   — picture is on screen, draggable. The rope sits behind it.
//   rope  — picture has been thrown off screen; rope is fully visible
//           and interactable.
//   dial  — code keypad

export default function Entry() {
  const [stage, setStage] = useState('pig');
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  function resolveTarget() {
    if (token === TOKENS.her) return '/her';
    if (token === TOKENS.him) return '/him';
    return '/her';
  }

  function handleSuccess() {
    navigate(resolveTarget() + window.location.search);
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center p-6 gap-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)' }}
    >
      <div className="text-center animate-fadeInUp pt-2">
        <h1 className="font-display text-3xl text-text-primary mb-1">💚</h1>
        <p className="text-muted text-sm font-body">שנתיים</p>
      </div>

      {(stage === 'pig' || stage === 'rope') && (
        <div
          className="relative w-full flex justify-center mt-4"
          style={{ minHeight: 380 }}
        >
          {/* Rope — always rendered. Visible behind/around the pig and
              fully interactable once the pig has been thrown. */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0"
            style={{
              zIndex: 0,
              opacity: stage === 'rope' ? 1 : 0.35,
              transition: 'opacity 600ms ease',
              pointerEvents: stage === 'rope' ? 'auto' : 'none',
            }}
          >
            <WireAnimation onPull={() => setStage('dial')} />
          </div>

          {/* Pig — only mounted before being thrown */}
          {stage === 'pig' && (
            <div className="relative" style={{ zIndex: 10 }}>
              <HorsePig onSwipe={() => setStage('rope')} />
            </div>
          )}
        </div>
      )}

      {stage === 'dial' && (
        <div className="w-full max-w-xs animate-fadeInUp mt-6">
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
