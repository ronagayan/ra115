import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorsePig from '../components/entry/HorsePig';
import WireAnimation from '../components/entry/WireAnimation';
import SafeDial from '../components/entry/SafeDial';
import { TOKENS } from '../config';

// Stages:
//   pig          — pig is in front of the rope, occluding it. User swipes
//                  right to commit; the pig swings around its BR corner.
//   pig-hanging  — pig dangles from BR (now at top), rope is fully visible
//                  behind it and is interactable. Pulling the rope advances.
//   dial         — code keypad

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

  const showRope = stage === 'pig-hanging';

  return (
    <div
      className="min-h-dvh flex flex-col items-center p-6 gap-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)' }}
    >
      {/* Title */}
      <div className="text-center animate-fadeInUp pt-2">
        <h1 className="font-display text-3xl text-text-primary mb-1">💚</h1>
        <p className="text-muted text-sm font-body">שנתיים</p>
      </div>

      {/* Pig + rope canvas */}
      {(stage === 'pig' || stage === 'pig-hanging') && (
        <div
          className="relative w-full flex justify-center mt-2"
          style={{ minHeight: 540 }}
        >
          {/* The rope sits behind the pig. It's only visible once the pig
              has been swung out of the way (stage 'pig-hanging'). */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 transition-opacity duration-700"
            style={{ opacity: showRope ? 1 : 0, zIndex: 0 }}
          >
            <WireAnimation onPull={() => setStage('dial')} />
          </div>

          {/* The pig is in front. */}
          <div className="relative" style={{ zIndex: 10 }}>
            <HorsePig
              onSwipe={() => setStage('pig-hanging')}
              hanging={stage !== 'pig'}
            />
          </div>
        </div>
      )}

      {/* Dial stage */}
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
