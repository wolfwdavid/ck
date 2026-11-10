export type Project = { slug: string; repo: string; live: string; accent: string; devLive?: string };

export const OWNER = 'wolfwdavid';
export const DASHBOARD_REPO = 'wolfwdavid/ck';

export const projects: Project[] = [
	{
		slug: 'vegan-not-vegan',
		repo: 'wolfwdavid/ck-vegan-not-vegan',
		live: 'https://wolfwdavid.github.io/ck-vegan-not-vegan/',
		accent: '#b5551f',
		devLive: 'http://localhost:8743/vegan-not-vegan/'
	},
	{
		slug: 'contact-capture',
		repo: 'wolfwdavid/ck-contact-capture',
		live: 'https://wolfwdavid.github.io/ck-contact-capture/',
		accent: '#6b3fa0',
		devLive: 'http://localhost:8743/contact-capture/'
	},
	{
		slug: 'food-rescue',
		repo: 'wolfwdavid/ck-food-rescue',
		live: 'https://wolfwdavid.github.io/ck-food-rescue/',
		accent: '#2f7d4f',
		devLive: 'http://localhost:8743/food-rescue/'
	}
];

export function liveUrl(p: Project): string {
	return import.meta.env.DEV && p.devLive ? p.devLive : p.live;
}
