import { useEffect, useRef, useState } from "react";

// Whether `content` is taller than the scroll area `container` it sits in.
// Pages use it to leave room at the bottom for the status bubbles only when
// they scroll: always adding it would make a page that fits scroll too. Adding
// that room doesn't change the answer (it's the container's padding, not the
// content's height), so it can't flip back and forth.
export function useOverflowing<
  TContainer extends HTMLElement = HTMLElement,
  TContent extends HTMLElement = HTMLElement,
>() {
  const containerRef = useRef<TContainer>(null);
  const contentRef = useRef<TContent>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // Called once on observe, then whenever either one changes size
    const observer = new ResizeObserver(() => {
      const paddingTop = parseFloat(getComputedStyle(container).paddingTop) || 0;
      setOverflowing(content.offsetHeight > container.clientHeight - paddingTop + 1);
    });
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return { containerRef, contentRef, overflowing };
}
