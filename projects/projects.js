import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('./lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

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


