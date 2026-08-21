import './About.css';

const stack = [
  'React', 'Node.js', 'MongoDB', 'Express',
  'MediaPipe', 'TensorFlow', 'OpenAI', 'Python',
  'Electron', 'WebSocket',
];

const values = [
  { icon: '—', label: 'Private',   desc: 'All processing happens on-device. No audio or video is ever sent to external servers.' },
  { icon: '—', label: 'Open',      desc: 'Built in public on GitHub. Open to contributors, forks, and community improvements.' },
  { icon: '—', label: 'Inclusive', desc: 'Designed for users with motor, speech, or hearing disabilities. WCAG 2.2 AA compliant.' },
  { icon: '—', label: 'Fast',      desc: 'Sub-second inference pipeline optimized for real-time interaction on standard hardware.' },
];

export default function About() {
  return (
    <section id="about">
      <div className="section">

        <div className="about__top">
          <div className="about__intro">
            <span className="eyebrow">About</span>
            <h2 className="heading-lg about__heading">
              Technology should work for everyone.
            </h2>
            <p className="body-lg about__body">
              Pointly started from a simple observation: millions of people with disabilities
              are locked out of technology built to help them. We combined computer vision,
              NLP, and real-time AI to create the most flexible human–computer interface
              ever shipped as a desktop app.
            </p>
            <p className="body-lg about__body">
              No cloud dependency for core features. No subscription. No account.
              Just an app that understands how you communicate.
            </p>
          </div>

          <div className="about__values">
            {values.map(v => (
              <div key={v.label} className="about__value">
                <div className="about__value-top">
                  <span className="about__value-label">{v.label}</span>
                </div>
                <p className="about__value-desc body-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="about__stack-section">
          <p className="eyebrow" style={{ marginBottom: '16px' }}>Built with</p>
          <div className="about__stack">
            {stack.map(s => (
              <span key={s} className="about__stack-item">{s}</span>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="about__team">
          <div className="about__member card">
            <div className="about__avatar">S</div>
            <div>
              <p className="about__member-name">Sammedpatil07</p>
              <p className="about__member-role body-sm">Lead Developer · AI Architect</p>
            </div>
          </div>
          <div className="about__member card">
            <div className="about__avatar about__avatar--dim">O</div>
            <div>
              <p className="about__member-name">Open Source</p>
              <p className="about__member-role body-sm">Community Contributors</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
