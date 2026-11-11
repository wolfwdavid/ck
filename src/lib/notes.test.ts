import { describe, expect, it } from 'vitest';
import { newNoteUrl, parseNotes, workingOn } from './notes';

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
