import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedIndex = -1;
let query = '';
let pieData = [];

const projects = await fetchJSON('./lib/projects.json');
const container = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(projectsGiven, v => v.length, d => d.year);
  pieData = rolledData.map(([year, count]) => ({ value: count, label: year }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value(d => d.value);
  const arcData = sliceGenerator(pieData);

  svg.selectAll('path').remove();

  arcData.forEach((d, idx) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx))
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg.selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

        legend.selectAll('li')
          .attr('class', (_, i) =>
            i === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

        const selectedYear = selectedIndex === -1 ? null : pieData[selectedIndex].label;
        const filtered = projects.filter(p => {
          const values = Object.values(p).join('\n').toLowerCase();
          const matchSearch = values.includes(query.toLowerCase());
          const matchYear = selectedYear ? p.year === selectedYear : true;
          return matchSearch && matchYear;
        });

        renderProjects(filtered, container, 'h2');
      });
  });

  legend.selectAll('*').remove();

  pieData.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color: ${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        legend.selectAll('li')
          .attr('class', (_, i) =>
            i === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

        svg.selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

        const selectedYear = selectedIndex === -1 ? null : pieData[selectedIndex].label;
        const filtered = projects.filter(p => {
          const values = Object.values(p).join('\n').toLowerCase();
          const matchSearch = values.includes(query.toLowerCase());
          const matchYear = selectedYear ? p.year === selectedYear : true;
          return matchSearch && matchYear;
        });

        renderProjects(filtered, container, 'h2');
      });
  });
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  const selectedYear = selectedIndex === -1 ? null : pieData[selectedIndex].label;

  const filtered = projects.filter(p => {
    const values = Object.values(p).join('\n').toLowerCase();
    const matchSearch = values.includes(query.toLowerCase());
    const matchYear = selectedYear ? p.year === selectedYear : true;
    return matchSearch && matchYear;
  });

  renderProjects(filtered, container, 'h2');
});

if (projects?.length > 0) {
  renderProjects(projects, container, 'h2');
  renderPieChart(projects);
  if (title) title.textContent = `Projects (${projects.length})`;
} else {
  container.innerHTML = `<p>No projects to display at the moment.</p>`;
  if (title) title.textContent = `Projects (0)`;
}