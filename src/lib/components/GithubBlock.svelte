<script lang="ts">
	import { relativeTime, type GithubStatus } from '../github';

	let { status, repo, now }: { status: GithubStatus | null; repo: string; now: Date } = $props();
	const repoUrl = $derived(`https://github.com/${repo}`);
</script>

<section class="block" aria-label="GitHub status">
	<h3 class="block-title">GitHub · <a href={repoUrl} target="_blank" rel="noopener">{repo}</a></h3>
	{#if !status}
		<p class="note">Loading repo…</p>
	{:else if status.state === 'not-found'}
		<p class="note">Repo not found yet — it appears here once it is created on GitHub.</p>
	{:else if status.state === 'rate-limited'}
		<p class="note note-error">
			GitHub rate-limited{status.cachedAt ? ` — showing cached data from ${relativeTime(status.cachedAt, now)}` : ', try again in a while'}.
		</p>
	{:else if status.state === 'error'}
		<p class="note note-error">GitHub unavailable: {status.message}</p>
	{:else}
		{#if status.rateLimited && status.cachedAt}
			<p class="note note-error">GitHub rate-limited — showing cached data from {relativeTime(status.cachedAt, now)}.</p>
		{/if}
		{#if status.commit}
			<dl class="kv">
				<dt>Latest</dt>
				<dd>
					<span class="commit-msg">{status.commit.message}</span>
					<br />
					<span class="note">
						{status.commit.author}{status.commit.author ? ' · ' : ''}{relativeTime(status.commit.date, now)} ·
						<a class="mono" href={status.commit.htmlUrl} target="_blank" rel="noopener">{status.commit.sha.slice(0, 7)}</a>
					</span>
				</dd>
				<dt>Deploy</dt>
				<dd>
					{#if status.run}
						<a href={status.run.htmlUrl} target="_blank" rel="noopener">{status.run.name || 'workflow'}</a>
						· {status.run.result} · {relativeTime(status.run.updatedAt, now)}
					{:else}
						deploys from branch{status.repo.defaultBranch ? ` ${status.repo.defaultBranch}` : ''}
					{/if}
				</dd>
			</dl>
		{:else}
			<p class="note">No commits yet.</p>
		{/if}
		<ul class="stats">
			<li class="stat"><span class="stat-value">{status.commit?.total ?? 0}</span><span class="stat-label">commits</span></li>
			<li class="stat"><span class="stat-value">{status.repo.openIssues}</span><span class="stat-label">open issues</span></li>
			<li class="stat">
				<span class="stat-value">{status.repo.pushedAt ? relativeTime(status.repo.pushedAt, now) : '—'}</span>
				<span class="stat-label">pushed</span>
			</li>
		</ul>
	{/if}
</section>
