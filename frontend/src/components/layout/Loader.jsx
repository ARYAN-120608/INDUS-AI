import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';

export default function Loader() {
  const { progress, active } = useProgress();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!show) return null;

  return (
    <div className={`indus-loader ${!active && progress === 100 ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <div className="loader-logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="loader-title">INDUS <span className="text-gradient">AI</span></h1>
        <p className="loader-subtitle">INDUSTRIAL INTELLIGENCE PLATFORM</p>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="progress-text">
          {progress.toFixed(0)}% SYSTEM INITIALIZED
        </div>

        <div className="loader-grid"></div>
      </div>
    </div>
  );
}
