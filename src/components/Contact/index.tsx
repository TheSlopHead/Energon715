import { useEffect, useRef, useState } from 'react'
import styles from './Contact.module.css'
import PaperPlane from './PaperPlane'

export default function Contact() {
    const sectionRef = useRef<HTMLElement>(null)
    const [visible, setVisible] = useState(false)
    const [trigger, setTrigger] = useState(0)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setVisible(entry.isIntersecting)
            },
            { threshold: 0.4 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!visible) return
        const id = setInterval(() => {
            setTrigger(prev => prev + 1)
        }, 5000)
        return () => clearInterval(id)
    }, [visible])

    return (
        <section ref={sectionRef} className={styles.contact}>
            <div className={styles.overlay} />

            <div className={styles.content}>
                <div className={styles.title}>CONTACT</div>

                <div className={styles.subtitle}>
                    LET'S BUILD SOMETHING TOGETHER
                </div>

                <div className={styles.emailRow}>
                    {visible && (
                        <div key={trigger} className={styles.flightPath}>
                            <div className={styles.dashedLine} />
                            <div className={styles.plane}>
                                <PaperPlane className={styles.planeIcon} />
                            </div>
                        </div>
                    )}
                    <div className={styles.envelope}>✉</div>
                </div>

                <div className={styles.links}>
                    <a href="mailto:energon715@proton.me" className={styles.link}>
                        energon715@proton.me
                    </a>
                    <a href="https://github.com/energon715" target="_blank" rel="noopener noreferrer" className={styles.link}>
                        github.com/energon715
                    </a>
                </div>
            </div>
        </section>
    )
}