import { useState, useEffect } from 'react'

export function useScrollProgress(): number {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        function handleScroll() {
            const scrollY = window.scrollY
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight
            setProgress(maxScroll > 0 ? scrollY / maxScroll : 0)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return progress
}