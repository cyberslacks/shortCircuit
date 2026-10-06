const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json' };
http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolved=path.resolve(root,file);
  if(!resolved.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(resolved,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
}).listen(process.env.PORT||4173,process.env.HOST||'0.0.0.0',()=>console.log(`ShortCircuit Lab ready on ${process.env.HOST||'0.0.0.0'}:${process.env.PORT||4173}`));
