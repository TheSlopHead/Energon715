import styles from './TerminalBar.module.css'

const links = [
    { id: 'github',   label: '// github',   url: 'https://github.com/TheSlopHead',     pathIdx: 0, frac: 0.4 },
    { id: 'telegram', label: '// telegram', url: 'https://t.me/orrishai',            pathIdx: 1, frac: 0.5 },
    { id: 'linkedin', label: '// linkedin', url: 'https://linkedin.com/in/ник', pathIdx: 2, frac: 0.5 },
    { id: 'mail',     label: '// mail',     url: 'theslophead@outlook.com',          pathIdx: 3, frac: 0.6 },
]

export default function TerminalBar() {
  return (
    <div className={styles.bar}>
      <span className={styles.prompt}>{'>'}</span>
      <span className={styles.name}>ENEGRON_715</span>
      <span className={styles.divider}>//</span>
      {links.map((link, i) => (
        <span key={link.label}>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
            {link.label}
          </a>
          {i < links.length - 1 && <span className={styles.sep}>·</span>}
        </span>
      ))}
      <span className={styles.cursor}>_</span>
    </div>
  )
}
