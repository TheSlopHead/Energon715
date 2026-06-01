import { useEffect, useRef, useMemo } from 'react'
import styles from './Landing.module.css'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    char: string
}

export default function Landing({ scrollProgress }: { scrollProgress: number }) {
    const sectionRef = useRef<HTMLElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number>(0)

    // сколько частиц будет создано при запуске эффекта
    const PARTICLE_COUNT = 120

    // прогресс для управления анимацией
    const p = Math.min(scrollProgress / 0.35, 1) // 0..1 за первые 35% скролла
    const showParticles = scrollProgress > 0.15

    // --- генерация частиц при первом появлении ---
    useEffect(() => {
        if (!showParticles || particlesRef.current.length > 0) return

        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2

        const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2
            const speed = 1.5 + Math.random() * 4
            return {
                x: cx + (Math.random() - 0.5) * 40, // небольшой разброс вокруг центра
                y: cy + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                char: Math.random() > 0.5 ? '0' : '1',
            }
        })
        particlesRef.current = newParticles
    }, [showParticles])

    // --- цикл анимации частиц ---
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const section = sectionRef.current
        if (!section) return

        const resize = () => {
            canvas.width = section.clientWidth
            canvas.height = section.clientHeight
        }
        resize()
        window.addEventListener('resize', resize)

        let lastTime = performance.now()

        const animate = (time: number) => {
            const dt = Math.min(0.05, (time - lastTime) / 1000) // секунды, кап 50 мс
            lastTime = time

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const particles = particlesRef.current
            if (particles.length === 0) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            // скорость разлёта зависит от p (чем больше скролл, тем быстрее)
            const speedMultiplier = 0.8 + p * 3.5

            // обновляем и рисуем
            particles.forEach(particle => {
                // движение
                particle.x += particle.vx * speedMultiplier * dt * 60
                particle.y += particle.vy * speedMultiplier * dt * 60
                // затухание жизни (от скролла тоже зависит: дальше – быстрее исчезают)
                particle.life -= dt * (0.15 + p * 1.2)
                if (particle.life < 0) particle.life = 0

                const alpha = particle.life * (0.6 + p * 0.4)
                ctx.globalAlpha = alpha
                ctx.fillStyle = p > 0.6 ? '#f05d5e' : '#d1d2f9' // по мере углубления цвет меняется
                ctx.font = `${14 + p * 4}px monospace`
                ctx.fillText(particle.char, particle.x, particle.y)
            })

            // удаляем отжившие
            particlesRef.current = particles.filter(p => p.life > 0.01)

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('resize', resize)
        }
    }, [p]) // перезапускаем анимацию при изменении p для актуальной скорости

    return (
        <section ref={sectionRef} className={styles.landing}>
            {/* Canvas для частиц */}
            <canvas
                ref={canvasRef}
                className={styles.particleCanvas}
                style={{ opacity: showParticles ? 1 : 0 }}
            />

            {/* Основной текст */}
            <div
                className={styles.core}
                style={{
                    opacity: 1 - p * 0.85,
                    transform: `
                        scale(${1 + p * 0.5})
                        translateY(${p * -20}px)
                    `,
                    filter: `blur(${p * 2}px)`,
                }}
            >
                <div className={styles.title}>ENERGON_715</div>

                <div className={styles.subtitle}>
                    MEME DEVELOPER
                </div>

                <div className={styles.subtitle}>
                    PERSONALITY BREAKDOWN
                </div>

                <div className={styles.enter}>
                    SCROLL
                </div>
            </div>
        </section>
    )
}