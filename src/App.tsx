import { useEffect, useState } from 'react'
import SpiralCanvas from './components/SpiralCanvas'
import SocialNodes from './components/SocialNodes'
import TerminalBar from './components/TerminalBar'
import { useScrollProgress } from './hooks/useScrollProgress'
import Landing from "./components/Landing";
import About from './components/About'
import Stack from "./components/Stack";
import Contact from './components/Contact'
interface Node {
    id: string
    x: number
    y: number
}

function App() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [mouse, setMouse] = useState({ x: 0, y: 0 })
    const scrollProgress = useScrollProgress()

    useEffect(() => {
        const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])
    console.log('scrollProgress:', scrollProgress)
    return (
        <div style={{ height: '400vh' }}>

            {/* canvas — фиксированный фон на весь скролл */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <SpiralCanvas onNodesReady={setNodes} scrollProgress={scrollProgress} />
                <SocialNodes nodes={nodes} mouse={mouse} />
            </div>

            {/* секции поверх */}
            <div style={{ position: 'relative', zIndex: 1 }}>

                {/* Экран 1 — Landing, высота 100vh */}
                <div className="sections">
                    <Landing scrollProgress={scrollProgress} />
                    <About />

                    <Stack />

                    <Contact />
                </div>

            </div>

            <TerminalBar />
        </div>
    )
}

export default App