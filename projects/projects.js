import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('./lib/projects.json'); 
const container = document.querySelector('.projects');
const title = document.querySelector('.projects-title');

if (projects?.length > 0) {
  renderProjects(projects, container, 'h2');
  if (title) {
    title.textContent = `Projects (${projects.length})`;
  }
} else {
  container.innerHTML = `<p>No projects to display at the moment.</p>`;
  if (title) {
    title.textContent = `Projects (0)`;
  }
}

