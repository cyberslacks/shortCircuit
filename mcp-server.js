#!/usr/bin/env node
// MCP stdio server. Projects are shared with the browser through the project store.
const readline = require('node:readline');
const Lab = require('./circuit.js');
const Projects = require('./project-store.js');
let stored=Projects.read();
if(!stored.length){stored=[{id:`project-${Date.now()}`,circuit:Lab.createCircuit('Untitled circuit'),updatedAt:new Date().toISOString()}];Projects.write(stored);}
let activeProject=stored[0].id;
let circuit=stored[0].circuit;
function persist(){const p={id:activeProject,circuit,updatedAt:new Date().toISOString()};Projects.save(p);}
function footprint(type){
  const d=Lab.definitions[type],pins=d.terminals.length;
  if(type==='breadboard')return {width:410,height:300};
  return {width:Math.max(150,Math.min(280,d.label.length*6.3),pins>2?120:0),height:Math.max(110,Math.ceil(pins/2)*9+86)};
}
function overlaps(type,x,y,part){const a=footprint(type),b=footprint(part.type);return Math.abs(x-part.x)<(a.width+b.width)/2+20&&Math.abs(y-part.y)<(a.height+b.height)/2+20;}
function placeMcpComponent(args){
  const type=args.type;if(!Lab.definitions[type])throw new Error(`Unknown component type: ${type}`);
  const hasPosition=Number.isFinite(args.x)&&Number.isFinite(args.y);
  if(hasPosition&&circuit.components.some(p=>overlaps(type,args.x,args.y,p)))throw new Error('That position overlaps another component. Choose a clear position with at least 20 px of space around each component; breadboards need about 410 × 300 px.');
  let position={x:args.x,y:args.y};
  if(!hasPosition){
    const size=footprint(type),target={x:Number.isFinite(args.x)?args.x:500,y:Number.isFinite(args.y)?args.y:300},choices=[];
    for(let y=Math.ceil(size.height/2+12);y<=600-size.height/2-12;y+=36)for(let x=Math.ceil(size.width/2+12);x<=1000-size.width/2-12;x+=36)if(!circuit.components.some(p=>overlaps(type,x,y,p)))choices.push({x,y,score:Math.hypot((x-target.x)*1.15,y-target.y)});
    choices.sort((a,b)=>a.score-b.score);if(!choices.length)throw new Error('No clear space remains on the schematic for this component. Move or remove a component first.');position=choices[0];
  }
  return Lab.addComponent(circuit,type,{...args,...position});
}
const tools = [
  {name:'circuit_project_list',description:'List saved projects shared with the ShortCircuit browser app.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'circuit_project_open',description:'Open a saved project by id so subsequent circuit tools work on it.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  {name:'circuit_project_save',description:'Save the current circuit to the shared project store; optionally set its project name.',inputSchema:{type:'object',properties:{name:{type:'string'}},additionalProperties:false}},
  {name:'circuit_project_delete',description:'Delete a saved project by id. At least one project must remain.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id'],additionalProperties:false}},
  {name:'circuit_new',description:'Start a fresh named project in the shared project store.',inputSchema:{type:'object',properties:{name:{type:'string'}},additionalProperties:false}},
  {name:'circuit_add_component',description:'Place any library part: breadboard, passives and capacitors, diodes and surge protection, buck converters and regulators, Ford NTC temperature sender, fuel sender, light sensor, oil pressure transducer, LM1815 tach VR conditioner, relay driver, MOSFET, BAT54S, 74HC165, SN65HVD230, MCP2515, TCA9548A, ESP32-P4/S3, OLED, connectors, battery, current source, or ground. Sensor resistance defaults are nominal editable DC equivalents; multi-pin modules are schematic-only. Layout rule: never stack or overlap components. Keep at least 20 schematic pixels of clearance between component footprints; a breadboard needs about 410 × 300 pixels. Omit x and y to let the server find open space. Explicit coordinates that overlap another part are rejected; reposition existing parts before adding if no clear space remains. Keep related parts grouped while leaving wires readable.',inputSchema:{type:'object',properties:{type:{type:'string',enum:Object.keys(Lab.definitions)},id:{type:'string'},x:{type:'number'},y:{type:'number'},resistance:{type:'number'},capacitance:{type:'number',description:'Farads.'},voltageRating:{type:'number',description:'Maximum capacitor voltage in volts.'},inductance:{type:'number',description:'Henries.'},voltage:{type:'number',description:'Source voltage in volts.'},current:{type:'number',description:'Source current in amps.'},forwardVoltage:{type:'number',description:'Diode forward voltage in volts.'},breakdownVoltage:{type:'number',description:'Zener or TVS breakdown voltage in volts.'},clampVoltage:{type:'number',description:'MOV clamp voltage in volts.'},outputVoltage:{type:'number',description:'Regulated converter output in volts.'},inputMin:{type:'number'},inputMax:{type:'number'},currentLimit:{type:'number'},efficiency:{type:'number'},currentRating:{type:'number'},partNumber:{type:'string'},closed:{type:'boolean'}},required:['type'],additionalProperties:false}},
  {name:'circuit_connect',description:'Connect two component terminals with a wire. Two-pin passive parts use a,b; diode-family parts use a,k; electrolytic/supercaps use +,−; battery uses +,−; buck/regulator uses vin,gnd,vout; ground uses gnd. Breadboard row holes are r01a–r30j; rail holes are tpa–tpj, tna–tnj, bpa–bpj, bna–bnj. Each five-hole bank and power rail is internally connected.',inputSchema:{type:'object',properties:{from:{type:'object',properties:{component:{type:'string'},terminal:{type:'string'}},required:['component','terminal'],additionalProperties:false},to:{type:'object',properties:{component:{type:'string'},terminal:{type:'string'}},required:['component','terminal'],additionalProperties:false}},required:['from','to'],additionalProperties:false}},
  {name:'circuit_simulate',description:'Solve the DC operating point and report voltage, current, power, and converter input loading. Capacitors are open at DC; diodes, Zeners, TVS, and MOVs use piecewise clamp models; buck modules and regulators use regulated-output macro models. Requires a ground reference.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'circuit_visualize',description:'Return the circuit schematic as SVG markup.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'circuit_inspect',description:'Return the current circuit model and all connections.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
function textResult(value){return {content:[{type:'text',text:typeof value==='string'?value:JSON.stringify(value,null,2)}]};}
function invoke(name,a){
  switch(name){
    case 'circuit_project_list': return Projects.read().map(p=>({id:p.id,name:p.circuit.name,components:p.circuit.components.length,wires:p.circuit.wires.length,updatedAt:p.updatedAt}));
    case 'circuit_project_open': {const p=Projects.read().find(item=>item.id===a.id);if(!p)throw new Error(`Project not found: ${a.id}`);activeProject=p.id;circuit=p.circuit;return {id:activeProject,circuit};}
    case 'circuit_project_save': if(a.name)circuit.name=a.name;persist();return {id:activeProject,circuit};
    case 'circuit_project_delete': {const all=Projects.read();if(all.length<2)throw new Error('At least one project must remain');if(!all.some(p=>p.id===a.id))throw new Error(`Project not found: ${a.id}`);Projects.remove(a.id);if(activeProject===a.id){const next=Projects.read()[0];activeProject=next.id;circuit=next.circuit;}return {deleted:a.id,activeProject};}
    case 'circuit_new': circuit=Lab.createCircuit(a.name||'Untitled circuit');activeProject=`project-${Date.now()}`;persist();return circuit;
    case 'circuit_add_component': {const p=placeMcpComponent(a);persist();return p;}
    case 'circuit_connect': {const result=Lab.connect(circuit,a.from,a.to);persist();return result;}
    case 'circuit_simulate': return Lab.solve(circuit);
    case 'circuit_visualize': return Lab.toSvg(circuit);
    case 'circuit_inspect': return {id:activeProject,...circuit};
    default: throw new Error(`Unknown tool: ${name}`);
  }
}
function send(message){process.stdout.write(JSON.stringify(message)+'\n');}
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
rl.on('line',line=>{let req;try{req=JSON.parse(line);}catch{return;}
  if(req.method==='notifications/initialized'||req.method==='notifications/cancelled')return;
  const base={jsonrpc:'2.0',id:req.id};
  try{
    if(req.method==='initialize')send({...base,result:{protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'shortcircuit-lab',version:'1.0.0'}}});
    else if(req.method==='ping')send({...base,result:{}});
    else if(req.method==='tools/list')send({...base,result:{tools}});
    else if(req.method==='tools/call'){
      const result=invoke(req.params.name,req.params.arguments||{});
      send({...base,result:textResult(result)});
    } else if(req.id!==undefined)send({...base,error:{code:-32601,message:`Method not found: ${req.method}`}});
  }catch(e){if(req.id!==undefined)send({...base,result:{content:[{type:'text',text:e.message}],isError:true}});}
});
