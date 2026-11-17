// Refreshes docs/.vitepress/theme/contributors.json from the GitHub API.
// Usage: npm run contributors
// Some repos are private, so it needs a token: GITHUB_TOKEN, or your `gh auth login` session.
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPOS = [
  { repo: "twilighty-abhi/yuyu", label: "Yuyu" },
  { repo: "Kunj-Company/yuyu-android", label: "Android app" },
  { repo: "Kunj-Company/yuyu-ios", label: "iOS app" },
  { repo: "Kunj-Company/yuyu-dev-wiki", label: "This wiki" },
];

const headers = { Accept: "application/vnd.github+json", "User-Agent": "yuyu-dev-wiki" };
let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    token = execFileSync("gh", ["auth", "token"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // No gh session: fall through to anonymous requests, which only see public repos.
  }
}
if (token) headers.Authorization = `Bearer ${token}`;

const get = async (url) => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const people = new Map();
for (const { repo, label } of REPOS) {
  const list = await get(`https://api.github.com/repos/${repo}/contributors?per_page=100`);
  for (const c of list) {
    if (c.type !== "User") continue; // skip bots
    if (!people.has(c.login)) people.set(c.login, { login: c.login, url: c.html_url, avatar: c.avatar_url, repos: [] });
    people.get(c.login).repos.push({ repo: label, commits: c.contributions });
  }
}

const out = [];
for (const p of people.values()) {
  const user = await get(`https://api.github.com/users/${p.login}`);
  out.push({ ...p, name: user.name || p.login, total: p.repos.reduce((n, r) => n + r.commits, 0) });
}
out.sort((a, b) => b.total - a.total);

const file = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/.vitepress/theme/contributors.json");
writeFileSync(file, JSON.stringify({ updated: new Date().toISOString().slice(0, 10), repos: REPOS, contributors: out }, null, 2) + "\n");
console.log(`Wrote ${out.length} contributors to ${file}`);
