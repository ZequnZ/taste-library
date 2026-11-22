import * as React from 'react';
import './OrbitThemeToggle.css';

/*
 * Bundled sun/moon SVGs from Lucide: https://lucide.dev
 * ISC License
 * Copyright (c) 2026 Lucide Icons and Contributors
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * Moon is derived from Feather, under the MIT License (MIT).
 * Copyright (c) 2013-present Cole Bemis
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const iconBase = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

function LucideSun({ size }) {
  return <svg width={size} height={size} {...iconBase}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>;
}

function LucideMoon({ size }) {
  return <svg width={size} height={size} {...iconBase}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(() =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  React.useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Sun and moon share a pivot below the circular window. A mid-flight click
 * reverses the CSS transition without jumping. No props are required.
 *
 * isDark / onChange: controlled theme state; defaultDark: initial local state.
 * active: optional preview override (release it with undefined).
 * size / iconSize / orbitRadius: pixels; orbitAngle: degrees; duration: ms.
 * easing: CSS timing function; fade / keepUpright: motion options.
 * sunIcon / moonIcon: optional components receiving { size }.
 * Set --accent, --toggle-bg and --toggle-border on an ancestor to theme it.
 * The switch reports state; the consuming app decides how to apply its theme.
 */
export default function OrbitThemeToggle({
  isDark: controlled,
  defaultDark = false,
  onChange,
  active,
  size = 72,
  iconSize = 32,
  orbitRadius = 44,
  orbitAngle = 75,
  duration = 800,
  easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  fade = true,
  keepUpright = true,
  sunIcon: Sun = LucideSun,
  moonIcon: Moon = LucideMoon,
  className = '',
  style,
}) {
  const [inner, setInner] = React.useState(defaultDark);
  const isDark = active ?? controlled ?? inner;
  const reduced = usePrefersReducedMotion();
  const groupAngle = isDark ? -orbitAngle : 0;

  const toggle = () => {
    const next = !isDark;
    if (controlled === undefined) setInner(next);
    onChange?.(next);
  };

  const icon = (angle, visible, children) => (
    <span className="orbit-theme-toggle-position" style={{
      transform: `rotate(${angle}deg) translateY(${-orbitRadius}px)`,
    }}>
      <span className="orbit-theme-toggle-icon" style={{
        transform: `translate(-50%, -50%) rotate(${keepUpright ? -(groupAngle + angle) : 0}deg)`,
        opacity: fade ? Number(visible) : 1,
      }}>{children}</span>
    </span>
  );

  return (
    <button type="button" role="switch" aria-checked={isDark} aria-label="Dark mode"
      onClick={toggle} className={`orbit-theme-toggle ${className}`.trim()}
      style={{
        '--orbit-theme-toggle-size': `${size}px`,
        '--orbit-theme-toggle-icon-size': `${iconSize}px`,
        '--orbit-theme-toggle-radius': `${orbitRadius}px`,
        '--orbit-theme-toggle-duration': `${reduced ? 0 : duration}ms`,
        '--orbit-theme-toggle-easing': easing,
        ...style,
      }}>
      <span className="orbit-theme-toggle-pivot" style={{ transform: `rotate(${groupAngle}deg)` }}>
        {icon(0, !isDark, <Sun size={iconSize} />)}
        {icon(orbitAngle, isDark, <Moon size={iconSize} />)}
      </span>
    </button>
  );
}
