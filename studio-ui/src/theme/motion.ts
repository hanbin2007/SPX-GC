/** Material 3 motion tokens (m3.material.io/styles/motion/easing-and-duration). */
export const easing = {
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)'
} as const;

export const duration = {
  short2: 100, short3: 150, short4: 200,
  medium1: 250, medium2: 300, medium3: 350, medium4: 400,
  long1: 450, long2: 500
} as const;

/** The same curves as tuples for the motion library. */
export const ease = {
  emphasized: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  standard: [0.2, 0, 0, 1]
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Spring used for layout moves: quick, no visible overshoot. */
export const layoutSpring = { type: 'spring', stiffness: 520, damping: 42, mass: 0.9 } as const;

export function transition(properties: string[], ms: number = duration.medium1, curve: string = easing.standard) {
  return properties.map((property) => `${property} ${ms}ms ${curve}`).join(', ');
}
