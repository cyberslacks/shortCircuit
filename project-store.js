const fs = require('node:fs');
const path = require('node:path');

const file = process.env.SHORTCIRCUIT_PROJECTS_FILE || path.join(__dirname, 'data', 'projects.json');

function read() {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function write(projects) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify({ projects }, null, 2));
  fs.renameSync(temp, file);
  return projects;
}

function save(project) {
  if (!project || typeof project.id !== 'string' || !project.circuit || typeof project.circuit.name !== 'string') {
    throw new Error('A project id and named circuit are required');
  }
  const projects = read();
  const index = projects.findIndex(item => item.id === project.id);
  if (index < 0) projects.push(project);
  else projects[index] = project;
  write(projects);
  return project;
}

function remove(id) {
  const projects = read().filter(project => project.id !== id);
  write(projects);
  return projects;
}

module.exports = { read, write, save, remove };
