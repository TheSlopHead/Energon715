import { useState, useEffect } from 'react'
import styles from './SocialNodes.module.css'
import { links } from '../../data/links'

interface Node {
    id: string
    x: number
    y: number
}

interface Props {
    nodes: Node[]
    mouse: { x: number; y: number }
}

const THRESHOLD = 160

export default function SocialNodes({ nodes, mouse }: Props) {
    const [activeId, setActiveId] = useState<string | null>(null)

    useEffect(() => {
        if (nodes.length === 0) return

        let closest: string | null = null
        let minDist = THRESHOLD

        nodes.forEach(node => {
            const dx = mouse.x - node.x
            const dy = mouse.y - node.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < minDist) {
                minDist = dist
                closest = node.id
            }
        })

        setActiveId(closest)
    }, [mouse, nodes])

    if (nodes.length === 0) return null

    return (
        <div className={styles.overlay}>
            {links.map(link => {
                const node = nodes.find(n => n.id === link.id)
                if (!node) return null
                const isActive = activeId === link.id

                return (
                    <div
                        key={link.id}
                        className={styles.wrapper}
                        style={{ left: node.x, top: node.y }}
                    >
                        {/* пульсирующая точка — всегда видна */}
                        {/* пульсирующая точка — всегда видна */}
                        <div className={styles.pulseRing} />
                        <div className={styles.dot}>◈</div>

                        {/* табличка — появляется при hover/активации */}
                        <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.card} ${isActive ? styles.active : ''}`}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.cardSymbol}>◈</span>
                                <span className={styles.cardId}>{link.id}</span>
                            </div>
                            <div className={styles.cardUrl}>{link.url}</div>
                            <div className={styles.cardHint}>// open link ↗</div>
                        </a>
                    </div>
                )
            })}
        </div>
    )
}