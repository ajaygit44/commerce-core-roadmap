import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());

// Path setup for static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname)));

const JQL = `project = "CORE PLANs" and status NOT IN (ToDo, Rejected, Duplicate, Closed, "On Hold", Backlog, "In review") and ("Business Priority[Select List (cascading)]" IN (P0) OR "Quarter[Dropdown]" IN ("Q3 2025 [Jul, Aug, Sept]","Q4 2025 [Oct, Nov, Dec]","Q1 2026 [Jan, Feb, Mar]")) and "Quarter[Dropdown]" != TBD ORDER BY cf[10470] ASC, cf[11536] ASC, cf[14375] ASC, cf[13615] ASC, status ASC`;

app.get('/dashboard', async (req, res) => {
  let allIssues = [];
  let nextPageToken = undefined;
  const maxResults = 100;

  try {
    do {
      const body = {
        jql: JQL,
        maxResults,
        fields: [
          "summary", 
          "status",
          "customfield_10545",  // Sponsor
          "customfield_10464",  // Merchant / Brand Name
          "customfield_13582",  // Initiative Type
          "customfield_10261",  // Product Manager
          "customfield_10055",  // Engineering Lead
          "reporter",           // Reporter
          "customfield_10470",  // Business Target Date
          "customfield_11536"   // Go-Live Date
        ],
      };

      if (nextPageToken) {
        body.nextPageToken = nextPageToken;
      }

      const response = await fetch(`https://${process.env.JIRA_DOMAIN}/rest/api/3/search/jql`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!data.issues || data.issues.length === 0) break;

      allIssues = allIssues.concat(data.issues);

      nextPageToken = data.nextPageToken;

      if (data.isLast || !nextPageToken) break;

    } while (allIssues.length < 200);

    allIssues = allIssues.slice(0, 200);

    res.json({ issues: allIssues });

  } catch (error) {
    console.error("Error fetching Jira data:", error);
    res.status(500).json({ error: 'Internal Server Error', details: error.toString() });
  }
});

// Explicitly serve index.html on the root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
  });

app.listen(process.env.PORT || 3000, () => {
  console.log(`Jira Dashboard API running on port ${process.env.PORT || 3000}`);
});