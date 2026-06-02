import { useEffect, useState } from 'react'
import SpiralCanvas from './components/SpiralCanvas'
import SocialNodes from './components/SocialNodes'
import TerminalBar from './components/TerminalBar'
import { useScrollProgress } from './hooks/useScrollProgress'
import Landing from "./components/Landing"
import About from './components/About'
import Stack from "./components/Stack"
import Contact from './components/Contact'
import { useIsMobile } from './hooks/useIsMobile'

interface Node {
    id: string
    x: number
    y: number
}

function App() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const scrollProgress = useScrollProgress()
    const isMobile = useIsMobile()

    useEffect(() => {
        const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    return (
        <div style={{ height: '400vh' }}>

            {/* слой 0 — спираль */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <SpiralCanvas
                    onNodesReady={setNodes}
                    scrollProgress={scrollProgress}
                    isMobile={isMobile}
                />
            </div>

            {/* слой 1 — секции */}
            <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                <Landing scrollProgress={scrollProgress} />
                <About />
                <Stack />
                <Contact />
            </div>

            {/* слой 2 — ссылки на спирали, поверх всего */}
            {!isMobile && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
                    <SocialNodes nodes={nodes} mouse={mouse} />
                </div>
            )}

            {/* слой 3 — нижняя панель */}
            <TerminalBar />

        </div>
    )
}

export default App