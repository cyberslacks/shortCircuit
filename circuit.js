// Shared circuit model and modified nodal analysis solver (CommonJS for Node and browser).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CircuitLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const definitions = {
    resistor: { label: 'Resistor', symbol: 'R', terminals: ['a', 'b'], color: '#8b9cff' },
    voltage: { label: 'Battery', symbol: 'V', terminals: ['+', '−'], color: '#f4b860' },
    current: { label: 'Current source', symbol: 'I', terminals: ['a', 'b'], color: '#58d6ba' },
    ground: { label: 'Ground', symbol: '⏚', terminals: ['gnd'], color: '#58d6ba' },
    lamp: { label: 'Lamp', symbol: 'L', terminals: ['a', 'b'], color: '#f4b860' }
  };
  const defaults = { resistor: { resistance: 1000 }, voltage: { voltage: 5 }, current: { current: 0.005 }, ground: {}, lamp: { resistance: 100 } };
  function createCircuit(name = 'Untitled circuit') { return { name, components: [], wires: [], nextId: 1 }; }
  function addComponent(circuit, type, options = {}) {
    if (!definitions[type]) throw new Error(`Unknown component type: ${type}`);
    const id = options.id || `c${circuit.nextId++}`;
    const item = { id, type, x: options.x ?? 400, y: options.y ?? 260, ...defaults[type], ...options };
    delete item.terminals;
    if (circuit.components.some(c => c.id === id)) throw new Error(`Component ${id} already exists`);
    circuit.components.push(item); return item;
  }
  function terminalKey(ref) { return `${ref.component}.${ref.terminal}`; }
  function connect(circuit, from, to) {
    for (const ref of [from, to]) {
      const part = circuit.components.find(c => c.id === ref.component);
      if (!part || !definitions[part.type].terminals.includes(ref.terminal)) throw new Error(`Invalid terminal ${terminalKey(ref)}`);
    }
    if (terminalKey(from) === terminalKey(to)) throw new Error('A wire must join two different terminals');
    const exists = circuit.wires.find(w => (terminalKey(w.from) === terminalKey(from) && terminalKey(w.to) === terminalKey(to)) || (terminalKey(w.from) === terminalKey(to) && terminalKey(w.to) === terminalKey(from)));
    if (exists) return exists;
    const wire = { from: { ...from }, to: { ...to } };
    circuit.wires.push(wire);
    return wire;
  }
  function solve(circuit) {
    const parts = circuit.components;
    const parent = new Map();
    const find = x => { if (!parent.has(x)) parent.set(x, x); let p = parent.get(x); if (p !== x) parent.set(x, p = find(p)); return p; };
    const union = (a,b) => { a=find(a); b=find(b); if(a!==b) parent.set(b,a); };
    for (const p of parts) for (const t of definitions[p.type].terminals) find(`${p.id}.${t}`);
    for (const w of circuit.wires) union(terminalKey(w.from), terminalKey(w.to));
    const grounds = parts.filter(p => p.type === 'ground');
    if (!grounds.length) throw new Error('Add a ground symbol to define the 0 V reference.');
    const ground = find(`${grounds[0].id}.gnd`);
    const nodeNames = new Map();
    for (const p of parts) for (const t of definitions[p.type].terminals) { const n=find(`${p.id}.${t}`); if(n!==ground && !nodeNames.has(n)) nodeNames.set(n, `N${nodeNames.size+1}`); }
    const nodes=[...nodeNames.keys()], nodeIndex=new Map(nodes.map((n,i)=>[n,i]));
    const vs = parts.filter(p=>p.type==='voltage');
    const size=nodes.length+vs.length;
    if(!size) throw new Error('Add a source and components before running the simulation.');
    const A=Array.from({length:size},()=>Array(size).fill(0)), z=Array(size).fill(0);
    const ni=ref=>{const k=find(typeof ref==='string'?ref:terminalKey(ref)); return k===ground?-1:nodeIndex.get(k);};
    const stampConductance=(a,b,g)=>{const i=ni(a),j=ni(b);if(i>=0)A[i][i]+=g;if(j>=0)A[j][j]+=g;if(i>=0&&j>=0){A[i][j]-=g;A[j][i]-=g;}};
    for(const p of parts){
      if(p.type==='resistor'||p.type==='lamp'){const r=Number(p.resistance);if(!(r>0))throw new Error(`${p.id} needs a positive resistance.`);stampConductance(`${p.id}.a`,`${p.id}.b`,1/r);}
      if(p.type==='current'){const a=ni(`${p.id}.a`),b=ni(`${p.id}.b`),v=Number(p.current);if(a>=0)z[a]-=v;if(b>=0)z[b]+=v;}
    }
    vs.forEach((p,k)=>{const row=nodes.length+k,a=ni(`${p.id}.+`),b=ni(`${p.id}.−`);if(a>=0)A[a][row]+=1;if(b>=0)A[b][row]-=1;if(a>=0)A[row][a]+=1;if(b>=0)A[row][b]-=1;z[row]=Number(p.voltage);});
    // Pivoted Gauss-Jordan elimination also detects floating nodes and shorts.
    for(let c=0;c<size;c++){
      let pivot=c;for(let r=c+1;r<size;r++)if(Math.abs(A[r][c])>Math.abs(A[pivot][c]))pivot=r;
      if(Math.abs(A[pivot][c])<1e-12)throw new Error('Circuit is singular. Check for floating terminals, missing ground, or a shorted voltage source.');
      [A[c],A[pivot]]=[A[pivot],A[c]];[z[c],z[pivot]]=[z[pivot],z[c]];
      const d=A[c][c];for(let j=c;j<size;j++)A[c][j]/=d;z[c]/=d;
      for(let r=0;r<size;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<size;j++)A[r][j]-=f*A[c][j];z[r]-=f*z[c];}
    }
    const nodeVoltage=ref=>{const i=ni(ref);return i<0?0:z[i];};
    const results=parts.map(p=>{
      const row={id:p.id,type:p.type};
      if(p.type==='resistor'||p.type==='lamp'){row.voltage=nodeVoltage(`${p.id}.a`)-nodeVoltage(`${p.id}.b`);row.current=row.voltage/Number(p.resistance);row.power=row.voltage*row.current;}
      if(p.type==='voltage'){row.voltage=Number(p.voltage);row.current=z[nodes.length+vs.indexOf(p)];row.power=row.voltage*row.current;}
      if(p.type==='current'){row.current=Number(p.current);row.voltage=nodeVoltage(`${p.id}.a`)-nodeVoltage(`${p.id}.b`);row.power=row.voltage*row.current;}
      if(p.type==='ground')row.voltage=0;
      return row;
    });
    return {ok:true,circuit:circuit.name,ground:grounds[0].id,nodes:Object.fromEntries([...nodeNames].map(([key,name])=>[name,z[nodeIndex.get(key)]])),components:results,summary:`Solved ${results.length} components across ${nodes.length+1} nodes.`};
  }
  function terminalPosition(p, terminal) {
    if(p.type==='ground')return {x:p.x,y:p.y+34};
    return {x:p.x+(terminal==='a'||terminal==='+'?-56:56),y:p.y};
  }
  function toSvg(circuit) {
    const W=1000,H=600, byKey=ref=>{const p=circuit.components.find(x=>x.id===ref.component);return p&&terminalPosition(p,ref.terminal);};
    const paths=circuit.wires.map(w=>{const a=byKey(w.from),b=byKey(w.to);if(!a||!b)return '';const mid=(a.x+b.x)/2;return `<path d="M${a.x} ${a.y} H${mid} V${b.y} H${b.x}"/>`;}).join('');
    const shapes=circuit.components.map(p=>{const d=definitions[p.type],x=p.x,y=p.y;let symbol='';
      if(p.type==='resistor')symbol=`<path d="M${x-35} ${y}h10l8-12 12 24 12-24 12 24 12-12h9"/>`;
      else if(p.type==='lamp')symbol=`<circle cx="${x}" cy="${y}" r="20"/><path d="M${x-13} ${y-13}l26 26m0-26l-26 26"/>`;
      else if(p.type==='voltage')symbol=`<path d="M${x-56} ${y}h34m44 0h34"/><path d="M${x-18} ${y-16}v32m12-9v-14"/>`;
      else if(p.type==='current')symbol=`<circle cx="${x}" cy="${y}" r="19"/><path d="M${x} ${y+11}v-22m0 0l-6 7m6-7l6 7"/>`;
      else symbol=`<path d="M${x-15} ${y+4}h30m-24 7h18m-12 7h6"/>`;
      const value=p.type==='resistor'?`${p.resistance>=1000?p.resistance/1000+' kΩ':p.resistance+' Ω'}`:p.type==='voltage'?`${p.voltage} V`:p.type==='current'?`${p.current*1000} mA`:p.type==='lamp'?`${p.resistance} Ω`:'';
      const term=definitions[p.type].terminals.map(t=>{const q=terminalPosition(p,t);return `<circle class="terminal" data-component="${p.id}" data-terminal="${t}" cx="${q.x}" cy="${q.y}" r="6"/>`;}).join('');
      return `<g class="part" data-id="${p.id}" style="--part:${d.color}">${term}<g class="symbol">${symbol}</g><text class="part-name" x="${x}" y="${y-32}">${d.label} · ${p.id}</text><text class="part-value" x="${x}" y="${y+42}">${value}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Circuit schematic"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#273246"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/><g class="wires">${paths}</g><g>${shapes}</g></svg>`;
  }
  return {definitions,createCircuit,addComponent,connect,solve,toSvg,terminalPosition};
});
