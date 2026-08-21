import './Footer.css';

const scroll = (id) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });

export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    { label: 'Features',     id: '#features'     },
    { label: 'How it works', id: '#how-it-works'  },
    { label: 'About',        id: '#about'         },
    { label: 'Download',     id: '#download'      },
    { label: 'GitHub',       href: 'https://github.com/Sammedpatil07/Pointly-Web', external: true },
  ];

  return (
    <footer className="footer">
      <div className="footer__inner wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#hero" className="footer__logo" onClick={e => { e.preventDefault(); scroll('#hero'); }}>
              <span className="footer__logo-dot" />
              Pointly
            </a>
            <p className="footer__tagline body-sm">
              AI assistant for voice, sign language, gesture, and text.
            </p>
          </div>

          <nav className="footer__nav">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href || l.id}
                className="footer__link"
                onClick={l.id ? e => { e.preventDefault(); scroll(l.id); } : undefined}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
              >
                {l.label}
                {l.external && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                )}
              </a>
            ))}
          </nav>
        </div>

        <div className="footer__bottom">
          <span className="footer__copy">© {year} Pointly. Built for accessibility.</span>
          <span className="footer__stack">React · Vite · Node.js · MongoDB</span>
        </div>
      </div>
    </footer>
  );
}
