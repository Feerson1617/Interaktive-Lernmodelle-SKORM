// Explicit application adapter. Other applications must implement their own policy.
const temporary = window.SCORM_CONTEXT?.classroomMode === true;
let value = 0;
if (!temporary) {
  try { value = Number(localStorage.getItem('scorm-example-turns')) || 0; } catch { /* usable without storage */ }
}
export function turn() {
  value += 1;
  if (!temporary) { try { localStorage.setItem('scorm-example-turns', String(value)); } catch { /* optional */ } }
  return value;
}
export function current() { return value; }
export const classroomMode = temporary;
