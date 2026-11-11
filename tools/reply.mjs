// Replies to a project-log thread (an issue on the dashboard repo) from GitHub Actions.
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const BOT = 'github-actions[bot]';
const TRUSTED = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/** Only people with repo access and the bot itself reach the model; strangers' text is dropped. */
export const trusted = (/** @type {any} */ item) => item?.user?.login === BOT || TRUSTED.includes(item?.author_association);

/**
 * The thread as a conversation: the bot's comments are assistant turns, everyone else is a user turn.
 * @param {any} issue
 * @param {any[]} comments oldest first
 * @returns {{ role: 'user' | 'assistant'; content: string }[]}
 */
export function buildMessages(issue, comments) {
	const labels = (issue.labels ?? []).map((/** @type {any} */ l) => l.name).join(', ');
	const first = `${issue.user.login} opened note #${issue.number}${labels ? ` [${labels}]` : ''}: ${issue.title}${issue.body ? `\n\n${issue.body}` : ''}`;
	const turns = [{ role: /** @type {'user' | 'assistant'} */ ('user'), content: first }];
	for (const c of comments.filter(trusted)) {
		if (!c.body?.trim()) continue;
		turns.push(c.user.login === BOT ? { role: 'assistant', content: c.body } : { role: 'user', content: `${c.user.login}: ${c.body}` });
	}
	return turns;
}

/** @param {any[]} issues open issues, newest first */
export function buildLog(issues) {
	return issues
		.filter((i) => !i.pull_request && trusted(i))
		.map((i) => {
			const labels = (i.labels ?? []).map((/** @type {any} */ l) => l.name).join(', ');
			return `#${i.number} ${i.created_at.slice(0, 10)} ${i.user.login}${labels ? ` [${labels}]` : ''}: ${i.title}`;
		})
		.join('\n');
}

const system = (/** @type {string} */ repo, /** @type {string} */ log) => `You are the project log assistant for the Cosmic Kitty (CK) dashboard. The team keeps a running log as issues on the GitHub repo ${repo}, and the dashboard shows that log as a chat. You answer inside one note's thread.

How the log works, so you can explain it and reason about it:
- Each open issue is one note. A label matching a project name ties the note to that project.
- The project "being worked on" is the project label on the newest open note that also carries the "working-on" label.
- Closing an issue removes the note from the dashboard.
- You can only post replies. You cannot add labels, close notes or change anything else, so when someone asks for that, tell them the exact label or step to use.

Use the log below to answer questions about what is being worked on, what happened recently and what is still open. If the log does not contain the answer, say so plainly instead of guessing.

Your reply is shown on the dashboard as plain text, so write plain sentences without Markdown, headings or tables. Keep it to a few sentences unless the person asks for more.

Today is ${new Date().toISOString().slice(0, 10)}. Open notes, newest first:
${log || '(none)'}`;

async function main() {
	const event = JSON.parse(readFileSync(/** @type {string} */ (process.env.GITHUB_EVENT_PATH), 'utf8'));
	const repo = /** @type {string} */ (process.env.GITHUB_REPOSITORY);
	const number = event.issue.number;

	const gh = async (/** @type {string} */ path, /** @type {RequestInit} */ init = {}) => {
		const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
			...init,
			headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
		});
		if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`);
		return res.json();
	};

	// shortcut: first 100 comments and 100 open notes only, page through if a thread or the log outgrows that
	const [comments, issues] = await Promise.all([gh(`/issues/${number}/comments?per_page=100`), gh('/issues?state=open&per_page=100')]);

	const response = await new Anthropic().beta.messages.create({
		model: 'claude-opus-5-5',
		max_tokens: 16000,
		output_config: { effort: 'low' },
		// if the model declines, the API reruns the request on a fallback model in the same call
		betas: ['server-side-fallback-2026-07-01'],
		fallbacks: 'default',
		system: system(repo, buildLog(issues)),
		messages: buildMessages(event.issue, comments)
	});

	const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('\n').trim();
	if (response.stop_reason === 'refusal' || !text) throw new Error(`No reply produced (stop_reason: ${response.stop_reason})`);

	await gh(`/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body: text }) });
	console.log(`Replied on #${number} (${response.usage.output_tokens} output tokens)`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
