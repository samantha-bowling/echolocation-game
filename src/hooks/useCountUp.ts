import { useState, useEffect } from 'react';

export function useCountUp(end: number, duration: number = 1000, start: number = 0) {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    let startTime: number | null = null;
    const startValue = start;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(startValue + (end - startValue) * easeProgress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);
  
  return count;
}
