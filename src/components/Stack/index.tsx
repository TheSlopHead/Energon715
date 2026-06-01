import { useEffect, useState, useRef } from 'react'
import styles from './Stack.module.css'

const skills = [
    'C', 'C++', 'Go', 'SQL',
    'React', 'TypeScript', 'Node.js',
    'Docker', 'Python', 'Git',
]

const colors = [
    '#a8b2ff', '#f05d5e', '#6ad4e6', '#cdc6a5',
    '#61dafb', '#3178c6', '#8cc84b', '#2496ed',
    '#ffd343', '#f14e32',
]

const RADIUS = 130

export default function Stack() {
    const [angle, setAngle] = useState(0)
    const rafRef = useRef<number>(0)

    useEffect(() => {
        let lastTime = performance.now()
        const speed = 0.3 // радиан в секунду (примерно 1 оборот за ~21 сек)

        const animate = (time: number) => {
            const delta = (time - lastTime) / 1000
            lastTime = time
            setAngle(prev => (prev + delta * speed) % (Math.PI * 2))
            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafRef.current)
    }, [])

    return (
        <section className={styles.stack}>
            <div className={styles.overlay} />

            <div className={styles.terminal}>
                <div className={styles.titleBar}>
                    <div className={`${styles.dot} ${styles.dotCore}`} />
                    <div className={`${styles.dot} ${styles.dotWave}`} />
                    <div className={`${styles.dot} ${styles.dotGlitch}`} />
                    <span className={styles.titleText}>stack.visual</span>
                </div>

                <div className={styles.orbit}>
                    {skills.map((skill, i) => {
                        const offset = (i / skills.length) * Math.PI * 2
                        const x = Math.cos(angle + offset) * RADIUS
                        const y = Math.sin(angle + offset) * RADIUS

                        return (
                            <div
                                key={skill}
                                className={styles.skill}
                                style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                    borderColor: colors[i],
                                    boxShadow: `0 0 8px ${colors[i]}40`,
                                }}
                            >
                                {skill}
                            </div>
                        )
                    })}

                    <div className={styles.core}>STACK</div>
                </div>
            </div>
        </section>
    )
}