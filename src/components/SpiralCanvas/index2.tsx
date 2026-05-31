import { useEffect, useRef } from 'react'
import { links } from '../../data/links'
interface Props {
    onNodesReady: (nodes: { id: string; x: number; y: number }[]) => void
}

const pathDefs = [
    "M284.421 51.4994C216.417 25.9768 176.904 26.269 103.421 58.4994C25.7545 102.833 -82.9788 259.299 103.421 530.499C151.495 583.899 168.773 608.687 174.421 639.499",
    "M296.421 0.49942C546.037 12.6683 629.586 72.8414 670.421 282.499",
    "M92.4212 282.499C128.473 134.909 197.421 79.4994 314.421 88.4994C431.421 97.4994 508.119 152.342 566.421 274.499C627.098 624.721 440.206 612.104 289.421 424.499",
    "M380.421 330.499C401.926 324.635 399.906 318.229 390.421 305.499C344.857 286.627 335.331 294.056 343.421 335.499C343.067 346.543 420.259 418.28 453.421 351.499C494.948 193.508 431.588 172 277.421 165.499C163.43 214.785 138.545 269.146 179.421 424.499C189.522 474.873 201.032 514.991 215.156 548.499C247.296 624.745 292.977 666.765 366.421 717.499C495.608 760.023 566.569 760.313 690.421 717.499",
    "M215.156 548.499C381.806 666.046 468.085 698.146 615.421 644.499C720.192 628.881 768.175 598.54 813.421 463.499"
]

const SVG_W = 814
const SVG_H = 750

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

function buildPoints(path: SVGPathElement, count: number): Point[] {
    const total = path.getTotalLength()
    const pts: Point[] = []
    for (let i = 0; i < count; i++) {
        const frac = i / (count - 1)
        const pt = path.getPointAtLength(frac * total)
        const pt2 = path.getPointAtLength(Math.min((frac + 0.003) * total, total))
        const tx = pt2.x - pt.x, ty = pt2.y - pt.y
        const len = Math.sqrt(tx * tx + ty * ty) || 1
        pts.push({ x: pt.x, y: pt.y, frac, nx: -ty / len, ny: tx / len })
    }
    return pts
}

function makeProfile(pathIdx: number, count: number): Profile[] {
    const seed = pathIdx * 13.7
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
        return { thick: Math.max(0.05, Math.min(1, thick)), voids, seed }
    })
}

function charByFill(fill: number): string {
    if (fill < 0.12) return ' '
    if (fill < 0.25) return [' ', '.', '·'][Math.floor(Math.random() * 3)]
    if (fill < 0.42) return ['.', '·', '0', '+'][Math.floor(Math.random() * 4)]
    if (fill < 0.62) return ['1', '+', '*', '1'][Math.floor(Math.random() * 4)]
    if (fill < 0.82) return ['1', '#', '#'][Math.floor(Math.random() * 3)]
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

// --- Парсер якорных точек из d‑строки ---
function parsePathAnchors(d: string): { x: number; y: number }[] {
    const anchors: { x: number; y: number }[] = []
    const cmdRegex = /([MLC])\s*([-\d.\s]+)/gi
    let match: RegExpExecArray | null

    while ((match = cmdRegex.exec(d)) !== null) {
        const cmd = match[1].toUpperCase()
        const nums = match[2].trim().split(/\s+/).map(Number)

        if (cmd === 'M') {
            anchors.push({ x: nums[0], y: nums[1] })
        } else if (cmd === 'C') {
            // последняя пара — конечная точка сегмента
            const endX = nums[nums.length - 2]
            const endY = nums[nums.length - 1]
            anchors.push({ x: endX, y: endY })
        }
    }
    return anchors
}

export default function SpiralCanvas({ onNodesReady }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Отдаём координаты якорей наружу один раз при монтировании


    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const glow = document.createElement('canvas')
        const glowCtx = glow.getContext('2d')!

        // невидимый SVG для вычисления точек
        const svgNS = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(svgNS, 'svg')
        svg.setAttribute('width', String(SVG_W))
        svg.setAttribute('height', String(SVG_H))
        svg.style.cssText = 'position:absolute;opacity:0;pointer-events:none;top:-9999px'
        document.body.appendChild(svg)

        const svgPaths = pathDefs.map(d => {
            const p = document.createElementNS(svgNS, 'path')
            p.setAttribute('d', d)
            svg.appendChild(p)
            return p as SVGPathElement
        })

        const pointSets = svgPaths.map(p => buildPoints(p, 300))
        const profiles = pathDefs.map((_, i) => makeProfile(i, 300))

        // размер canvas = размер окна
        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            glow.width = canvas.width
            glow.height = canvas.height
            computeAndSendNodes()
        }
        resize()
        window.addEventListener('resize', resize)
        let nodesReady = false

        function computeAndSendNodes() {
            const scaleX = canvas.width / SVG_W
            const scaleY = canvas.height / SVG_H
            const sc = Math.min(scaleX, scaleY) * 1.2
            const offsetX = (canvas.width - SVG_W * sc) / 2
            const offsetY = (canvas.height - SVG_H * sc) / 2

            const nodes = links.map(link => {
                const pts = pointSets[link.pathIdx]
                const idx = Math.round(link.frac * (pts.length - 1))
                const pt = pts[idx]
                return {
                    id: link.id,
                    x: offsetX + pt.x * sc,
                    y: offsetY + pt.y * sc,
                }
            })
            onNodesReady(nodes)
        }

        let t = 0
        let glitchTimer = 0
        let glitchActive = false
        let glitchBlocks: { x: number; y: number; w: number; h: number; dx: number; col: string }[] = []
        let rafId: number

        function triggerGlitch() {
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
            t += 0.003
            if (!nodesReady) {
                computeAndSendNodes()
                nodesReady = true
            }

            const maxThick = 12
            const voidAmt = 0.35
            const organicK = 0.6

            const scaleX = canvas.width / SVG_W
            const scaleY = canvas.height / SVG_H
            const sc = Math.min(scaleX, scaleY) * 1.2
            const offsetX = (canvas.width - SVG_W * sc) / 2
            const offsetY = (canvas.height - SVG_H * sc) / 2

            // фон
            ctx.fillStyle = '#060608'
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // очищаем glow canvas
            glowCtx.clearRect(0, 0, glow.width, glow.height)

            pointSets.forEach((pts, pi) => {
                const prof = profiles[pi]

                // пульсация толщины в ритме — одна синусоида на всю ветку
                const branchPulse = Math.sin(t * 2.2 + pi * 1.7) * 0.5 + 0.5

                pts.forEach((pt, i) => {
                    const { thick, voids, seed } = prof[i]
                    const frac = pt.frac

                    // ПОТОК: яркая волна бежит вдоль пути
                    const flowPhase = frac * 8 - t * 4 + pi * 1.3
                    const flowBright = Math.max(0, Math.sin(flowPhase)) * Math.pow(Math.max(0, Math.sin(flowPhase)), 2)

                    const organicNoise = noise1(frac * 6 + t * 0.15, seed + pi) * organicK
                    const baseThick = 0.35 + thick * 0.65

                    // пульсация толщины
                    const pulseThick = 1 + branchPulse * 0.35
                    const localThick = Math.max(3, Math.round((baseThick + organicNoise * 0.2) * maxThick * pulseThick))
                    const spread = localThick * (9 + frac * 5) * sc

                    // яркие символы в голове потока пишем в glow canvas
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

                        if (inVoid && Math.random() < voidAmt) continue
                        if (!inVoid && Math.random() < voidAmt * 0.12) continue

                        const edgeDist = Math.abs(layerT - 0.5) * 2
                        const fill = (1 - edgeDist * edgeDist) * (0.5 + thick * 0.5)
                        const ch = charByFill(fill)
                        if (ch === ' ') continue

                        const micro = noise1(frac * 20 + layer, seed) * organicK * 2.5 * sc
                        const wx = offsetX + pt.x * sc + pt.nx * offset + micro
                        const wy = offsetY + pt.y * sc + pt.ny * offset + micro
                        const fsz = (7 + frac * 5 + thick * 1.5) * sc

                        // основной символ
                        ctx.globalAlpha = 0.25 + fill * 0.75
                        ctx.fillStyle = waveColor(frac, pi, 1 - edgeDist, t, flowBright)
                        ctx.font = `${fsz.toFixed(1)}px monospace`
                        ctx.fillText(ch, wx, wy)

                        // голова потока → пишем в glow canvas крупнее
                        if (isFlowHead && layer === Math.floor(localThick / 2)) {
                            glowCtx.globalAlpha = flowBright * 0.9
                            glowCtx.fillStyle = waveColor(frac, pi, 1, t, flowBright)
                            glowCtx.font = `${(fsz * 1.4).toFixed(1)}px monospace`
                            glowCtx.fillText(ch, wx, wy)
                        }
                    }
                })
            })

            // накладываем свечение — один filter на весь canvas
            ctx.save()
            ctx.filter = 'blur(8px)'
            ctx.globalAlpha = 0.55
            ctx.globalCompositeOperation = 'screen'
            ctx.drawImage(glow, 0, 0)
            ctx.restore()
            ctx.globalCompositeOperation = 'source-over'

            // глитч
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
                            dst.data[p]     = src.data[Math.min(srcIdx, src.data.length - 4)]
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

            ctx.globalAlpha = 1
            rafId = requestAnimationFrame(frame)
        }

        frame()

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', resize)
            document.body.removeChild(svg)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block' }}
        />
    )
}