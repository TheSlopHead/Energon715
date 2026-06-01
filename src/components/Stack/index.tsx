import { useEffect, useState, useRef } from 'react'
import styles from './Stack.module.css'
import { useIsMobile } from '../../hooks/useIsMobile'

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
    const isMobile = useIsMobile()
    const [angle, setAngle] = useState(0)
    const [visible, setVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)
    const rafRef = useRef<number>(0)

    // Отслеживаем видимость секции
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.3 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    // Вращение только на десктопе
    useEffect(() => {
        if (isMobile) return   // на мобильных не крутим

        let lastTime = performance.now()
        const speed = 0.3

        const animate = (time: number) => {
            const delta = (time - lastTime) / 1000
            lastTime = time
            setAngle(prev => (prev + delta * speed) % (Math.PI * 2))
            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafRef.current)
    }, [isMobile])

    return (
        <section ref={sectionRef} className={styles.stack}>
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
                                className={`${styles.skill} ${visible ? styles.visible : ''}`}
                                style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                    borderColor: colors[i],
                                    '--glow-color': colors[i] + '80',     // ← добавили
                                    transitionDelay: `${i * 0.05}s`,      // ← добавили
                                } as React.CSSProperties}
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