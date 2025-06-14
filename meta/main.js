import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale, yScale
let commitProgress = 100;
let timeScale;
let filteredCommits = [];
let colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  let arr = d3.groups(data, d => d.commit).map(([commit, lines]) => {
    let first = lines[0];
    let { author, date, time, timezone, datetime } = first;
    let ret = {
      id: commit,
      url: 'https://github.com/therealasrz/dsc106_lab1/commit/' + commit,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };
    Object.defineProperty(ret, 'lines', {
      value: lines,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    return ret;
  });

  return arr.sort((a, b) => a.datetime - b.datetime);
}

function renderCommitInfo(data, commits) {
    const container = d3.select('#stats').append('div').attr('class', 'stats-grid');
  
    const stats = [
      { label: 'COMMITS', value: commits.length },
      { label: 'FILES', value: d3.groups(data, d => d.file).length },
      { label: 'TOTAL LOC', value: data.length },
      { label: 'MAX DEPTH', value: d3.max(data, d => d.depth) },
      { label: 'LONGEST LINE', value: d3.max(data, d => d.length) },
      { label: 'MAX LINES', value: d3.max(data, d => d.line) }
    ];
  
    stats.forEach(stat => {
      const box = container.append('div').attr('class', 'stat-box');
      box.append('div').attr('class', 'stat-label').text(stat.label);
      box.append('div').attr('class', 'stat-value').text(stat.value);
    });
  }

  function renderScatterPlot(data, commits) {
    
    const sortedCommits = d3.sort(commits, d => -d.totalLines);
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    xScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
  
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    const rScale = d3.scaleSqrt()
      .domain([minLines, maxLines])
      .range([2, 30]);
  
    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .attr('class', 'x-axis')      
      .call(d3.axisBottom(xScale));
  
    // Gridlines
    svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    const dots = svg.append('g').attr('class', 'dots');

    svg.call(d3.brush()
  .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
  .on('start brush end', brushed)
);
    svg.selectAll('.dots, .overlay ~ *').raise();
  
    dots.selectAll('circle')
      .data(sortedCommits,  d => d.id)
      .join( 
        enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .style('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(d);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        }),
      update => update
        .transition()
        .duration(300)
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines)),
      exit => exit.remove()
    )
    ;
    
  }
  
  
  function renderTooltipContent(commit) {
    document.getElementById('commit-link').href = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
    document.getElementById('commit-date').textContent = commit.date;
    document.getElementById('commit-time').textContent = commit.time;
    document.getElementById('commit-author').textContent = commit.author;
    document.getElementById('commit-lines').textContent = commit.totalLines;
  }
  
  function updateTooltipVisibility(isVisible) {
    document.getElementById('commit-tooltip').hidden = !isVisible;
  }
  
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  }

  function updateFileDisplay(filteredCommits) {

  let allLines = filteredCommits.flatMap(d => d.lines);
  let files = d3
    .groups(allLines, d => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });

  let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, d => d.name) 
    .join(
      enter =>
        enter
          .append('div')
          .call(div => {
            div.append('dt')
               .append('code');
            div.select('dt')
               .append('small');
            div.append('dd');
          }),
      update => update, 
      exit => exit.remove()
    );

filesContainer.select('dt > code')
    .text(d => d.name);

filesContainer.select('dt > small')
    .text(d => `${d.lines.length} lines`);

filesContainer.select('dd')
    .selectAll('div')     
    .data(d => d.lines)    
    .join('div')
      .attr('class', 'loc')
      .style('--color', d => colors(d.type));
}

  function brushed(event) {
    const selection = event.selection;
  
    d3.selectAll('circle')
      .classed('selected', (d) => isCommitSelected(selection, d));
  
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }
  
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const cx = xScale(commit.datetime);
    const cy = yScale(commit.hourFrac);
    return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
  }
  


  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  }
  
  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
  
    const lines = selectedCommits.flatMap((d) => d.lines);
    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);
  
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      `;
    }
  }

 function onTimeSliderChange() {
  commitProgress = document.getElementById('commit-progress').value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById('commit-time-display').textContent = 
    commitMaxTime.toLocaleString(undefined, { 
      dateStyle: "long", 
      timeStyle: "short" 
    });

  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateCommitInfo(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}


function updateScatterPlot(data, commits) {
  const svg = d3.select('#chart').select('svg');

  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)  
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('cx', (d) => xScale(d.datetime))
          .attr('cy', (d) => yScale(d.hourFrac))
          .attr('r', (d) => rScale(d.totalLines))
          .attr('fill', 'steelblue')
          .style('fill-opacity', 0.7)
          .style('cursor', 'pointer')
          .on('mouseenter', (event, d) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
          })
          .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
          }),
      (update) =>
        update
          .transition()
          .duration(300)
          .attr('cx', (d) => xScale(d.datetime))
          .attr('cy', (d) => yScale(d.hourFrac))
          .attr('r', (d) => rScale(d.totalLines)),
      (exit) => exit.remove()
    );
}

function updateCommitInfo(data, commits) {
  const container = d3.select('#stats').select('.stats-grid');

  const stats = [
    { label: 'COMMITS', value: commits.length },
    { label: 'FILES',   value: d3.groups(data, d => d.file).length },
    { label: 'TOTAL LOC', value: data.length },
    { label: 'MAX DEPTH', value: d3.max(data, d => d.depth) },
    { label: 'LONGEST LINE', value: d3.max(data, d => d.length) },
    { label: 'MAX LINES',   value: d3.max(data, d => d.line) }
  ];

  container.selectAll('.stat-box')
    .data(stats)
    .join('div')
    .attr('class', 'stat-box')
    .html(d => `
      <div class="stat-label">${d.label}</div>
      <div class="stat-value">${d.value}</div>
    `);
}

function getFilteredData(commits) {
  const commitIds = new Set(commits.map(c => c.id));
  return data.filter(d => commitIds.has(d.commit));
}

function onStepEnter(response) {

  const commitData = response.element.__data__;
  const selectedDate = commitData.datetime;

  filteredCommits = commits.filter(d => d.datetime <= selectedDate);

  updateScatterPlot(data, filteredCommits);
  updateCommitInfo(data, filteredCommits);
  updateFileDisplay(filteredCommits);
}
  
  const data = await loadData();
  const commits = processCommits(data);

  d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
    .attr('class', 'step')
    .html((d, i) => {
      return `
        <p>
          On ${d.datetime.toLocaleString('en', {
            dateStyle: 'full',
            timeStyle: 'short',
          })},<br/>
          I made <a href="${d.url}" target="_blank">${
            i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
          }</a>.<br/>
          I edited <strong>${d.totalLines}</strong> lines across <strong>${
            d3.rollups(d.lines, v => v.length, v => v.file).length
          }</strong> files.<br/>
          Then I looked over all I had made, and I saw that it was very good.
        </p>
      `;
    });

  timeScale = d3.scaleTime()
  .domain([
    d3.min(commits, d => d.datetime),
    d3.max(commits, d => d.datetime)
  ])
  .range([0, 100]);

  let commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = [...commits];

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);
  
  document.getElementById('commit-progress').addEventListener('input', onTimeSliderChange);
  onTimeSliderChange(); 


const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
    offset: 0.5
  })
  .onStepEnter(onStepEnter);
