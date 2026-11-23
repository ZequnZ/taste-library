import * as React from "react";

/* Self-contained preview: Lucide icons + OrbitThemeToggle + tuning demo in one file. */

const CSS = `
  .otd { --bg:#f6f7f9; --card:#ffffff; --fg:#1b1f27; --muted:#5b6472; --line:#dfe3ea; --accent:#c26a00; --code:#eef0f4; }
  .otd[data-theme="dark"] { --bg:#12151b; --card:#1b2029; --fg:#eef1f6; --muted:#9aa4b4; --line:#2c3340; --accent:#9db7ff; --code:#0e1116; }
  * { box-sizing: border-box; }
  
  .otd { min-height:100vh; background:var(--bg); color:var(--fg); font:16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; transition: background .5s, color .5s; }
  main { max-width: 640px; margin: 0 auto; padding: 32px 20px 56px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  .lede { color: var(--muted); margin: 0 0 24px; }
  .stage { display:flex; justify-content:center; margin-bottom: 20px; }
  .card { width:100%; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:40px 20px 28px; display:flex; flex-direction:column; align-items:center; gap:16px; min-height: 260px; justify-content:center; transition: background .5s, border-color .5s; }
  .card button { --toggle-fg: var(--accent); --toggle-bg: var(--bg); --toggle-border: var(--line); transition: background .5s, color .5s; }
  .card button:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .state { margin:0; color:var(--muted); font-size:14px; }
  .panel { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px 20px; display:grid; gap:10px; margin-bottom:20px; }
  .row { display:grid; grid-template-columns: 110px 1fr 64px; gap:12px; align-items:center; font-size:14px; }
  .row output { text-align:right; color:var(--muted); font-variant-numeric: tabular-nums; }
  .row input[type=range] { width:100%; accent-color: var(--accent); }
  select { background:var(--bg); color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:6px 8px; font:inherit; grid-column: 2; }
  .checks { display:flex; flex-wrap:wrap; gap:8px 20px; font-size:14px; padding-top:4px; }
  .checks input { accent-color: var(--accent); }
  .code { background:var(--code); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:16px; }
  .codehead { display:flex; justify-content:space-between; align-items:center; padding:8px 14px; font-size:13px; color:var(--muted); border-bottom:1px solid var(--line); }
  .copy { background:transparent; color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:4px 10px; font:inherit; font-size:13px; cursor:pointer; }
  pre { margin:0; padding:14px; overflow:auto; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .hint { color:var(--muted); font-size:13px; margin:0; }
`;


/**
 * Default icons for OrbitThemeToggle: Lucide "sun" and "moon".
 * Lucide — ISC License, https://lucide.dev (https://github.com/lucide-icons/lucide)
 * In a project that already uses lucide-react you can pass its icons instead:
 *   import { Sun, Moon } from "lucide-react";
 *   <OrbitThemeToggle sunIcon={Sun} moonIcon={Moon} />
 */

export type IconProps = { size: number };
export type IconComponent = React.ComponentType<IconProps>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const LucideSun: IconComponent = ({ size }) => (
  <svg width={size} height={size} {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const LucideMoon: IconComponent = ({ size }) => (
  <svg width={size} height={size} {...base}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);


export interface OrbitThemeToggleProps {
  /** Controlled value. Omit for uncontrolled use. */
  isDark?: boolean;
  defaultDark?: boolean;
  onChange?: (isDark: boolean) => void;
  /** Diameter of the visible window, px. Default 72. */
  size?: number;
  /** Icon size, px. Default 32. */
  iconSize?: number;
  /** Distance from the pivot (below the window) to the icons, px. Larger = flatter arc. Default 44. */
  orbitRadius?: number;
  /** Angle between the sun and the moon on the orbit, degrees. 60–90 shows both mid-spin. Default 75. */
  orbitAngle?: number;
  /** Transition length, ms. Default 800. */
  duration?: number;
  /** Any CSS timing function. Default: overshoot, cubic-bezier(0.34, 1.56, 0.64, 1). */
  easing?: string;
  /** Cross-fade icons while they travel. Default true. */
  fade?: boolean;
  /** Counter-rotate icons so they stay upright while orbiting. Default true. */
  keepUpright?: boolean;
  /** Sun icon component (receives { size }). Default: Lucide sun. */
  sunIcon?: IconComponent;
  /** Moon icon component (receives { size }). Default: Lucide moon. */
  moonIcon?: IconComponent;
  className?: string;
  style?: React.CSSProperties;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Sun/moon theme toggle where the two icons sit on a circular orbit whose pivot is
 * below the button. Light -> dark rotates the orbit anticlockwise (sun leaves left,
 * moon arrives from the right); dark -> light reverses it. Both icons are visible
 * together mid-spin. Built on CSS transitions, so a click mid-flight reverses from the
 * current position instead of jumping.
 */
export function OrbitThemeToggle({
  isDark: controlled,
  defaultDark = false,
  onChange,
  size = 72,
  iconSize = 32,
  orbitRadius = 44,
  orbitAngle = 75,
  duration = 800,
  easing = "cubic-bezier(0.34, 1.56, 0.64, 1)",
  fade = true,
  keepUpright = true,
  sunIcon: Sun = LucideSun,
  moonIcon: Moon = LucideMoon,
  className,
  style,
}: OrbitThemeToggleProps) {
  const [inner, setInner] = React.useState(defaultDark);
  const isDark = controlled ?? inner;
  const reduced = usePrefersReducedMotion();

  const toggle = () => {
    const next = !isDark;
    if (controlled === undefined) setInner(next);
    onChange?.(next);
  };

  // Group angle: 0 in light mode, -orbitAngle (anticlockwise) in dark mode.
  const groupAngle = isDark ? -orbitAngle : 0;
  const sunAngle = 0; // sun rests at the top of the orbit
  const moonAngle = orbitAngle; // moon waits clockwise of the sun

  const moveMs = reduced ? 0 : duration;
  const fadeMs = reduced ? 150 : duration;
  const tMove = `transform ${moveMs}ms ${easing}`;
  const tFade = `opacity ${fadeMs}ms ${easing}`;

  const icon = (phi: number, visible: boolean, children: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `rotate(${phi}deg) translateY(${-orbitRadius}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: iconSize,
          height: iconSize,
          display: "grid",
          placeItems: "center",
          transform: `translate(-50%, -50%) rotate(${keepUpright ? -(groupAngle + phi) : 0}deg)`,
          transition: `${tMove}, ${tFade}`,
          // fade=false: rely on the clip window alone to hide the parked icon.
          opacity: fade ? (visible ? 1 : 0) : 1,
        }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      onClick={toggle}
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        padding: 0,
        border: "1px solid var(--toggle-border, rgba(127,127,127,.35))",
        borderRadius: "50%",
        background: "var(--toggle-bg, transparent)",
        color: "var(--toggle-fg, currentColor)",
        overflow: "hidden",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
    >
      {/* Pivot: horizontally centred, orbitRadius below the window centre. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: `calc(50% + ${orbitRadius}px)`,
          width: 0,
          height: 0,
          transformOrigin: "0 0",
          transform: `rotate(${groupAngle}deg)`,
          transition: tMove,
        }}
      >
        {icon(sunAngle, !isDark, <Sun size={iconSize} />)}
        {icon(moonAngle, isDark, <Moon size={iconSize} />)}
      </div>
    </button>
  );
}



const EASINGS: Record<string, string> = {
  "overshoot": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-in-out (cubic)": "cubic-bezier(0.65, 0, 0.35, 1)",
  "ease-out (soft stop)": "cubic-bezier(0.22, 1, 0.36, 1)",
  "linear": "linear",
};

// Must match the component's defaults, so the snippet lists only what you changed.
const DEFAULTS = { size: 72, orbitRadius: 44, orbitAngle: 75, duration: 800, easingKey: "overshoot", fade: true, keepUpright: true };

function Slider(props: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="row">
      <span>{props.label}</span>
      <input type="range" min={props.min} max={props.max} step={props.step ?? 1}
        value={props.value} onChange={(e) => props.onChange(Number(e.target.value))} />
      <output>{props.value}{props.unit ?? ""}</output>
    </label>
  );
}

export default function App() {
  const [isDark, setDark] = React.useState(false);
  const [size, setSize] = React.useState(DEFAULTS.size);
  const [orbitRadius, setRadius] = React.useState(DEFAULTS.orbitRadius);
  const [orbitAngle, setAngle] = React.useState(DEFAULTS.orbitAngle);
  const [duration, setDuration] = React.useState(DEFAULTS.duration);
  const [easingKey, setEasingKey] = React.useState(DEFAULTS.easingKey);
  const [fade, setFade] = React.useState(DEFAULTS.fade);
  const [keepUpright, setUpright] = React.useState(DEFAULTS.keepUpright);
  const [showOrbit, setShowOrbit] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const easing = EASINGS[easingKey];
  const iconSize = Math.round(size * 0.44);

  React.useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  const changed: string[] = [];
  if (size !== DEFAULTS.size) changed.push(`size={${size}}`, `iconSize={${iconSize}}`);
  if (orbitRadius !== DEFAULTS.orbitRadius) changed.push(`orbitRadius={${orbitRadius}}`);
  if (orbitAngle !== DEFAULTS.orbitAngle) changed.push(`orbitAngle={${orbitAngle}}`);
  if (duration !== DEFAULTS.duration) changed.push(`duration={${duration}}`);
  if (easingKey !== DEFAULTS.easingKey) changed.push(`easing="${easing}"`);
  if (fade !== DEFAULTS.fade) changed.push(`fade={${fade}}`);
  if (keepUpright !== DEFAULTS.keepUpright) changed.push(`keepUpright={${keepUpright}}`);
  const snippet = ["<OrbitThemeToggle", "  isDark={isDark}", "  onChange={setDark}", ...changed.map((c) => "  " + c), "/>"].join("\n");

  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard may be blocked in the viewer frame */ }
  };

  return (
    <div className="otd" data-theme={isDark ? "dark" : "light"}>
      <style>{CSS}</style>
      <main>
      <h1>Orbit theme toggle</h1>
      <p className="lede">
        Sun and moon ride one orbit whose pivot sits below the button. Click: light→dark turns it
        anticlockwise, dark→light back. Both icons overlap mid-spin. Click again mid-flight to
        reverse smoothly.
      </p>

      <section className="stage" aria-label="Preview">
        <div className="card">
          <div style={{ position: "relative", width: size, height: size }}>
            {showOrbit && (
              <div aria-hidden="true" style={{
                position: "absolute",
                // Orbit is centred on the pivot, orbitRadius below the window centre.
                left: size / 2 - orbitRadius, top: size / 2,
                width: orbitRadius * 2, height: orbitRadius * 2,
                borderRadius: "50%", border: "1px dotted var(--accent)", opacity: 0.5, pointerEvents: "none",
              }} />
            )}
            <OrbitThemeToggle
              isDark={isDark} onChange={setDark}
              size={size} iconSize={iconSize} orbitRadius={orbitRadius} orbitAngle={orbitAngle}
              duration={duration} easing={easing} fade={fade} keepUpright={keepUpright}
              style={showOrbit ? { overflow: "visible", border: "1px dashed var(--accent)" } : undefined}
            />
          </div>
          <p className="state">{isDark ? "Dark" : "Light"} mode</p>
        </div>
      </section>

      <section className="panel" aria-label="Tuning">
        <Slider label="Orbit angle" value={orbitAngle} min={20} max={160} unit="°" onChange={setAngle} />
        <Slider label="Orbit radius" value={orbitRadius} min={16} max={120} unit="px" onChange={setRadius} />
        <Slider label="Duration" value={duration} min={150} max={3000} step={50} unit="ms" onChange={setDuration} />
        <Slider label="Window size" value={size} min={44} max={120} unit="px" onChange={setSize} />
        <label className="row">
          <span>Easing</span>
          <select value={easingKey} onChange={(e) => setEasingKey(e.target.value)}>
            {Object.keys(EASINGS).map((k) => <option key={k}>{k}</option>)}
          </select>
          <output />
        </label>
        <div className="checks">
          <label><input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} /> Cross-fade</label>
          <label><input type="checkbox" checked={keepUpright} onChange={(e) => setUpright(e.target.checked)} /> Keep icons upright</label>
          <label><input type="checkbox" checked={showOrbit} onChange={(e) => setShowOrbit(e.target.checked)} /> Show orbit (demo only)</label>
        </div>
      </section>

      <section className="code">
        <div className="codehead">
          <span>{changed.length ? "Props (only what differs from the defaults)" : "Using the defaults"}</span>
          <button type="button" className="copy" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <pre>{snippet}</pre>
      </section>

      <p className="hint">
        Tip: set duration to 2000–3000 ms to inspect the overlap, and turn on “Show orbit” to see
        the parked icon outside the clip window. Icons: Lucide (ISC). Respects prefers-reduced-motion
        (falls back to a short fade).
      </p>
    </main>
    </div>
  );
}

