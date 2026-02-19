import { useState, useCallback, useRef, useEffect } from 'react';
import { ANIMATION_STEP } from '@/constants';

export const useTreeAnimation = () => {
  const [growth, setGrowth] = useState(0);
  const frameRef = useRef<number>(0);

  const animate = useCallback(() => {
    setGrowth(prev => {
      if (prev >= 1) return 1;
      frameRef.current = requestAnimationFrame(animate);
      return prev + ANIMATION_STEP;
    });
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const resetGrowth = useCallback((val = 0) => {
    cancelAnimationFrame(frameRef.current);
    setGrowth(val);
  }, []);

  return { growth, animate, resetGrowth };
};
