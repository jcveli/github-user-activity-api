require('dotenv').config();


const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');


const app = express()

app.use(express.static('app.jsx'));

const PORT = process.env.PORT;


const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const capitalize = (str = '') => str.charAt(0).toUpperCase() + str.slice(1);

function describe({ type, action, ref_type, repo, count }) {
    switch (type) {
        case 'PushEvent':
            return `Pushed ${plural(count, 'commit')} to ${repo}`;
        case 'IssuesEvent':
            return `${capitalize(action)} ${plural(count, 'issue')} in ${repo}`;
        case 'IssueCommentEvent':
            return `Commented on ${plural(count, 'issue')} in ${repo}`;
        case 'PullRequestEvent':
            return `${capitalize(action)} ${plural(count, 'pull request')} in ${repo}`;
        case 'PullRequestReviewEvent':
            return `Reviewed ${plural(count, 'pull request')} in ${repo}`;
        case 'WatchEvent':
            return `Starred ${repo}`;
        case 'ForkEvent':
            return `Forked ${repo}`;
        case 'CreateEvent':
            return `Created ${plural(count, ref_type)} in ${repo}`;
        case 'DeleteEvent':
            return `Deleted ${plural(count, ref_type)} in ${repo}`;
        case 'ReleaseEvent':
            return `${capitalize(action)} ${plural(count, 'release')} in ${repo}`;
        case 'PublicEvent':
            return `Made ${repo} public`;
        default:
            return `${plural(count, type.replace(/Event$/, '') + ' event')} in ${repo}`;
    }
}

function summarizeActivity(events) {
    const counts = new Map();

    for (const event of events) {
        const { type, repo, payload } = event;
        const action = payload.action ?? '';
        const refType = payload.ref_type ?? '';
        const key = `${type}:${action}:${refType}:${repo.name}`;

        const entry = counts.get(key) ?? { type, action, ref_type: refType, repo: repo.name, count: 0 };
        entry.count += type === 'PushEvent' ? (payload.size ?? 1) : 1;
        counts.set(key, entry);
    }

    return [...counts.values()].map((entry) => `- ${describe(entry)}`);
}

app.get('/activity', async (req, res) => {
  const user = req.query.user;


  if (!user) {
    return res.status(400).json({ error: 'Missing "user" query parameter.' });
  }

  try{
    const response = await axios.get(`https://api.github.com/users/${encodeURIComponent(user)}/events`);
    const lines = summarizeActivity(response.data);
    res.type('text/plain').send(`Output:\n${lines.join('\n')}`);
  }
  catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user activity.' });
  }
});

app.listen(PORT, () => {
  console.log(`Github User Activity API server in ${PORT}.`);
});