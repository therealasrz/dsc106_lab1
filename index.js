import { fetchGitHubData } from './global.js';

document.addEventListener('DOMContentLoaded', async () => {
  const profileStats = document.querySelector('#profile-stats');

  if (!profileStats) return;

  try {
    const githubData = await fetchGitHubData('therealasrz');

    profileStats.innerHTML = `
      <dl class="github-grid">
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  } catch (err) {
    console.error('GitHub fetch failed:', err);
    profileStats.innerHTML = `<p>Error fetching GitHub data.</p>`;
  }
});