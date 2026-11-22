import * as React from 'react';

// Gallery-only anatomy guide and state label; neither changes the element files.
export default function OrbitDemo({ Component, props, active, demo }) {
  const [dark, setDark] = React.useState(false);
  const selected = active ?? dark;
  const { size, orbitRadius } = props;
  const guide = demo.showOrbit;
  return <div className="orbit-demo">
    <div className="orbit-demo-window" data-show-orbit={guide} style={{
      width: guide ? Math.max(size, orbitRadius * 2) : size,
      height: guide ? size / 2 + orbitRadius * 2 : size,
      '--demo-size': `${size}px`,
      '--demo-radius': `${orbitRadius}px`,
    }}>
      {guide && <span className="orbit-demo-guide" aria-hidden="true"><span /></span>}
      <Component {...props} active={active} isDark={dark} onChange={setDark} className={guide ? 'orbit-demo-unclipped' : ''} />
    </div>
    <p className="orbit-demo-state">{selected ? 'Dark' : 'Light'} mode{active === true ? ' · Held active' : ''}</p>
  </div>;
}
