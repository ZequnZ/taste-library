const identifier = /^[A-Za-z_$][\w$]*$/;
const types = new Set(['range', 'select', 'boolean']);

// Shared by the gallery and validator: this metadata never enters copied sources.
export function validatePlayground(config) {
  if (!config || !Array.isArray(config.controls) || !config.controls.length) throw new Error('Playground needs controls');
  const names = new Set();
  for (const control of config.controls) {
    const { name, label, type, default: value, scope = 'prop' } = control;
    if (typeof name !== 'string' || !identifier.test(name) || names.has(name)) throw new Error(`Invalid or duplicate playground name: ${name}`);
    names.add(name);
    if (typeof label !== 'string' || !label.trim() || !types.has(type)) throw new Error(`Invalid playground control: ${name}`);
    if (!['prop', 'demo'].includes(scope)) throw new Error(`Invalid playground scope: ${name}`);
    if (type === 'boolean' && typeof value !== 'boolean') throw new Error(`Boolean default required: ${name}`);
    if (type === 'range') {
      const { min, max, step = 1 } = control;
      if (![min, max, step, value].every(Number.isFinite) || min >= max || step <= 0 || value < min || value > max) throw new Error(`Invalid playground range: ${name}`);
      if (Math.abs((value - min) / step - Math.round((value - min) / step)) > 1e-8) throw new Error(`Default must align with step: ${name}`);
      if (control.unit !== undefined && typeof control.unit !== 'string') throw new Error(`Invalid playground unit: ${name}`);
    }
    if (type === 'select') {
      const options = control.options;
      if (!Array.isArray(options) || !options.length || options.some(option => typeof option.value !== 'string' || typeof option.label !== 'string' || !option.label.trim()) || new Set(options.map(option => option.value)).size !== options.length || !options.some(option => option.value === value)) throw new Error(`Invalid playground options: ${name}`);
    }
  }
  if (config.demo !== undefined && !/^[a-z][a-z0-9-]*$/.test(config.demo)) throw new Error('Invalid playground demo');
  if (config.controls.some(control => control.scope === 'demo') && !config.demo) throw new Error('Demo controls need a demo adapter');
  if (config.notes !== undefined && (!Array.isArray(config.notes) || config.notes.some(note => typeof note !== 'string' || !note.trim()))) throw new Error('Invalid playground notes');
}

export const defaultsFor = config => Object.fromEntries(config.controls.map(control => [control.name, control.default]));

export function valuesFor(config, values, scope = 'prop') {
  return Object.fromEntries(config.controls.filter(control => (control.scope ?? 'prop') === scope).map(control => [control.name, values[control.name]]));
}

export function usageFor(componentName, config, values) {
  const props = config.controls.filter(control => control.scope !== 'demo' && values[control.name] !== control.default);
  if (!props.length) return `<${componentName} />`;
  return [`<${componentName}`, ...props.map(control => `  ${control.name}={${JSON.stringify(values[control.name])}}`), '/>'].join('\n');
}
