import './HowItWorks.css';

const steps = [
  {
    num:   '01',
    title: 'Download & install',
    desc:  'Click Download for Windows. The installer is under 150 MB. Run it, accept permissions, and Pointly is ready in under 3 minutes — no account required.',
    note:  'Windows 10 / 11 · < 3 min',
  },
  {
    num:   '02',
    title: 'Pick your mode',
    desc:  'Open Pointly and choose how you want to communicate — voice, sign language via webcam, air-cursor gestures, or text. Mix and match freely.',
    note:  'All modes can run simultaneously',
  },
  {
    num:   '03',
    title: 'Communicate naturally',
    desc:  'Ask questions, dictate text, control your desktop, or browse the web — entirely hands-free, in any language, with real-time AI responses.',
    note:  'Real-time · 50+ languages',
  },
];

const reqs = [
  { k: 'OS',       v: 'Windows 10 / 11 (64-bit)' },
  { k: 'RAM',      v: '4 GB min · 8 GB recommended' },
  { k: 'Storage',  v: '500 MB free' },
  { k: 'Webcam',   v: 'Required for Sign & Gesture' },
  { k: 'Mic',      v: 'Required for Voice mode' },
  { k: 'Internet', v: 'Required for cloud AI features' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="hiw-section">
      <div className="section">
        <div className="hiw__header">
          <span className="eyebrow">Getting started</span>
          <h2 className="heading-lg">Up and running in minutes.</h2>
        </div>

        {/* Steps */}
        <div className="hiw__steps">
          {steps.map((s, i) => (
            <div key={s.num} className="hiw__step">
              <span className="hiw__num">{s.num}</span>
              <div className="hiw__content">
                <h3 className="heading-md hiw__title">{s.title}</h3>
                <p className="body-sm hiw__desc">{s.desc}</p>
                <span className="hiw__note">{s.note}</span>
              </div>
              {i < steps.length - 1 && <div className="hiw__connector" />}
            </div>
          ))}
        </div>

        {/* System requirements */}
        <div className="hiw__reqs card">
          <p className="hiw__reqs-label eyebrow" style={{ marginBottom: '20px' }}>System requirements</p>
          <div className="hiw__reqs-grid">
            {reqs.map(r => (
              <div key={r.k} className="hiw__req">
                <span className="hiw__req-k">{r.k}</span>
                <span className="hiw__req-v">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
