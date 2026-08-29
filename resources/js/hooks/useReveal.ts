// resources/js/hooks/useReveal.ts
import { useEffect, useRef, useState } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref. Once the element
 * scrolls into view, `visible` flips to true and stays true (no re-hide on
 * scroll-away, so content doesn't flicker if the user scrolls back and forth).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Respect reduced-motion preference — just show it immediately.
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin: '0px 0px -60px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, visible };
}

/** Count-up animation for stat numbers, triggered once `start` becomes true. */
export function useCountUp(target: number, start: boolean, duration = 1400) {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start) return;
        let raf: number;
        const startTime = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            // ease-out-cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [start, target, duration]);

    return value;
}