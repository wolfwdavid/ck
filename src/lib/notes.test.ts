import { describe, expect, it } from 'vitest';
import { attachReplies, newNoteUrl, parseNotes, workingOn } from './notes';

const issue = (over: Record<string, unknown>) => ({
	number: 1,
	title: 'A note',
	body: null,
	user: { login: 'wolfwdavid' },
	created_at: '2026-11-10T12:00:00Z',
	html_url: 'https://github.com/wolfwdavid/ck/issues/1',
	author_association: 'OWNER',
	labels: [],
	...over
});

describe('parseNotes', () => {
	it('maps labels to project and working flag', () => {
		const [n] = parseNotes([issue({ labels: [{ name: 'working-on' }, { name: 'food-rescue' }, { name: 'bug' }] })]);
		expect(n).toMatchObject({ text: 'A note', body: '', author: 'wolfwdavid', slug: 'food-rescue', working: true });
	});

	it('drops pull requests and issues from people without repo access', () => {
		const notes = parseNotes([issue({ pull_request: {} }), issue({ author_association: 'NONE' }), issue({ number: 2 })]);
		expect(notes.map((n) => n.id)).toEqual([2]);
	});

	it('returns nothing for a non-list body', () => {
		expect(parseNotes({ message: 'Not Found' })).toEqual([]);
	});
});

describe('attachReplies', () => {
	it('adds trusted and bot comments to their note, oldest first', () => {
		const c = (id: number, issue: number, login: string, assoc: string, body = 'text ' + id) => ({
			id, body, user: { login }, author_association: assoc, created_at: '2026-11-10T12:00:00Z',
			issue_url: 'https://api.github.com/repos/wolfwdavid/ck/issues/' + issue
		});
		const [n] = attachReplies(parseNotes([issue({})]), [
			c(4, 1, 'github-actions[bot]', 'NONE'),
			c(3, 1, 'stranger', 'NONE'),
			c(2, 99, 'wolfwdavid', 'OWNER'),
			c(1, 1, 'wolfwdavid', 'OWNER')
		]);
		expect(n.replies.map((r) => [r.id, r.author])).toEqual([[1, 'wolfwdavid'], [4, 'CK bot']]);
	});
});

describe('workingOn', () => {
	it('takes the newest flagged note that names a project', () => {
		const notes = parseNotes([
			issue({ labels: [{ name: 'working-on' }] }),
			issue({ labels: [{ name: 'working-on' }, { name: 'contact-capture' }] }),
			issue({ labels: [{ name: 'working-on' }, { name: 'food-rescue' }] })
		]);
		expect(workingOn(notes)).toBe('contact-capture');
		expect(workingOn([])).toBeNull();
	});
});

describe('newNoteUrl', () => {
	it('prefills title and labels', () => {
		const u = new URL(newNoteUrl('Board redesign & QA', 'food-rescue', true));
		expect(u.pathname).toBe('/wolfwdavid/ck/issues/new');
		expect(u.searchParams.get('title')).toBe('Board redesign & QA');
		expect(u.searchParams.get('labels')).toBe('food-rescue,working-on');
	});

	it('sends a general note without labels', () => {
		expect(new URL(newNoteUrl('hello', '', true)).searchParams.has('labels')).toBe(false);
	});
});
