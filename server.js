const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const Projects = require('./project-store.js');
const root = __dirname;
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json' };
http.createServer((req,res)=>{
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (pathname === '/api/projects') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (req.method === 'GET') { res.writeHead(200); return res.end(JSON.stringify({projects:Projects.read()})); }
      if (req.method === 'PUT') {
        let body='';req.setEncoding('utf8');req.on('data',chunk=>body+=chunk);req.on('end',()=>{try{const project=JSON.parse(body);project.updatedAt=new Date().toISOString();Projects.save(project);res.writeHead(200);res.end(JSON.stringify(project));}catch(error){res.writeHead(400);res.end(JSON.stringify({error:error.message}));}});return;
      }
      res.writeHead(405);return res.end(JSON.stringify({error:'Method not allowed'}));
    } catch(error) { res.writeHead(500);return res.end(JSON.stringify({error:error.message})); }
  }
  const projectMatch=pathname.match(/^\/api\/projects\/([^/]+)$/);
  if(projectMatch){
    if(req.method!=='DELETE'){res.writeHead(405);return res.end('Method not allowed');}
    try{Projects.remove(projectMatch[1]);res.writeHead(204);return res.end();}catch(error){res.writeHead(500);return res.end(error.message);}
  }
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolved=path.resolve(root,file);
  if(!resolved.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  fs.readFile(resolved,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
}).listen(process.env.PORT||4173,process.env.HOST||'0.0.0.0',()=>console.log(`ShortCircuit Lab ready on ${process.env.HOST||'0.0.0.0'}:${process.env.PORT||4173}`));
