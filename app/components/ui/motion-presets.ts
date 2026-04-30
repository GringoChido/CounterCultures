/**
 * Shared Framer Motion presets — module-level constants so React doesn't
 * re-allocate the same object every render and Framer can memoize.
 * Reach for these instead of inline `animate={{...}}` literals when the
 * same animation appears in more than one place.
 */

// Simple fades
export const fadeIn = { opacity: 1 };
export const fadeOut = { opacity: 0 };

// Backdrop / overlay
export const overlayInitial = { opacity: 0 };
export const overlayAnimate = { opacity: 1 };
export const overlayExit = { opacity: 0 };

// Dialog body — slight rise + scale
export const dialogInitial = { opacity: 0, scale: 0.95, y: 10 };
export const dialogAnimate = { opacity: 1, scale: 1, y: 0 };
export const dialogExit = { opacity: 0, scale: 0.95, y: 10 };

// Slide-up (cards, sections)
export const slideUpInitial = { opacity: 0, y: 20 };
export const slideUpAnimate = { opacity: 1, y: 0 };

// Slide-down (dropdown, accordion expand)
export const slideDownInitial = { opacity: 0, y: -10 };
export const slideDownAnimate = { opacity: 1, y: 0 };
export const slideDownExit = { opacity: 0, y: -10 };

// Slide-in from right (drawer, slide-out panel)
export const slideRightInitial = { x: "100%" };
export const slideRightAnimate = { x: 0 };
export const slideRightExit = { x: "100%" };

// Standard transitions
export const transitionFast = { duration: 0.2 };
export const transitionMid = { duration: 0.3 };
export const transitionSlow = { duration: 0.5 };
export const transitionSpring = { type: "spring" as const, stiffness: 260, damping: 30 };
