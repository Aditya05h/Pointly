import './Download.css';

const checklist = [
  'Voice recognition in 50+ languages',
  'Real-time sign language (ASL, ISL, BSL)',
  'Air-cursor & gesture via webcam',
  'Smart text with AI completion',
  'Works offline after first run',
  'Automatic background updates',
  'Zero telemetry — fully private',
  'WCAG 2.2 AA compliant',
];

export default function Download() {
  return (
    <section id="download" className="dl-section">
      <div className="section">

        <div className="dl__header">
          <span className="eyebrow">Download</span>
          <h2 className="heading-lg">Get Pointly.</h2>
          <p className="body-lg dl__sub">Free for personal use. No account, no subscription.</p>
        </div>

        {/* Main card */}
        <div className="dl__card card">
          <div className="dl__card-left">
            <div className="dl__app-info">
              <span className="dl__dot" />
              <div>
                <p className="dl__app-name">Pointly for Windows</p>
                <p className="body-sm dl__app-meta">v1.0.0 · 148 MB · Windows 10/11</p>
              </div>
            </div>
            <p className="body-sm dl__desc">
              Full Pointly experience — all four interaction modes, multilingual support,
              offline processing, and automatic updates included.
            </p>
            <div className="dl__file-row">
              <span className="dl__file-item"><strong>Platform</strong> Windows 10 / 11 (x64)</span>
              <span className="dl__file-item"><strong>Size</strong> ~148 MB</span>
              <span className="dl__file-item"><strong>License</strong> Free · Personal Use</span>
              <span className="dl__file-item"><strong>Updated</strong> August 2026</span>
            </div>
          </div>

          <div className="dl__card-right">
            <a href="#" className="dl__cta-btn btn" onClick={e => e.preventDefault()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download for Windows
            </a>
            <p className="dl__secure">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              SHA-256 verified · Digitally signed
            </p>
            <div className="dl__alt-links">
              <a href="#" className="dl__alt-link" onClick={e => e.preventDefault()}>Release notes</a>
              <span>·</span>
              <a href="#" className="dl__alt-link" onClick={e => e.preventDefault()}>Install guide</a>
              <span>·</span>
              <a href="#" className="dl__alt-link" onClick={e => e.preventDefault()}>Older versions</a>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="dl__checklist">
          {checklist.map(item => (
            <div key={item} className="dl__check">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="dl__note">
          A webcam is required for Sign Language and Air-Cursor modes. A microphone is required for Voice mode.
          All processing runs locally — no audio or video leaves your device.
        </p>

      </div>
    </section>
  );
}
