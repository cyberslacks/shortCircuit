#!/usr/bin/env node
// MCP stdio server. Circuit state is kept in memory for this server session.
const readline = require('node:readline');
const Lab = require('./circuit.js');
let circuit = Lab.createCircuit('Workbench circuit');
const tools = [
  {name:'circuit_new',description:'Start a fresh circuit.',inputSchema:{type:'object',properties:{name:{type:'string'}},additionalProperties:false}},
  {name:'circuit_add_component',description:'Place any library part: breadboard, passives and capacitors, diodes and surge protection, buck converters and regulators, Ford NTC temperature sender, fuel sender, light sensor, oil pressure transducer, LM1815 tach VR conditioner, relay driver, MOSFET, BAT54S, 74HC165, SN65HVD230, MCP2515, TCA9548A, ESP32-P4/S3, OLED, connectors, battery, current source, or ground. Sensor resistance defaults are nominal editable DC equivalents; multi-pin modules are schematic-only.',inputSchema:{type:'object',properties:{type:{type:'string',enum:Object.keys(Lab.definitions)},id:{type:'string'},x:{type:'number'},y:{type:'number'},resistance:{type:'number'},capacitance:{type:'number',description:'Farads.'},voltageRating:{type:'number',description:'Maximum capacitor voltage in volts.'},inductance:{type:'number',description:'Henries.'},voltage:{type:'number',description:'Source voltage in volts.'},current:{type:'number',description:'Source current in amps.'},forwardVoltage:{type:'number',description:'Diode forward voltage in volts.'},breakdownVoltage:{type:'number',description:'Zener or TVS breakdown voltage in volts.'},clampVoltage:{type:'number',description:'MOV clamp voltage in volts.'},outputVoltage:{type:'number',description:'Regulated converter output in volts.'},inputMin:{type:'number'},inputMax:{type:'number'},currentLimit:{type:'number'},efficiency:{type:'number'},currentRating:{type:'number'},partNumber:{type:'string'},closed:{type:'boolean'}},required:['type'],additionalProperties:false}},
  {name:'circuit_connect',description:'Connect two component terminals with a wire. Two-pin passive parts use a,b; diode-family parts use a,k; electrolytic/supercaps use +,−; battery uses +,−; buck/regulator uses vin,gnd,vout; ground uses gnd. Breadboard row holes are r01a–r30j; rail holes are tpa–tpj, tna–tnj, bpa–bpj, bna–bnj. Each five-hole bank and power rail is internally connected.',inputSchema:{type:'object',properties:{from:{type:'object',properties:{component:{type:'string'},terminal:{type:'string'}},required:['component','terminal'],additionalProperties:false},to:{type:'object',properties:{component:{type:'string'},terminal:{type:'string'}},required:['component','terminal'],additionalProperties:false}},required:['from','to'],additionalProperties:false}},
  {name:'circuit_simulate',description:'Solve the DC operating point and report voltage, current, power, and converter input loading. Capacitors are open at DC; diodes, Zeners, TVS, and MOVs use piecewise clamp models; buck modules and regulators use regulated-output macro models. Requires a ground reference.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'circuit_visualize',description:'Return the circuit schematic as SVG markup.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'circuit_inspect',description:'Return the current circuit model and all connections.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
function textResult(value){return {content:[{type:'text',text:typeof value==='string'?value:JSON.stringify(value,null,2)}]};}
function invoke(name,a){
  switch(name){
    case 'circuit_new': circuit=Lab.createCircuit(a.name||'Untitled circuit');return circuit;
    case 'circuit_add_component': return Lab.addComponent(circuit,a.type,a);
    case 'circuit_connect': return Lab.connect(circuit,a.from,a.to);
    case 'circuit_simulate': return Lab.solve(circuit);
    case 'circuit_visualize': return Lab.toSvg(circuit);
    case 'circuit_inspect': return circuit;
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
