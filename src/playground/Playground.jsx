import * as React from 'react';
import { createPortal } from 'react-dom';
import Controls from './Controls.jsx';
import { defaultsFor, valuesFor, usageFor } from './config.js';

const demos = import.meta.glob('./demos/*.jsx', { eager: true, import: 'default' });

export default function Playground({ Component, entry, active, controlsHost }) {
  const config = entry.playground;
  const [values, setValues] = React.useState(() => defaultsFor(config));
  const componentName = entry.files[0].split('/').at(-1).replace(/\.jsx$/, '');
  const props = valuesFor(config, values);
  const Demo = demos[`./demos/${config.demo}.jsx`];
  return <>
    {Demo ? <Demo Component={Component} props={props} active={active} demo={valuesFor(config, values, 'demo')} /> : <Component {...props} active={active} />}
    {createPortal(<Controls config={config} values={values} componentName={componentName} usage={usageFor(componentName, config, values)} onChange={(name, value) => setValues(current => ({ ...current, [name]: value }))} onReset={() => setValues(defaultsFor(config))} />, controlsHost)}
  </>;
}
