// Shared circuit model and modified nodal analysis solver (CommonJS for Node and browser).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CircuitLab = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const definitions = {
    resistor: { label: 'Resistor', symbol: 'R', terminals: ['a', 'b'], color: '#8b9cff' },
    capacitor: { label: 'Capacitor', symbol: 'C', terminals: ['a', 'b'], color: '#8ac9ff' },
    electrolytic_capacitor: { label: 'Electrolytic capacitor', symbol: 'C+', terminals: ['+', '−'], color: '#8ac9ff' },
    supercap: { label: 'Supercapacitor', symbol: 'C+', terminals: ['+', '−'], color: '#8ac9ff' },
    inductor: { label: 'Inductor', symbol: 'L', terminals: ['a', 'b'], color: '#c2a0ff' },
    diode: { label: 'Diode', symbol: 'D', terminals: ['a', 'k'], color: '#f4b860' },
    led: { label: 'LED', symbol: 'LED', terminals: ['a', 'k'], color: '#ffb985' },
    schottky: { label: 'Schottky diode', symbol: 'Dsch', terminals: ['a', 'k'], color: '#f4b860' },
    zener: { label: 'Zener diode', symbol: 'Dz', terminals: ['a', 'k'], color: '#f4b860' },
    tvs: { label: 'TVS diode', symbol: 'TVS', terminals: ['a', 'k'], color: '#ff8e83' },
    mov: { label: 'MOV suppressor', symbol: 'MOV', terminals: ['a', 'b'], color: '#ff8e83' },
    fuse: { label: 'Fuse', symbol: 'F', terminals: ['a', 'b'], color: '#f4b860' },
    buck12: { label: '12 V buck module', symbol: 'DC/DC', terminals: ['vin', 'gnd', 'vout'], color: '#70d6bf' },
    buck5: { label: '5 V buck module', symbol: 'DC/DC', terminals: ['vin', 'gnd', 'vout'], color: '#70d6bf' },
    regulator3v3: { label: '3.3 V regulator', symbol: 'LDO', terminals: ['vin', 'gnd', 'vout'], color: '#70d6bf' },
    mosfet: { label: 'P-channel MOSFET', symbol: 'Q', terminals: ['g', 's', 'd'], color: '#c2a0ff' },
    switch: { label: 'Switch', symbol: 'SW', terminals: ['a', 'b'], color: '#58d6ba' },
    voltage: { label: 'Battery', symbol: 'V', terminals: ['+', '−'], color: '#f4b860' },
    current: { label: 'Current source', symbol: 'I', terminals: ['a', 'b'], color: '#58d6ba' },
    ground: { label: 'Ground', symbol: '⏚', terminals: ['gnd'], color: '#58d6ba' },
    lamp: { label: 'Lamp', symbol: 'L', terminals: ['a', 'b'], color: '#f4b860' },
    breadboard: { label: 'Breadboard', symbol: '▦', terminals: [], color: '#e8a66e' },
    ic_74hc165: { label: '74HC165 shift register', symbol: '165', terminals: ['VCC','GND','CLK','/PL','/CE','SER','QH','A','B','C','D','E','F','G','H'], color: '#9baec4' },
    can_transceiver: { label: 'SN65HVD230 CAN transceiver', symbol: 'CAN', terminals: ['VCC','GND','TXD','RXD','CANH','CANL'], color: '#9baec4' },
    can_controller: { label: 'MCP2515 CAN controller', symbol: 'MCP', terminals: ['VCC','GND','SCK','MOSI','MISO','CS','INT','TXCAN','RXCAN'], color: '#9baec4' },
    i2c_mux: { label: 'TCA9548A I²C mux', symbol: 'MUX', terminals: ['VCC','GND','SDA','SCL','SD0','SC0','SD1','SC1','SD2','SC2','SD3','SC3','SD4','SC4','SD5','SC5','SD6','SC6','SD7','SC7'], color: '#9baec4' },
    esp32_p4: { label: 'ESP32-P4 board', symbol: 'P4', terminals: ['5V','3V3','GND',...Array.from({length:27},(_,i)=>`GPIO${i+1}`)], color: '#8b9cff' },
    esp32_s3: { label: 'ESP32-S3 board', symbol: 'S3', terminals: ['5V','3V3','GND',...Array.from({length:22},(_,i)=>`GPIO${i}`)], color: '#8b9cff' },
    connector4: { label: '4-pin connector', symbol: 'J4', terminals: ['1','2','3','4'], color: '#9baec4' },
    bat54s: { label: 'BAT54S dual clamp', symbol: 'D×2', terminals: ['GND','SIG','VCC'], color: '#f4b860' },
    oled: { label: 'SSD1306 OLED module', symbol: 'OLED', terminals: ['VCC','GND','SDA','SCL'], color: '#9baec4' }
    ,ford_ntc: { label: 'Ford NTC temperature sender', symbol: 'NTC', terminals: ['a','b'], color: '#f4b860' }
    ,fuel_sender: { label: 'Fuel level sender', symbol: 'FUEL', terminals: ['a','b'], color: '#f4b860' }
    ,ldr: { label: 'Light dependent resistor', symbol: 'LDR', terminals: ['a','b'], color: '#f4b860' }
    ,oil_pressure_sensor: { label: '0.5–4.5 V oil pressure sensor', symbol: 'PRESS', terminals: ['VCC','GND','SIG'], color: '#9baec4' }
    ,lm1815_conditioner: { label: 'LM1815 VR conditioner', symbol: 'LM1815', terminals: ['IN+','IN−','VCC','GND','OUT'], color: '#9baec4' }
    ,relay_module: { label: 'Automotive relay and driver', symbol: 'RELAY', terminals: ['VCC','GND','CTRL','COM','NO','NC'], color: '#9baec4' }
    ,connector3: { label: '3-pin sensor connector', symbol: 'J3', terminals: ['1','2','3'], color: '#9baec4' }
  };
  const defaults = {
    resistor:{resistance:1000}, capacitor:{capacitance:100e-9,voltageRating:50}, electrolytic_capacitor:{capacitance:470e-6,voltageRating:50}, supercap:{capacitance:2,voltageRating:5.5},
    inductor:{inductance:10e-6,resistance:0.1,partNumber:'SRR1260-100M'}, diode:{forwardVoltage:0.7,breakdownVoltage:100,partNumber:'1N4148'}, schottky:{forwardVoltage:0.35,breakdownVoltage:40,partNumber:'B540C-13-F'},
    led:{forwardVoltage:2,breakdownVoltage:5}, zener:{forwardVoltage:0.7,breakdownVoltage:3.3,partNumber:'BZX84C3V3'}, tvs:{forwardVoltage:0.9,breakdownVoltage:36.7,partNumber:'SMBJ33A'}, mov:{clampVoltage:22,partNumber:'MOV-10D220K'}, fuse:{resistance:0.02,currentRating:10,partNumber:'10 A blade fuse'},switch:{closed:true,resistance:0.01},
    buck12:{outputVoltage:12,inputMin:8,inputMax:40,currentLimit:3,efficiency:0.88,partNumber:'LM2596HV module'}, buck5:{outputVoltage:5,inputMin:4,inputMax:38,currentLimit:5,efficiency:0.9,partNumber:'D-Planet 5 A module'},
    regulator3v3:{outputVoltage:3.3,dropoutVoltage:1.1,currentLimit:0.8,partNumber:'LD1117S33TR'}, mosfet:{onResistance:0.06,partNumber:'IRF5305PBF'},
    voltage:{voltage:5},current:{current:0.005},ground:{},lamp:{resistance:100},breadboard:{rows:30},
    ic_74hc165:{partNumber:'SN74HC165D'},can_transceiver:{partNumber:'SN65HVD230DR'},can_controller:{partNumber:'MCP2515'},
    i2c_mux:{partNumber:'TCA9548A'},esp32_p4:{partNumber:'ESP32-P4'},esp32_s3:{partNumber:'ESP32-S3'},connector4:{partNumber:'J4'},bat54s:{partNumber:'BAT54S'},oled:{partNumber:'SSD1306'},
    ford_ntc:{resistance:10000,partNumber:'Ford 2-wire NTC sender'},fuel_sender:{resistance:80,partNumber:'15–160 Ω fuel sender'},ldr:{resistance:10000,partNumber:'LDR'},
    oil_pressure_sensor:{partNumber:'0.5–4.5 V, 3-wire transducer · symbol only'},lm1815_conditioner:{partNumber:'LM1815 · symbol only'},relay_module:{partNumber:'12 V automotive relay · symbol only'},connector3:{partNumber:'J3 sensor'}
  };
  function terminalsFor(part){
    if(part.type==='breadboard')return [...Array.from({length:30},(_,i)=>Array.from('abcdefghij',c=>`r${String(i+1).padStart(2,'0')}${c}`)).flat(),...['tp','tn','bp','bn'].flatMap(r=>Array.from('abcdefghij',c=>r+c))];
    return definitions[part.type].terminals;
  }
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
      if (!part || !terminalsFor(part).includes(ref.terminal)) throw new Error(`Invalid terminal ${terminalKey(ref)}`);
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
    for (const p of parts) for (const t of terminalsFor(p)) find(`${p.id}.${t}`);
    for (const w of circuit.wires) union(terminalKey(w.from), terminalKey(w.to));
    for(const p of parts.filter(x=>x.type==='breadboard')) {
      for(let row=1;row<=30;row++) for(const group of ['abcde','fghij']) for(let i=1;i<group.length;i++) union(`${p.id}.r${String(row).padStart(2,'0')}${group[0]}`,`${p.id}.r${String(row).padStart(2,'0')}${group[i]}`);
      for(const rail of ['tp','tn','bp','bn']) for(const col of 'bcdefghij') union(`${p.id}.${rail}a`,`${p.id}.${rail}${col}`);
    }
    const grounds = parts.filter(p => p.type === 'ground');
    if (!grounds.length) throw new Error('Add a ground symbol to define the 0 V reference.');
    const ground = find(`${grounds[0].id}.gnd`);
    const diodeParts=parts.filter(p=>['diode','led','schottky','zener','tvs','mov'].includes(p.type));
    const modes=Object.fromEntries(diodeParts.map(p=>[p.id,0]));
    let inputDraws=Object.fromEntries(parts.filter(p=>['buck12','buck5','regulator3v3'].includes(p.type)).map(p=>[p.id,0]));
    let solved;
    for(let iteration=0;iteration<40;iteration++){
      const sources=parts.flatMap(p=>{
        if(p.type==='voltage')return [{part:p,positive:'+',negative:'−',volts:Number(p.voltage),kind:'voltage'}];
        if(['buck12','buck5','regulator3v3'].includes(p.type))return [{part:p,positive:'vout',negative:'gnd',volts:Number(p.outputVoltage),kind:'converter'}];
        const mode=modes[p.id]||0;if(!mode)return [];
        const v=mode===1?Number(p.forwardVoltage??0.7):-Number(p.breakdownVoltage??p.clampVoltage??Infinity);
        return [{part:p,positive:'a',negative:p.type==='mov'?'b':'k',volts:v,kind:'clamp'}];
      });
      const active=[];
      for(const p of parts){
        if(['resistor','lamp','inductor','fuse','switch','ford_ntc','fuel_sender','ldr','current','voltage','buck12','buck5','regulator3v3','diode','led','schottky','zener','tvs','mov'].includes(p.type))active.push(...terminalsFor(p).map(t=>`${p.id}.${t}`));
      }
      const roots=[...new Set(active.map(find))].filter(n=>n!==ground);
      const nodeNames=new Map(roots.map((n,i)=>[n,`N${i+1}`])),nodes=[...nodeNames.keys()],nodeIndex=new Map(nodes.map((n,i)=>[n,i]));
      const size=nodes.length+sources.length;
      if(!size)throw new Error('Add a source and electrical components before running the simulation.');
      const A=Array.from({length:size},()=>Array(size).fill(0)),z=Array(size).fill(0);
      const ni=ref=>{const k=find(typeof ref==='string'?ref:terminalKey(ref));return k===ground?-1:nodeIndex.has(k)?nodeIndex.get(k):-1;};
      const stampG=(a,b,g)=>{const i=ni(a),j=ni(b);if(i>=0)A[i][i]+=g;if(j>=0)A[j][j]+=g;if(i>=0&&j>=0){A[i][j]-=g;A[j][i]-=g;}};
      const stampI=(a,b,v)=>{const i=ni(a),j=ni(b);if(i>=0)z[i]-=v;if(j>=0)z[j]+=v;};
      const stampV=(a,b,row,v)=>{const i=ni(a),j=ni(b);if(i>=0)A[i][row]+=1;if(j>=0)A[j][row]-=1;if(i>=0)A[row][i]+=1;if(j>=0)A[row][j]-=1;z[row]=v;};
      for(const p of parts){
        if(['resistor','lamp','inductor','fuse','ford_ntc','fuel_sender','ldr'].includes(p.type)){const r=Number(p.resistance);if(!(r>0))throw new Error(`${p.id} needs a positive resistance.`);stampG(`${p.id}.a`,`${p.id}.b`,1/r);}
        if(p.type==='switch')stampG(`${p.id}.a`,`${p.id}.b`,p.closed?1/Number(p.resistance):1e-9);
        if(p.type==='current')stampI(`${p.id}.a`,`${p.id}.b`,Number(p.current));
        if(diodeParts.includes(p)&&!modes[p.id])stampG(`${p.id}.a`,`${p.id}.${p.type==='mov'?'b':'k'}`,1e-9);
      }
      parts.filter(p=>['buck12','buck5','regulator3v3'].includes(p.type)).forEach(p=>stampI(`${p.id}.vin`,`${p.id}.gnd`,Number(inputDraws[p.id]||0)));
      sources.forEach((s,k)=>stampV(`${s.part.id}.${s.positive}`,`${s.part.id}.${s.negative}`,nodes.length+k,s.volts));
      // Pivoted Gauss-Jordan elimination detects floating or shorted circuits.
      for(let c=0;c<size;c++){
        let pivot=c;for(let r=c+1;r<size;r++)if(Math.abs(A[r][c])>Math.abs(A[pivot][c]))pivot=r;
        if(Math.abs(A[pivot][c])<1e-12)throw new Error('Circuit is singular. Check for floating terminals, missing ground, or a shorted source.');
        [A[c],A[pivot]]=[A[pivot],A[c]];[z[c],z[pivot]]=[z[pivot],z[c]];
        const d=A[c][c];for(let j=c;j<size;j++)A[c][j]/=d;z[c]/=d;
        for(let r=0;r<size;r++)if(r!==c){const f=A[r][c];if(!f)continue;for(let j=c;j<size;j++)A[r][j]-=f*A[c][j];z[r]-=f*z[c];}
      }
      const voltage=ref=>{const i=ni(ref);return i<0?0:z[i];};
      const branchCurrent=part=>{const i=sources.findIndex(s=>s.part===part);return i<0?0:z[nodes.length+i];};
      let changed=false;
      for(const p of diodeParts){
        const v=voltage(`${p.id}.a`)-voltage(`${p.id}.${p.type==='mov'?'b':'k'}`),i=branchCurrent(p),mode=modes[p.id]||0;
        let next=0;
        if(p.type==='mov'){const lim=Number(p.clampVoltage);if(v>lim+0.02)next=1;else if(v< -lim-0.02)next=-1;}
        else if(v>Number(p.forwardVoltage)+0.01)next=1;
        else if(['zener','tvs'].includes(p.type)&&v< -Number(p.breakdownVoltage)-0.02)next=-1;
        if(mode===1&&i< -1e-8)next=0;if(mode===-1&&i>1e-8)next=0;
        if(next!==mode){modes[p.id]=next;changed=true;}
      }
      for(const p of parts.filter(x=>['buck12','buck5','regulator3v3'].includes(x.type))){
        const vin=voltage(`${p.id}.vin`)-voltage(`${p.id}.gnd`),iout=branchCurrent(p),vout=Number(p.outputVoltage);
        const min=Number(p.inputMin??(vout+Number(p.dropoutVoltage||0.3))),max=Number(p.inputMax??Infinity);
        if(vin<min-0.05||vin>max+0.05)throw new Error(`${p.id} input is ${vin.toFixed(2)} V; expected ${min}–${max} V.`);
        const limit=Number(p.currentLimit??Infinity);if(-iout>limit+0.01)throw new Error(`${p.id} output current exceeds its ${limit} A rating.`);
        const draw=p.type==='regulator3v3'?Math.max(0,-iout+0.005):Math.max(0,-vout*iout/(Math.max(vin,0.1)*Number(p.efficiency||0.9)));
        if(Math.abs(draw-inputDraws[p.id])>1e-7){inputDraws[p.id]=draw;changed=true;}
      }
      solved={nodes,nodeNames,nodeIndex,sources,z,voltage};
      if(!changed)break;
      if(iteration===39)throw new Error('The nonlinear diode or converter model did not converge.');
    }
    const {nodes,nodeNames,nodeIndex,sources,z,voltage}=solved;
    const srcCurrent=p=>{const i=sources.findIndex(s=>s.part===p);return i<0?0:z[nodes.length+i];};
    const results=parts.filter(p=>!['ground','breadboard',...Object.keys(definitions).filter(t=>definitions[t].terminals.length>2&& !['buck12','buck5','regulator3v3'].includes(t))].includes(p.type)).map(p=>{
      const v=(a,b)=>{const va=voltage(`${p.id}.${a}`),vb=voltage(`${p.id}.${b}`);return Number.isFinite(va)&&Number.isFinite(vb)?va-vb:null;};
      const row={id:p.id,type:p.type};
      if(['resistor','lamp','inductor','fuse','ford_ntc','fuel_sender','ldr'].includes(p.type)){row.voltage=v('a','b');row.current=row.voltage===null?null:row.voltage/Number(p.resistance);row.power=row.voltage===null?null:row.voltage*row.current;row.resistance=Number(p.resistance);}
      else if(['capacitor','electrolytic_capacitor','supercap'].includes(p.type)){row.voltage=v(...(p.type==='capacitor'?['a','b']:['+','−']));row.current=0;row.power=0;row.model='open circuit at DC';}
      else if(p.type==='switch'){row.voltage=v('a','b');row.current=p.closed?row.voltage/Number(p.resistance):0;row.power=row.voltage*row.current;row.closed=Boolean(p.closed);}
      else if(['diode','led','schottky','zener','tvs','mov'].includes(p.type)){row.voltage=v('a',p.type==='mov'?'b':'k');row.current=srcCurrent(p);row.power=row.voltage*row.current;}
      else if(p.type==='voltage'){row.voltage=Number(p.voltage);row.current=srcCurrent(p);row.power=row.voltage*row.current;}
      else if(['buck12','buck5','regulator3v3'].includes(p.type)){row.voltage=Number(p.outputVoltage);row.current=-srcCurrent(p);row.power=row.voltage*row.current;row.inputVoltage=v('vin','gnd');row.inputCurrent=Number(inputDraws[p.id]||0);row.inputPower=row.inputVoltage*row.inputCurrent;}
      else if(p.type==='current'){row.current=Number(p.current);row.voltage=v('a','b');row.power=row.voltage*row.current;}
      return row;
    });
    return {ok:true,circuit:circuit.name,ground:grounds[0].id,nodes:Object.fromEntries([...nodeNames].map(([key,name])=>[name,z[nodeIndex.get(key)]])),components:results,summary:`Solved ${results.length} electrical components across ${nodes.length+1} nodes (DC operating point).`};
  }
  function terminalPosition(p, terminal) {
    if(p.type==='breadboard') {
      const row=terminal.match(/^r(\d\d)([a-j])$/);
      if(row){const col='abcdefghij'.indexOf(row[2]);return {x:p.x+(col<5?-150:-10)+(col%5)*13,y:p.y-77+(Number(row[1])-1)*5.2};}
      const rail=terminal.match(/^(tp|tn|bp|bn)([a-j])$/);
      if(rail)return {x:p.x-148+'abcdefghij'.indexOf(rail[2])*33,y:p.y+({tp:-110,tn:-97,bp:97,bn:110}[rail[1]])};
      return {x:p.x,y:p.y};
    }
    if(p.type==='buck12'||p.type==='buck5'||p.type==='regulator3v3')return {x:p.x+(terminal==='vin'?-70:terminal==='vout'?70:0),y:p.y+(terminal==='gnd'?34:0)};
    if(p.type==='mosfet')return {x:p.x+(terminal==='g'?-42:terminal==='s'?42:0),y:p.y+(terminal==='d'?32:0)};
    if(definitions[p.type].terminals.length>2){const pins=definitions[p.type].terminals,idx=pins.indexOf(terminal),half=Math.ceil(pins.length/2);return {x:p.x+(idx<half?-52:52),y:p.y-((Math.max(half,pins.length-half)-1)*9)/2+(idx<half?idx:idx-half)*9};}
    if(p.type==='ground')return {x:p.x,y:p.y+34};
    return {x:p.x+(terminal==='a'||terminal==='+'||terminal==='anode'?-56:56),y:p.y};
  }
  function toSvg(circuit) {
    const W=1000,H=600, byKey=ref=>{const p=circuit.components.find(x=>x.id===ref.component);return p&&terminalPosition(p,ref.terminal);};
    const paths=circuit.wires.map(w=>{const a=byKey(w.from),b=byKey(w.to);if(!a||!b)return '';const mid=(a.x+b.x)/2;return `<path d="M${a.x} ${a.y} H${mid} V${b.y} H${b.x}"/>`;}).join('');
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const boards=circuit.components.filter(p=>p.type==='breadboard').map(p=>{
      const {x,y}=p,holes=[];
      for(let n=1;n<=30;n++)for(const col of 'abcdefghij'){const name=`r${String(n).padStart(2,'0')}${col}`,q=terminalPosition(p,name);holes.push(`<circle class="board-hole" data-component="${esc(p.id)}" data-terminal="${name}" cx="${q.x}" cy="${q.y}" r="2.5"/>`);}
      for(const rail of ['tp','tn','bp','bn'])for(const col of 'abcdefghij'){const name=rail+col,q=terminalPosition(p,name);holes.push(`<circle class="board-hole" data-component="${esc(p.id)}" data-terminal="${name}" cx="${q.x}" cy="${q.y}" r="2.5"/>`);}
      const labels=Array.from({length:30},(_,i)=>i%5===0?`<text class="board-row-label" x="${x-177}" y="${y-74+i*5.2}">${i+1}</text>`:'').join('');
      const rails=['tp','tn','bp','bn'].map(r=>`<text class="board-rail-label ${r.endsWith('p')?'positive':'negative'}" x="${x-174}" y="${y+({tp:-107,tn:-94,bp:100,bn:113}[r])}">${r.endsWith('p')?'+':'−'}</text>`).join('');
      return `<g class="breadboard part" data-id="${esc(p.id)}"><rect class="board-shell" x="${x-190}" y="${y-132}" width="380" height="264" rx="12"/><text class="board-title" x="${x}" y="${y-143}">BREADBOARD · ${esc(p.id)} · 30 ROWS</text><rect class="board-channel" x="${x-190}" y="${y-5}" width="380" height="14"/><text class="board-bank-label" x="${x-152}" y="${y-82}">A  B  C  D  E</text><text class="board-bank-label" x="${x+7}" y="${y-82}">F  G  H  I  J</text>${labels}${rails}${holes.join('')}</g>`;
    }).join('');
    const shapes=circuit.components.filter(p=>p.type!=='breadboard').map(p=>{const d=definitions[p.type],x=p.x,y=p.y;let symbol='';
      if(p.type==='resistor')symbol=`<path d="M${x-35} ${y}h10l8-12 12 24 12-24 12 24 12-12h9"/>`;
      else if(['capacitor','electrolytic_capacitor','supercap'].includes(p.type))symbol=`<path d="M${x-56} ${y}h42m28 0h42M${x-14} ${y-18}v36m14-18a18 18 0 0 1 0 36"/>${p.type!=='capacitor'?`<text class="polarity" x="${x-23}" y="${y-9}">+</text>`:''}`;
      else if(p.type==='inductor')symbol=`<path d="M${x-56} ${y}h12c0-18 20-18 20 0s20 18 20 0 20-18 20 0h20"/>`;
      else if(['diode','led','schottky','zener','tvs'].includes(p.type))symbol=`<path d="M${x-56} ${y}h25m0-15v30l27-15-27-15m27 0v30m0-30h25"/>${p.type==='zener'||p.type==='tvs'?`<path d="M${x-1} ${y-15}l7 5m-7 25l7-5"/>`:''}${p.type==='schottky'?`<path d="M${x+1} ${y-15}l7-5m-7 35l7 5"/>`:''}${p.type==='led'?`<path d="M${x+5} ${y-22}l8-8m-8 1v-1h1m-1 15l8-8m-8 1v-1h1"/>`:''}`;
      else if(p.type==='mov')symbol=`<circle cx="${x}" cy="${y}" r="19"/><path d="M${x-12} ${y+13}l24-26m-3 0h5v5"/>`;
      else if(p.type==='fuse')symbol=`<path d="M${x-56} ${y}h27m58 0h27"/><rect x="${x-29}" y="${y-10}" width="58" height="20" rx="4"/>`;
      else if(p.type==='switch')symbol=`<path d="M${x-56} ${y}h22m46 0h44M${x-34} ${y}l40-20"/><circle cx="${x-34}" cy="${y}" r="3"/><circle cx="${x+34}" cy="${y}" r="3"/>`;
      else if(p.type==='lamp')symbol=`<circle cx="${x}" cy="${y}" r="20"/><path d="M${x-13} ${y-13}l26 26m0-26l-26 26"/>`;
      else if(p.type==='voltage')symbol=`<path d="M${x-56} ${y}h34m44 0h34"/><path d="M${x-18} ${y-16}v32m12-9v-14"/>`;
      else if(p.type==='current')symbol=`<circle cx="${x}" cy="${y}" r="19"/><path d="M${x} ${y+11}v-22m0 0l-6 7m6-7l6 7"/>`;
      else if(['buck12','buck5','regulator3v3'].includes(p.type))symbol=`<rect x="${x-48}" y="${y-25}" width="96" height="50" rx="6"/><text class="chip-symbol" x="${x}" y="${y+4}">${d.symbol}</text><path d="M${x-48} ${y}h-22m70 0h22M${x} ${y+25}v9"/>`;
      else if(p.type==='mosfet')symbol=`<circle cx="${x}" cy="${y}" r="20"/><path d="M${x-42} ${y}h20m2-13v26m8-20v14m0-7h18v-20m-18 20v20"/>`;
      else {const h=Math.max(48,Math.ceil(definitions[p.type].terminals.length/2)*9+18),label=d.symbol;symbol=`<rect x="${x-39}" y="${y-h/2}" width="78" height="${h}" rx="5"/><text class="chip-symbol" x="${x}" y="${y+4}">${esc(label)}</text>`;}
      let value='';if(['resistor','lamp','fuse'].includes(p.type))value=`${p.resistance>=1000?p.resistance/1000+' kΩ':p.resistance+' Ω'}`;else if(p.type==='voltage')value=`${p.voltage} V`;else if(p.type==='current')value=`${p.current*1000} mA`;else if(['capacitor','electrolytic_capacitor','supercap'].includes(p.type))value=`${p.capacitance} F · ${p.voltageRating} V`;else if(p.type==='inductor')value=`${p.inductance} H`;else if(['zener','tvs'].includes(p.type))value=`${p.breakdownVoltage} V`;else if(p.type==='mov')value=`${p.clampVoltage} V clamp`;else if(p.type==='buck12'||p.type==='buck5'||p.type==='regulator3v3')value=`${p.outputVoltage} V regulated`;else if(p.type==='switch')value=p.closed?'Closed':'Open';else if(p.partNumber)value=p.partNumber;
      const term=terminalsFor(p).map(t=>{const q=terminalPosition(p,t);return `<circle class="terminal" data-component="${esc(p.id)}" data-terminal="${esc(t)}" cx="${q.x}" cy="${q.y}" r="${terminalsFor(p).length>2?4:6}"/>`;}).join('');
      return `<g class="part" data-id="${esc(p.id)}" style="--part:${d.color}">${term}<g class="symbol">${symbol}</g><text class="part-name" x="${x}" y="${y-32}">${esc(d.label)} · ${esc(p.id)}</text><text class="part-value" x="${x}" y="${y+42}">${esc(value)}</text></g>`;
    }).join('');
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Circuit schematic"><defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#273246"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/>${boards}<g class="wires">${paths}</g><g>${shapes}</g></svg>`;
  }
  return {definitions,terminalsFor,createCircuit,addComponent,connect,solve,toSvg,terminalPosition};
});
