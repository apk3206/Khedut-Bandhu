import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CropDiagnostics.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CROP_LIST = [
  'Wheat', 'Rice', 'Tomato', 'Groundnut', 'Castor', 'Cumin'
];

const SEVERITY_CONFIG = {
  'Critical': { color: '#ff4757', bg: 'rgba(255,71,87,0.12)', icon: '🔴' },
  'High':     { color: '#ff6b35', bg: 'rgba(255,107,53,0.12)', icon: '🟠' },
  'Moderate': { color: '#ffa502', bg: 'rgba(255,165,2,0.12)',  icon: '🟡' },
  'None':     { color: '#2ed573', bg: 'rgba(46,213,115,0.12)', icon: '🟢' },
  'Unknown':  { color: '#a4b0be', bg: 'rgba(164,176,190,0.12)',icon: '⚪' },
};

export default function CropDiagnostics() {
  const [crop, setCrop]         = useState('Wheat');
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [result, setResult]     = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState('checking');
  const [dragOver, setDragOver] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const fileRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Check AI service health ────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/ai/health`, { signal: AbortSignal.timeout(3000) });
        const d = await r.json();
        setAiStatus(d.model ? 'online' : 'no_model');
      } catch {
        setAiStatus('offline');
      }
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  // ── Scan step animation ────────────────────────────────────────────────
  useEffect(() => {
    if (analyzing) {
      setScanStep(0);
      intervalRef.current = setInterval(() => {
        setScanStep(s => (s < 4 ? s + 1 : s));
      }, 600);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [analyzing]);

  const SCAN_STEPS = [
    'Uploading image...',
    'Applying CLAHE preprocessing...',
    'Running neural network...',
    'Filtering by crop type...',
    'Generating expert advice...'
  ];

  // ── File handling ──────────────────────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Run prediction ─────────────────────────────────────────────────────
  const analyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('cropName', crop);

      const res  = await fetch(`${API_BASE}/api/ai/predict`, { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.error || 'Prediction failed');
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setScanStep(0);
  };

  const sev  = result ? (SEVERITY_CONFIG[result.dangerLevel] || SEVERITY_CONFIG['Unknown']) : null;
  const conf = result ? parseFloat(result.confidence_val || result.confidence) : 0;

  // ── Gauge math (r=58 → circumference≈364) ─────────────────────────────
  const R  = 58;
  const C  = 2 * Math.PI * R;
  const dashOffset = C - (C * conf / 100);
  const gaugeColor = conf >= 70 ? '#2ed573' : conf >= 40 ? '#ffa502' : '#ff4757';

  return (
    <div className="diag-root">

      {/* ── Header ── */}
      <div className="diag-topbar">
        <div className="diag-title-block">
          <div className="diag-icon">🌿</div>
          <div>
            <h1 className="diag-title">AI Crop Diagnostics</h1>
            <p className="diag-subtitle">Khedut Bandhu Expert System v3.0</p>
          </div>
        </div>

        <div className={`ai-status-pill ${aiStatus}`}>
          <span className="status-dot" />
          <span>
            {aiStatus === 'online'   && 'AI Online'}
            {aiStatus === 'offline'  && 'AI Offline'}
            {aiStatus === 'no_model' && 'Model Missing'}
            {aiStatus === 'checking' && 'Connecting...'}
          </span>
        </div>
      </div>

      <div className="diag-body">

        {/* ── LEFT PANEL ── */}
        <div className="diag-left">

          {/* Crop selector */}
          <div className="card crop-card">
            <div className="card-label">SELECT CROP</div>
            <div className="crop-grid">
              {CROP_LIST.map(c => (
                <button
                  key={c}
                  className={`crop-btn ${crop === c ? 'active' : ''}`}
                  onClick={() => setCrop(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Upload zone */}
          <div
            className={`card upload-card ${dragOver ? 'drag-over' : ''} ${preview ? 'has-image' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !preview && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />

            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="Crop" className="preview-img" />
                {analyzing && (
                  <>
                    <div className="scan-grid" />
                    <div className="scan-laser" />
                    <div className="scan-corners">
                      <span /><span /><span /><span />
                    </div>
                  </>
                )}
                <div className="preview-badge">{crop}</div>
              </div>
            ) : (
              <div className="upload-empty">
                <div className="upload-icon-wrap">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="upload-label">Drop image here or click to browse</p>
                <p className="upload-hint">JPG, PNG, WEBP — High-res preferred</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="action-row">
            {preview && !analyzing && !result && (
              <button 
                className="btn-analyze" 
                onClick={analyze} 
                disabled={aiStatus !== 'online'}
                style={{ opacity: aiStatus === 'online' ? 1 : 0.6 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                {aiStatus === 'online' ? 'Run Expert Diagnosis' : 
                 aiStatus === 'checking' ? 'Connecting to AI...' :
                 aiStatus === 'no_model' ? 'AI Model Missing (Click Reset)' :
                 'AI Engine Offline'}
              </button>
            )}
            {(preview || result) && !analyzing && (
              <button className="btn-reset" onClick={reset}>Reset</button>
            )}
          </div>

          {/* Scan progress */}
          {analyzing && (
            <div className="card scan-progress-card">
              <div className="scan-header">
                <div className="scan-spinner" />
                <span>NEURAL ENGINE ACTIVE</span>
              </div>
              <div className="scan-steps">
                {SCAN_STEPS.map((s, i) => (
                  <div key={i} className={`scan-step ${i <= scanStep ? 'done' : ''} ${i === scanStep ? 'current' : ''}`}>
                    <span className="step-dot" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="diag-right">

          {!result && !analyzing && (
            <div className="card empty-state">
              <div className="empty-icon">🔬</div>
              <h3>Expert Diagnostic System Ready</h3>
              <p>Select a crop, upload a clear photo of the affected leaf or plant, then click <strong>Run Expert Diagnosis</strong>.</p>
              <div className="tips-grid">
                <div className="tip"><span>💡</span><p>Use natural daylight for best accuracy</p></div>
                <div className="tip"><span>📸</span><p>Focus on the affected area clearly</p></div>
                <div className="tip"><span>🌿</span><p>One leaf per image recommended</p></div>
                <div className="tip"><span>📏</span><p>Minimum 500×500 pixel resolution</p></div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="card error-card">
              <div className="error-icon">⚠️</div>
              <h3>Analysis Failed</h3>
              <p>{result.error}</p>
              <button className="btn-reset" onClick={reset}>Try Again</button>
            </div>
          )}

          {result && !result.error && (
            <div className="results-panel">

              {/* Result header */}
              <div className="card result-header-card" style={{ borderLeft: `4px solid ${sev.color}` }}>
                <div className="result-header-top">
                  <div>
                    <div className="result-crop-tag">{crop} Disease</div>
                    <h2 className="result-disease-name">{result.disease}</h2>
                    <p className="result-identification">{result.identification}</p>
                  </div>
                  <div className="severity-badge" style={{ background: sev.bg, color: sev.color }}>
                    {sev.icon} {result.dangerLevel}
                  </div>
                </div>

                {/* Advisory warnings */}
                {result.advisory?.length > 0 && (
                  <div className="advisory-box">
                    {result.advisory.map((a, i) => (
                      <div key={i} className="advisory-item">⚠️ {a}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gauge + Top 3 */}
              <div className="metrics-row">

                {/* Accuracy Gauge */}
                <div className="card gauge-card">
                  <div className="card-label">CONFIDENCE SCORE</div>
                  <div className="gauge-wrap">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
                      <circle
                        cx="70" cy="70" r={R}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={C}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 70 70)"
                        style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }}
                        filter={`drop-shadow(0 0 6px ${gaugeColor})`}
                      />
                      <text x="70" y="65" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Outfit,sans-serif">
                        {result.confidence}
                      </text>
                      <text x="70" y="82" textAnchor="middle" fill={gaugeColor} fontSize="8" fontWeight="700" fontFamily="Outfit,sans-serif" letterSpacing="1">
                        ACCURACY
                      </text>
                    </svg>
                  </div>

                  {/* Quality stats */}
                  <div className="quality-row">
                    <div className={`quality-chip ${result.quality?.is_dark ? 'warn' : 'pass'}`}>
                      {result.quality?.is_dark ? '🌑' : '☀️'} Light
                    </div>
                    <div className={`quality-chip ${result.quality?.is_blurry ? 'warn' : 'pass'}`}>
                      {result.quality?.is_blurry ? '🌫️' : '🔍'} Focus
                    </div>
                  </div>
                </div>

                {/* Top 3 predictions */}
                {result.top3 && (
                  <div className="card top3-card">
                    <div className="card-label">TOP PREDICTIONS</div>
                    {result.top3.map((t, i) => {
                      const pct = parseFloat(t.confidence);
                      return (
                        <div key={i} className={`top3-item ${i === 0 ? 'top3-first' : ''}`}>
                          <div className="top3-rank">#{i + 1}</div>
                          <div className="top3-info">
                            <div className="top3-name">{t.disease}</div>
                            <div className="top3-bar-bg">
                              <div
                                className="top3-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: i === 0 ? '#2ed573' : 'rgba(255,255,255,0.2)'
                                }}
                              />
                            </div>
                          </div>
                          <div className="top3-pct" style={{ color: i === 0 ? '#2ed573' : '#a4b0be' }}>
                            {t.confidence}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Treatment & Prevention */}
              <div className="treatment-row">
                <div className="card treatment-card">
                  <div className="card-label">💊 TREATMENT PLAN</div>
                  <p>{result.treatment}</p>
                </div>
                <div className="card prevention-card">
                  <div className="card-label">🛡️ PREVENTION</div>
                  <p>{result.prevention}</p>
                </div>
              </div>

              {/* New scan button */}
              <button className="btn-new-scan" onClick={reset}>
                🔄 New Diagnosis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
