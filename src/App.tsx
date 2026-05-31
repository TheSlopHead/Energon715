import { useEffect, useRef, useState } from 'react'
import SpiralCanvas from './components/SpiralCanvas'
import SocialNodes from './components/SocialNodes'
import TerminalBar from './components/TerminalBar'

interface Node {
    id: string
    x: number
    y: number
}

function App() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [mouse, setMouse] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handler = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handler)
        return () => window.removeEventListener('mousemove', handler)
    }, [])

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <SpiralCanvas onNodesReady={setNodes} />
            <SocialNodes nodes={nodes} mouse={mouse} />
            <TerminalBar />
        </div>
    )
}

export default App