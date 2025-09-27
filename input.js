export function setupInput({ onLeft, onRight, onJump }) {
  function keydown(e) {
    if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft")  onLeft();
    if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") onRight();
    if (e.key === " " || e.key === "w" || e.key === "W" || e.key === "ArrowUp") onJump();
  }
  window.addEventListener("keydown", keydown);

  return () => window.removeEventListener("keydown", keydown);
}
