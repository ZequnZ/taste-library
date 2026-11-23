import * as React from "react";
import { LucideSun, LucideMoon, type IconComponent } from "./icons";

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

export default OrbitThemeToggle;
