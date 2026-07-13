/**
 * Indus AI — Animated Loader Screen
 * Self-timed, no dependency on R3F progress
 * Logo matches the INDUS AI brand gradient used in Navbar and Overview
 */

import React, { useState, useEffect, useRef } from 'react';

const BOOT_MESSAGES = [
  'Initializing sensor network...',
  'Connecting to refinery subsystems...',
  'Loading AI diagnostic engine...',
  'Calibrating anomaly detectors...',
  'Establishing real-time telemetry...',
  'System ready.',
];

export default function Loader() {
  const [progress, setProgress]   = useState(0);
  const [msgIndex, setMsgIndex]   = useState(0);
  const [fadeOut, setFadeOut]     = useState(false);
  const [hidden, setHidden]       = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Animate progress 0→100 over ~2.2 seconds with an eased curve
  useEffect(() => {
    const DURATION = 2200; // ms
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * 100);
      setProgress(val);

      // Update boot message based on progress
      const idx = Math.min(Math.floor(eased * BOOT_MESSAGES.length), BOOT_MESSAGES.length - 1);
      setMsgIndex(idx);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Brief pause at 100% then fade out
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => setHidden(true), 700);
        }, 400);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  if (hidden) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #04060f 0%, #080c16 50%, #0a0820 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        transition: 'opacity 0.7s ease, visibility 0.7s ease',
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? 'hidden' : 'visible',
        overflow: 'hidden',
      }}
    >
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: '-100vw',
        backgroundImage:
          'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        animation: 'grid-move 8s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Radial glow behind logo */}
      <div style={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(0,102,255,0.04) 40%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'pulse-glow 3s ease-in-out infinite alternate',
      }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Logo Icon */}
        <img
          src="/indus-ai.svg"
          alt="Indus AI"
          style={{
            width: 80, height: 80, borderRadius: 22,
            marginBottom: 24,
            boxShadow: '0 0 40px rgba(0,212,255,0.5), 0 0 80px rgba(0,102,255,0.25)',
            animation: 'float 3s ease-in-out infinite',
            display: 'block',
          }}
        />

        {/* INDUS AI wordmark — same gradient as navbar */}
        <div style={{ marginBottom: 6, textAlign: 'center' }}>
          <div style={{
            fontSize: 48, fontWeight: 800, lineHeight: 1,
            fontFamily: "'Syne', sans-serif",
            background: 'linear-gradient(135deg, #1a73e8 0%, #00d4ff 50%, #00ff88 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
            letterSpacing: '-0.03em',
          }}>
            INDUS AI
          </div>
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 12, letterSpacing: '0.22em', fontWeight: 500,
          color: 'rgba(0,212,255,0.7)',
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 48,
        }}>
          INDUSTRIAL INTELLIGENCE PLATFORM
        </div>

        {/* Progress bar track */}
        <div style={{ width: 320, marginBottom: 14 }}>
          <div style={{
            width: '100%', height: 4,
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 4, overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Animated shimmer behind fill */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-bar 1.5s linear infinite',
            }} />
            {/* Fill */}
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #1a73e8, #00d4ff, #00ff88)',
              borderRadius: 4,
              boxShadow: '0 0 12px rgba(0,212,255,0.8)',
              transition: 'width 0.1s linear',
            }} />
          </div>

          {/* Percentage and message row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {BOOT_MESSAGES[msgIndex]}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              display: 'inline-block',
            }}>
              {progress}%
            </span>
          </div>
        </div>

        {/* Decorative dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(0,212,255,0.5)',
              animation: `blink-dot 1.2s ${i * 0.4}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Inline keyframes injected via style tag */}
      <style>{`
        @keyframes shimmer-bar {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}
