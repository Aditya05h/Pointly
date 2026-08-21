import { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const trailRef = useRef(null);

  // Actual mouse coords (snappy)
  const mouse  = useRef({ x: -100, y: -100 });
  // Lerped ring coords (smooth lag)
  const ring   = useRef({ x: -100, y: -100 });
  const rafRef = useRef(null);

  const [clicked, setClicked]   = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hidden, setHidden]     = useState(false);

  useEffect(() => {
    const dot  = dotRef.current;
    const rin  = ringRef.current;
    const trl  = trailRef.current;
    if (!dot || !rin || !trl) return;

    // ── Move ──────────────────────────────
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // Dot snaps instantly
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      trl.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

      // Check hover target
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isHover = el?.closest('a, button, [data-cursor-hover], input, textarea, select');
      setHovering(!!isHover);
    };

    // ── Click ─────────────────────────────
    const onClick = () => {
      setClicked(true);
      setTimeout(() => setClicked(false), 400);
    };

    // ── Leave/Enter viewport ──────────────
    const onLeave  = () => setHidden(true);
    const onEnter  = () => setHidden(false);

    // ── RAF: Lerp ring position ───────────
    const lerp = (a, b, t) => a + (b - a) * t;
    const FACTOR = 0.11; // smaller = more lag

    const animate = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, FACTOR);
      ring.current.y = lerp(ring.current.y, mouse.current.y, FACTOR);
      rin.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    window.addEventListener('mousemove',  onMove);
    window.addEventListener('click',      onClick);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('click',      onClick);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      {/* ── Outer ring (lerped) ── */}
      <div
        ref={ringRef}
        className={[
          'cur-ring',
          hovering ? 'cur-ring--hover'  : '',
          clicked  ? 'cur-ring--click'  : '',
          hidden   ? 'cur-ring--hidden' : '',
        ].join(' ')}
      >
        {/* tick marks on ring for robotic feel */}
        <span className="cur-tick cur-tick--t" />
        <span className="cur-tick cur-tick--r" />
        <span className="cur-tick cur-tick--b" />
        <span className="cur-tick cur-tick--l" />
      </div>

      {/* ── Inner dot (snappy) ── */}
      <div
        ref={dotRef}
        className={[
          'cur-dot',
          hovering ? 'cur-dot--hover'  : '',
          clicked  ? 'cur-dot--click'  : '',
          hidden   ? 'cur-dot--hidden' : '',
        ].join(' ')}
      />

      {/* ── Click ripple (snappy) ── */}
      <div
        ref={trailRef}
        className={[
          'cur-ripple',
          clicked ? 'cur-ripple--fire' : '',
        ].join(' ')}
      />
    </>
  );
}
