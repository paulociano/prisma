/** Unified deadzone for analog movement. Digital D-pad inputs are evaluated separately. */
export const GAMEPAD_DEADZONE = 0.4;

export function readAxis(value: number, deadzone = GAMEPAD_DEADZONE): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = Math.max(-1, Math.min(1, value));
  return Math.abs(normalized) > deadzone ? normalized : 0;
}
