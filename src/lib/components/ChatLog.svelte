<script lang="ts">
	import { relativeTime } from '../github';
	import { newNoteUrl, type Note } from '../notes';
	import { projects } from '../projects';

	let { notes, working, error, now }: { notes: Note[]; working: string | null; error: string; now: Date } = $props();

	let text = $state('');
	let slug = $state('');
	let flag = $state(false);
	let sent = $state(false);

	const accent = (s: string | null) => projects.find((p) => p.slug === s)?.accent ?? 'var(--ink)';

	function send(e: SubmitEvent) {
		e.preventDefault();
		const msg = text.trim();
		if (!msg) return;
		window.open(newNoteUrl(msg, slug, flag), '_blank', 'noopener');
		text = '';
		sent = true;
	}
</script>

<section class="chat" aria-labelledby="chat-title">
	<header class="chat-head">
		<h2 class="block-title" id="chat-title">Project log</h2>
		<span class="note">Working on: <strong>{working ?? 'nothing flagged'}</strong></span>
	</header>

	<!-- newest first in the DOM; column-reverse puts the newest at the bottom and keeps the scroll there -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<ol class="chat-log" tabindex="0" aria-label="Notes, newest first">
		{#each notes as n (n.id)}
			<li class="bubble" style="--accent: {accent(n.slug)}">
				<p class="bubble-text">{n.text}</p>
				{#if n.body}<p class="bubble-body">{n.body}</p>{/if}
				<p class="bubble-meta">
					{#if n.slug}<span class="pill pill-version">{n.slug}</span>{/if}
					{#if n.working}<span class="pill pill-working">Working on</span>{/if}
					<span>{n.author} · {relativeTime(n.date, now)}</span>
					<a href={n.htmlUrl} target="_blank" rel="noopener">reply</a>
				</p>
				{#each n.replies as r (r.id)}
					<div class="reply">
						<p class="bubble-body">{r.text}</p>
						<p class="bubble-meta"><span>{r.author} · {relativeTime(r.date, now)}</span></p>
					</div>
				{/each}
			</li>
		{:else}
			<li class="note">{error ? '' : 'No notes yet. Write the first one below.'}</li>
		{/each}
	</ol>
	{#if error}<p class="note note-error">Notes unavailable: {error}</p>{/if}

	<form class="chat-form" onsubmit={send}>
		<label class="sr-only" for="chat-project">Project</label>
		<select id="chat-project" bind:value={slug}>
			<option value="">General</option>
			{#each projects as p (p.slug)}<option value={p.slug}>{p.slug}</option>{/each}
		</select>
		<label class="sr-only" for="chat-text">Note</label>
		<input id="chat-text" type="text" bind:value={text} maxlength="200" placeholder="What's happening?" required />
		<label class="chat-flag"><input type="checkbox" bind:checked={flag} disabled={!slug} /> Working on this</label>
		<button class="btn btn-primary" type="submit">Send</button>
	</form>
	<p class="note" role="status">
		{sent ? 'Submit the note on the GitHub tab that opened, then press refresh here.' : 'Send opens GitHub to post the note (sign-in needed).'}
	</p>
</section>
