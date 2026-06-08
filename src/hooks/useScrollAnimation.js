import { useEffect, useRef } from 'react';

const defaultObserverOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
};

function observeElement(element, direction, delay, observerOptions) {
  element.classList.add('reveal', `reveal-${direction}`);
  if (delay) {
    element.style.setProperty('--reveal-delay', `${delay}ms`);
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        observer.unobserve(entry.target);
      }
    },
    observerOptions
  );

  observer.observe(element);
  return observer;
}

export function useReveal(direction = 'up', delay = 0, observerOptions = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = observeElement(
      element,
      direction,
      delay,
      { ...defaultObserverOptions, ...observerOptions }
    );
    return () => observer.disconnect();
  }, [direction, delay, observerOptions]);

  return ref;
}

export function useRevealChildren(childSelector, stagger = 60, direction = 'up') {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const elements = container.querySelectorAll(childSelector);
    const observers = [];

    elements.forEach((element, index) => {
      const observer = observeElement(
        element,
        direction,
        index * stagger,
        defaultObserverOptions
      );
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, [childSelector, stagger, direction]);

  return containerRef;
}
