import { useEffect, useRef } from 'react'
import { links } from '../../data/links'

interface Props {
    onNodesReady: (nodes: { id: string; x: number; y: number }[]) => void
    scrollProgress: number
    isMobile: boolean
}

const ARMS = 2
const TURNS = 3.2

function noise1(x: number, seed: number): number {
    return (
        Math.sin(x * 1.3 + seed * 7.1) * 0.50 +
        Math.sin(x * 2.7 + seed * 3.3) * 0.30 +
        Math.sin(x * 5.1 + seed * 1.9) * 0.15 +
        Math.sin(x * 11.3 + seed * 0.7) * 0.05
    )
}

interface Point {
    x: number; y: number; frac: number; nx: number; ny: number
}

interface VoidZone {
    center: number; width: number; side: string; inside: boolean
}

interface Profile {
    thick: number; voids: VoidZone[]; seed: number
}

function buildGalaxyArm(armIdx: number, pointsPerArm: number): Point[] {
    const pts: Point[] = []
    const armOffset = (armIdx / ARMS) * Math.PI * 2

    for (let i = 0; i < pointsPerArm; i++) {
        const frac = i / (pointsPerArm - 1)
        const theta = frac * Math.PI * 2 * TURNS + armOffset
        const r = frac * 0.48
        const scatter = noise1(frac * 4, armIdx * 3.7) * 0.04 * frac

        const x = r * Math.cos(theta) + scatter
        const y = r * Math.sin(theta) + scatter * 0.7

        const theta2 = (frac + 0.004) * Math.PI * 2 * TURNS + armOffset
        const r2 = (frac + 0.004) * 0.48
        const x2 = r2 * Math.cos(theta2)
        const y2 = r2 * Math.sin(theta2)
        const tx = x2 - x, ty = y2 - y
        const len = Math.sqrt(tx * tx + ty * ty) || 1

        pts.push({ x, y, frac, nx: -ty / len, ny: tx / len })
    }
    return pts
}

function makeProfile(armIdx: number, count: number): Profile[] {
    const seed = armIdx * 13.7
    const peakCount = 2 + Math.floor(Math.random() * 3)
    const peaks = Array.from({ length: peakCount }, () => ({
        pos: 0.1 + Math.random() * 0.8,
        width: 0.08 + Math.random() * 0.2,
        height: 0.4 + Math.random() * 0.6,
    }))
    const voidCount = 3 + Math.floor(Math.random() * 5)
    const voids: VoidZone[] = Array.from({ length: voidCount }, () => ({
        center: Math.random(),
        width: 0.01 + Math.random() * 0.06,
        side: Math.random() < 0.5 ? 'left' : 'right',
        inside: Math.random() < 0.4,
    }))
    return Array.from({ length: count }, (_, i) => {
        const frac = i / (count - 1)
        let thick = 0.15
        for (const pk of peaks) {
            const d = (frac - pk.pos) / pk.width
            thick += pk.height * Math.exp(-d * d * 3)
        }
        thick += noise1(frac * 8, seed) * 0.2
        thick *= (1 - frac * 0.4)
        return { thick: Math.max(0.05, Math.min(1, thick)), voids, seed }
    })
}

function charByFill(fill: number): string {
    if (fill < 0.12) return ' '
    if (fill < 0.25) return [' ', '.', ''][Math.floor(Math.random() * 3)]
    if (fill < 0.42) return ['.', '·', '01', '+'][Math.floor(Math.random() * 4)]
    if (fill < 0.62) return ['10', '+', '*', '10'][Math.floor(Math.random() * 4)]
    if (fill < 0.82) return ['01', '#', '01'][Math.floor(Math.random() * 3)]
    return ['1', '0'][Math.floor(Math.random() * 2)]
}

function waveColor(_frac: number, _pi: number, layerT: number, t: number, flowBright: number): string {
    const pulse = Math.sin(t * 1.5 + _frac * 6) * 0.5 + 0.5
    const h = layerT > 0.5
        ? 349 - (1 - layerT) * 2 * (349 - 239) * pulse
        : 43
    const s = layerT > 0.5 ? 60 + pulse * 20 : 28
    const l = 15 + layerT * 55 + pulse * 8 + flowBright * 35
    return `hsl(${h | 0},${s | 0}%,${Math.min(95, l) | 0}%)`
}

export default function SpiralCanvas({ onNodesReady, scrollProgress, isMobile }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const scrollRef = useRef(0)

    useEffect(() => {
        scrollRef.current = scrollProgress
    }, [scrollProgress])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Параметры для мобильных
        const POINTS_PER_ARM = isMobile ? 80 : 320
        const MAX_THICK = isMobile ? 6 : 12
        const VOID_AMT = isMobile ? 0.5 : 0.35
        const ORGANIC_K = isMobile ? 0.3 : 0.6
        const USE_GLOW = !isMobile
        const USE_GLITCH = !isMobile

        // offscreen canvas для свечения (если нужно)
        let glow: HTMLCanvasElement | null = null
        let glowCtx: CanvasRenderingContext2D | null = null
        if (USE_GLOW) {
            glow = document.createElement('canvas')
            glowCtx = glow.getContext('2d')!
        }

        // Генерируем рукава один раз
        const pointSets: Point[][] = Array.from({ length: ARMS }, (_, i) => buildGalaxyArm(i, POINTS_PER_ARM))
        const profiles: Profile[][] = Array.from({ length: ARMS }, (_, i) => makeProfile(i, POINTS_PER_ARM))

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            if (glow) {
                glow.width = canvas.width
                glow.height = canvas.height
            }
            computeAndSendNodes()
        }

        function toScreen(x: number, y: number, sc: number, cx: number, cy: number) {
            return { sx: cx + x * sc, sy: cy + y * sc }
        }

        function computeAndSendNodes() {
            const sp = scrollRef.current
            const scaleBoost = 1 + sp * 2.2
            const sc = Math.min(canvas.width, canvas.height) * 1.4 * scaleBoost
            const cx = canvas.width / 2
            const cy = canvas.height / 2

            const nodes = links.map(link => {
                const armIdx = link.pathIdx % ARMS
                const pts = pointSets[armIdx]
                const idx = Math.round(link.frac * (pts.length - 1))
                const pt = pts[idx]
                const { sx, sy } = toScreen(pt.x, pt.y, sc, cx, cy)
                return { id: link.id, x: sx, y: sy }
            })
            onNodesReady(nodes)
        }

        resize()
        window.addEventListener('resize', resize)

        let t = 0
        let glitchTimer = 0
        let glitchActive = false
        let glitchBlocks: { x: number; y: number; w: number; h: number; dx: number; col: string }[] = []
        let rafId: number
        let lastSp: number | null = null

        function triggerGlitch() {
            if (!USE_GLITCH) return
            glitchActive = true
            glitchBlocks = Array.from({ length: 8 + Math.floor(Math.random() * 10) }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                w: 20 + Math.random() * 80,
                h: 20 + Math.random() * 80,
                dx: (Math.random() - 0.5) * 30,
                col: Math.random() > 0.5 ? 'rgba(240,93,94,0.9)' : 'rgba(209,210,249,0.6)',
            }))
            setTimeout(() => { glitchActive = false }, 500 + Math.random() * 300)
        }

        function frame() {
            t += 0.001
            const sp = scrollRef.current

            // На мобильных обновляем узлы реже (каждые ~100 мс)
            if (!isMobile && (lastSp === null || Math.abs(sp - lastSp) > 0.001)) {
                computeAndSendNodes()
                lastSp = sp
            } else if (isMobile && (lastSp === null || Math.abs(sp - lastSp) > 0.05)) {
                computeAndSendNodes()
                lastSp = sp
            } else if (lastSp === null) {
                computeAndSendNodes()
                lastSp = sp
            }

            const scaleBoost = 1 + sp * 2.2
            const sc = Math.min(canvas.width, canvas.height) * 1.4 * scaleBoost
            const cx = canvas.width / 2
            const cy = canvas.height / 2

            const globalAlphaScale = 0.2 + (1 - sp) * 0.8
            const fadeScale = 1 - sp * 0.6

            ctx.fillStyle = '#060608'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            if (glowCtx) glowCtx.clearRect(0, 0, glow!.width, glow!.height)

            pointSets.forEach((pts, pi) => {
                const prof = profiles[pi]
                const branchPulse = Math.sin(t * 2.2 + pi * 1.7) * 0.5 + 0.5

                pts.forEach((pt, i) => {
                    const { thick, voids, seed } = prof[i]
                    const frac = pt.frac

                    const flowPhase = frac * 8 - t * 4 + pi * 1.3
                    const flowBright = Math.max(0, Math.sin(flowPhase)) *
                        Math.pow(Math.max(0, Math.sin(flowPhase)), 2)

                    const organicNoise = noise1(frac * 6 + t * 0.15, seed + pi) * ORGANIC_K
                    const baseThick = 0.35 + thick * 0.65
                    const pulseThick = 1 + branchPulse * 0.35
                    const localThick = Math.max(3, Math.round((baseThick + organicNoise * 0.2) * MAX_THICK * pulseThick))
                    const spread = localThick * (1 + frac * 2) * sc * 0.002

                    const isFlowHead = flowBright > 0.6

                    for (let layer = 0; layer < localThick; layer++) {
                        const layerT = localThick === 1 ? 0.5 : layer / (localThick - 1)
                        const offset = (layerT - 0.5) * spread

                        let inVoid = false
                        for (const v of voids) {
                            const d = Math.abs(frac - v.center) / v.width
                            if (d < 1) {
                                if (v.inside && Math.abs(layerT - 0.5) < 0.3 * (1 - d)) { inVoid = true; break }
                                if (!v.inside) {
                                    const sideT = v.side === 'left' ? layerT < 0.35 : layerT > 0.65
                                    if (sideT && d < 1 - Math.random() * 0.3) { inVoid = true; break }
                                }
                            }
                        }

                        if (inVoid && Math.random() < VOID_AMT) continue
                        if (!inVoid && Math.random() < VOID_AMT * 0.12) continue

                        const edgeDist = Math.abs(layerT - 0.5) * 2
                        const fill = (1 - edgeDist * edgeDist) * (0.5 + thick * 0.5)
                        const ch = charByFill(fill)
                        if (ch === ' ') continue

                        const micro = noise1(frac * 10 + layer, seed) * ORGANIC_K * sc * 0.001
                        const { sx, sy } = toScreen(
                            pt.x + pt.nx * offset * 0.001,
                            pt.y + pt.ny * offset * 0.001,
                            sc, cx, cy
                        )

                        const fsz = (4 + frac * 2 + thick * 0.6) * sc * 0.003 * fadeScale

                        ctx.globalAlpha = (0.25 + fill * 0.75) * globalAlphaScale
                        ctx.fillStyle = waveColor(frac, pi, 1 - edgeDist, t, flowBright)
                        ctx.font = `${fsz.toFixed(1)}px monospace`
                        ctx.fillText(ch, sx + micro, sy + micro)

                        if (USE_GLOW && isFlowHead && layer === Math.floor(localThick / 2)) {
                            glowCtx!.globalAlpha = flowBright * 0.9 * globalAlphaScale * (1 - sp)
                            glowCtx!.fillStyle = waveColor(frac, pi, 1, t, flowBright)
                            glowCtx!.font = `${(fsz * 1.4).toFixed(1)}px monospace`
                            glowCtx!.fillText(ch, sx, sy)
                        }
                    }
                })
            })

            // свечение
            if (USE_GLOW) {
                ctx.save()
                ctx.filter = 'blur(8px)'
                ctx.globalAlpha = 0.55
                ctx.globalCompositeOperation = 'screen'
                ctx.drawImage(glow!, 0, 0)
                ctx.restore()
                ctx.globalCompositeOperation = 'source-over'
            }

            // глитч
            if (USE_GLITCH) {
                glitchTimer += 0.009
                if (glitchTimer > 0.8 + Math.random() * 2) {
                    glitchTimer = 0
                    triggerGlitch()
                }
                if (glitchActive) {
                    glitchBlocks.forEach(b => {
                        try {
                            const src = ctx.getImageData(b.x | 0, b.y | 0, b.w | 0, b.h | 0)
                            const dst = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height)
                            for (let p = 0; p < dst.data.length; p += 4) {
                                const shift = Math.floor(b.dx * 0.4)
                                const srcIdx = Math.max(0, p - shift * 4)
                                dst.data[p] = src.data[Math.min(srcIdx, src.data.length - 4)]
                                dst.data[p + 1] = src.data[p + 1]
                                dst.data[p + 2] = src.data[Math.min(p + shift * 4, src.data.length - 2)]
                                dst.data[p + 3] = src.data[p + 3]
                            }
                            ctx.putImageData(dst, (b.x + b.dx * 0.3) | 0, b.y | 0)
                            ctx.globalAlpha = 0.25
                            ctx.strokeStyle = b.col
                            ctx.lineWidth = 1
                            ctx.strokeRect((b.x + b.dx * 0.3) | 0, b.y | 0, b.w | 0, b.h | 0)
                        } catch { }
                    })
                }
            }

            ctx.globalAlpha = 1
            rafId = requestAnimationFrame(frame)
        }

        frame()

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', resize)
        }
    }, [isMobile])

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        />
    )
}