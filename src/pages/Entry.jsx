import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HorsePig from '../components/entry/HorsePig';
import WireAnimation from '../components/entry/WireAnimation';
import SafeDial from '../components/entry/SafeDial';
import { TOKENS } from '../config';

// Stage flow:
//   pig                 — pig hangs on its hook; user swipes right
//   pig-hanging         — pig has swung off and is dangling from corner;
//                         rope is hidden until first touch
//   rope-and-pig        — rope visible, pig still swaying, user pulls rope
//   dial                — code keypad

export default function Entry() {
  const [stage, setStage] = useState('pig');
  const [ropeVisible, setRopeVisible] = useState(false);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // After the pig swings, wait for ANY touch before revealing the rope.
  useEffect(() => {
    if (stage !== 'pig-hanging') return;
    function onTouch() {
      setRopeVisible(true);
      setStage('rope-and-pig');
    }
    // capture the very first pointerdown on the page
    window.addEventListener('pointerdown', onTouch, { once: true });
    return () => window.removeEventListener('pointerdown', onTouch);
  }, [stage]);

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
      className="min-h-dvh flex flex-col items-center justify-center p-6 gap-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d1f16 0%, #1a3a2a 100%)' }}
    >
      {/* Title */}
      <div className="text-center animate-fadeInUp">
        <h1 className="font-display text-3xl text-text-primary mb-1">💚</h1>
        <p className="text-muted text-sm font-body">שנתיים</p>
      </div>

      {/* Pig + rope stage. Pig stays mounted; rope is layered behind it
          once the user touches the screen. */}
      {(stage === 'pig' || stage === 'pig-hanging' || stage === 'rope-and-pig') && (
        <div className="relative w-full max-w-sm flex justify-center" style={{ minHeight: 360 }}>
          {/* Rope behind the pig */}
          {ropeVisible && (
            <div
              className="absolute left-1/2 -translate-x-1/2 z-0 animate-fadeInUp"
              style={{ top: -10 }}
            >
              <WireAnimation onPull={() => setStage('dial')} />
            </div>
          )}

          {/* The pig in its frame */}
          <div className="relative z-10">
            <HorsePig
              onSwipe={() => setStage('pig-hanging')}
              hanging={stage !== 'pig'}
            />
          </div>

          {/* Hint to touch the screen once pig is dangling */}
          {stage === 'pig-hanging' && (
            <div
              className="absolute inset-x-0 bottom-2 text-center text-muted text-xs font-body italic animate-pulse z-20 pointer-events-none"
            >
              ↳ הקש בכל מקום כדי לחשוף את החוט
            </div>
          )}
        </div>
      )}

      {/* Dial stage */}
      {stage === 'dial' && (
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
