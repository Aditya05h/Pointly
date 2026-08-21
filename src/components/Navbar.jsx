import { useState, useEffect } from 'react';
import './Navbar.css';

const smoothScroll = (id) => {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = [
    { label: 'Features',     id: '#features'    },
    { label: 'How it works', id: '#how-it-works' },
    { label: 'About',        id: '#about'        },
  ];

  const nav = (e, id) => {
    e.preventDefault();
    setOpen(false);
    smoothScroll(id);
  };

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
      <div className="nav__inner">

        {/* Logo */}
        <a href="#hero" className="nav__logo" onClick={e => nav(e, '#hero')}>
          <span className="nav__dot" />
          Pointly
        </a>

        {/* Links */}
        <nav className="nav__links" aria-label="Primary">
          {links.map(l => (
            <a key={l.id} href={l.id} className="nav__link" onClick={e => nav(e, l.id)}>
              {l.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <a href="#download" className="nav__cta btn btn-solid" onClick={e => nav(e, '#download')}>
          Download
        </a>

        {/* Hamburger */}
        <button className={`nav__burger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile */}
      {open && (
        <div className="nav__mobile">
          {links.map(l => (
            <a key={l.id} href={l.id} className="nav__mobile-link" onClick={e => nav(e, l.id)}>
              {l.label}
            </a>
          ))}
          <a href="#download" className="nav__mobile-cta btn btn-solid" onClick={e => nav(e, '#download')}>
            Download
          </a>
        </div>
      )}
    </header>
  );
}
