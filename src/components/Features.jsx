import './Features.css';

const features = [
  {
    tag:   '01',
    title: 'Voice Interaction',
    desc:  'Speak in 50+ languages. Real-time transcription, context understanding, and wake-word activation — works even in noisy environments.',
    details: ['Wake-word', 'Continuous listening', '50+ languages'],
  },
  {
    tag:   '02',
    title: 'Sign Language',
    desc:  'Webcam-powered sign language recognition. ASL, ISL, and BSL translated to text and speech instantly, without any extra hardware.',
    details: ['ASL · ISL · BSL', 'Real-time', 'No hardware'],
  },
  {
    tag:   '03',
    title: 'Air-Cursor',
    desc:  'Control your screen by pointing in mid-air. Pointly tracks hand movements through any standard webcam with under 20ms latency.',
    details: ['MediaPipe', '< 20ms latency', 'Any webcam'],
  },
  {
    tag:   '04',
    title: 'Smart Text',
    desc:  'Type naturally. AI-powered grammar correction, contextual suggestions, and predictive completions that learn your writing style.',
    details: ['NLP', 'Autocomplete', 'Context memory'],
  },
  {
    tag:   '05',
    title: 'Multilingual',
    desc:  'Break language barriers automatically. Pointly detects your language mid-conversation and translates responses without interruption.',
    details: ['Auto-detect', 'Live translation', '50+ languages'],
  },
  {
    tag:   '06',
    title: 'Accessibility',
    desc:  'Built ground-up for users with motor, speech, or hearing disabilities. Every feature meets WCAG 2.2 AA and ADA compliance standards.',
    details: ['WCAG 2.2 AA', 'ADA compliant', 'Screen reader'],
  },
];

export default function Features() {
  return (
    <section id="features">
      <div className="section">
        <div className="feat__header">
          <span className="eyebrow">Capabilities</span>
          <h2 className="heading-lg">Built for every human.</h2>
          <p className="body-lg feat__sub">
            Six ways to interact — one intelligent assistant.
          </p>
        </div>

        <div className="feat__grid">
          {features.map(f => (
            <div key={f.tag} className="feat__card card">
              <span className="feat__tag">{f.tag}</span>
              <h3 className="heading-md feat__title">{f.title}</h3>
              <p className="body-sm feat__desc">{f.desc}</p>
              <div className="feat__details">
                {f.details.map(d => (
                  <span key={d} className="feat__detail">{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
