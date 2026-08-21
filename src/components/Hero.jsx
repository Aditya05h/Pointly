import './Hero.css';

const scroll = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

const modes = [
  { label: 'Voice',         icon: '↗' },
  { label: 'Sign Language', icon: '↗' },
  { label: 'Air-Cursor',    icon: '↗' },
  { label: 'Text Input',    icon: '↗' },
];

export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero__inner">

        <span className="eyebrow">v1.0.0 — Available for Windows</span>

        <h1 className="hero__title">
          Communicate without<br />
          <span className="hero__title-dim">limits.</span>
        </h1>

        <p className="hero__desc">
          Pointly is an AI assistant that understands voice, sign language,
          gestures, and text — making technology accessible to everyone.
        </p>

        {/* Primary CTA — centered */}
        <div className="hero__cta-group">
          <a
            href="#download"
            className="hero__download btn"
            onClick={e => { e.preventDefault(); scroll('#download'); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download for Windows
          </a>
          <a
            href="#features"
            className="btn btn-outline"
            onClick={e => { e.preventDefault(); scroll('#features'); }}
          >
            See features
          </a>
        </div>

        <p className="hero__meta">Free · Windows 10 / 11 · v1.0.0</p>

        {/* Mode pills */}
        <div className="hero__modes">
          {modes.map(m => (
            <div key={m.label} className="hero__mode">
              {m.label}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="hero__stat-num">4</span>
            <span className="hero__stat-label">Input modes</span>
          </div>
          <div className="hero__stat-div" />
          <div className="hero__stat">
            <span className="hero__stat-num">50+</span>
            <span className="hero__stat-label">Languages</span>
          </div>
          <div className="hero__stat-div" />
          <div className="hero__stat">
            <span className="hero__stat-num">99%</span>
            <span className="hero__stat-label">Accuracy</span>
          </div>
          <div className="hero__stat-div" />
          <div className="hero__stat">
            <span className="hero__stat-num">&lt;2s</span>
            <span className="hero__stat-label">Response</span>
          </div>
        </div>
      </div>
    </section>
  );
}
