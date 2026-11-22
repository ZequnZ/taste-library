import * as React from 'react';

export default function Controls({ config, values, onChange, onReset, componentName, usage }) {
  const [status, setStatus] = React.useState('');
  React.useEffect(() => setStatus(''), [usage]);
  const modified = config.controls.some(control => values[control.name] !== control.default);
  const copyUsage = async () => {
    try {
      await navigator.clipboard.writeText(usage);
      setStatus('Copied usage to clipboard.');
    } catch {
      setStatus('Clipboard unavailable. Select the usage example to copy it.');
    }
  };
  const renderControl = control => {
    const { name, type, label, unit = '' } = control;
    const id = `playground-${name}`;
    const value = values[name];
    const detail = control.scope === 'demo' ? <span className="playground-demo-label">Demo only</span> : <code>{name}</code>;
    if (type === 'boolean') return <label className="playground-check" key={name}>
      <input id={id} type="checkbox" checked={value} onChange={event => onChange(name, event.target.checked)} />
      <span><span>{label}</span>{detail}</span>
    </label>;
    return <div className="playground-row" key={name}>
      <label htmlFor={id}><span>{label}</span>{detail}</label>
      {type === 'range' ? <>
        <input id={id} type="range" min={control.min} max={control.max} step={control.step ?? 1} value={value} aria-valuetext={`${value}${unit}`} onChange={event => onChange(name, Number(event.target.value))} />
        <output htmlFor={id}>{value}{unit}</output>
      </> : <select id={id} value={value} onChange={event => onChange(name, event.target.value)}>
        {control.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>}
    </div>;
  };
  return <section className="playground" aria-labelledby="playground-heading">
    <div className="playground-head">
      <div><h2 id="playground-heading">Play with the props</h2><p>Changes apply live. Nothing is saved.</p></div>
      <button type="button" className="playground-button" onClick={onReset} disabled={!modified}>Reset defaults</button>
    </div>
    <div className="playground-fields">{config.controls.filter(control => control.type !== 'boolean').map(renderControl)}</div>
    <div className="playground-checks">{config.controls.filter(control => control.type === 'boolean').map(renderControl)}</div>
    <section className="playground-usage" aria-label={`${componentName} usage`}>
      <div className="playground-usage-head"><span>Usage <span className="playground-caption">{usage.includes('\n') ? 'Only changed props' : 'Using defaults'}</span></span><button type="button" className="playground-button" onClick={copyUsage}>Copy usage</button></div>
      <pre tabIndex="0"><code>{usage}</code></pre>
      <p className="playground-copy-status" role="status">{status}</p>
    </section>
    {config.notes?.length > 0 && <details className="playground-notes"><summary>More options & notes</summary>{config.notes.map(note => <p key={note}>{note}</p>)}</details>}
  </section>;
}
