const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const centerOverlay = document.getElementById("centerOverlay");

export function setScore(n) {
  scoreEl.textContent = String(n);
}

export function onStart(callback) {
  startBtn.addEventListener("click", callback);
}

export function setStartLabel(text) {
  startBtn.textContent = text;
}

export function showOverlay(show) {
  centerOverlay.classList.toggle("hidden", !show);
}
