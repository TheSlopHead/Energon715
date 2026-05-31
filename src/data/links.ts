export interface SocialLink {
    id: string
    label: string
    url: string
    pathIdx: number
    frac: number
}

export const links: SocialLink[] = [
    { id: 'github',   label: '// github',   url: 'https://github.com/TheSlopHead',     pathIdx: 0, frac: 0.4 },
    { id: 'telegram', label: '// telegram', url: 'https://t.me/orrishai',            pathIdx: 1, frac: 0.5 },
    { id: 'linkedin', label: '// linkedin', url: 'https://linkedin.com/in/ник', pathIdx: 2, frac: 0.5 },
    { id: 'mail',     label: '// mail',     url: 'theslophead@outlook.com',          pathIdx: 3, frac: 0.6 },
]