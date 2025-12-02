import { useRef, useCallback, TouchEvent as ReactTouchEvent } from 'react';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

interface SwipeGestureOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe (default: 50)
  velocityThreshold?: number; // Minimum velocity in px/ms (default: 0.3)
  enabled?: boolean; // Enable/disable gestures (default: true)
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.3,
    enabled = true
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchEnd.current = null;
  }, [enabled]);

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!enabled || !touchStart.current) return;
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, [enabled]);

  const onTouchEnd = useCallback(() => {
    if (!enabled || !touchStart.current || !touchEnd.current) {
      touchStart.current = null;
      touchEnd.current = null;
      return;
    }

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;
    
    // Calculate velocity (px/ms)
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Determine if it's a horizontal or vertical swipe
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    
    // Check if swipe meets threshold or velocity requirements
    const meetsThreshold = distance >= threshold || velocity >= velocityThreshold;

    if (meetsThreshold) {
      if (isHorizontal) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [enabled, threshold, velocityThreshold, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
