import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";
import { LANES, SPAWN_MS, JUMP_HEIGHT, JUMP_DURATION } from "./config.js";
import { setupInput } from "./input.js";
import { setScore, onStart, setStartLabel, showOverlay } from "./ui.js";
import { resetObstacles, spawnObstacle, updateObstacles } from "./obstacles.js";

let scene, camera, renderer;
let player, laneIndex = 1;
let running = false;
let lastSpawn = 0;
let score = 0;

let isJumping = false;
let jumpStartTime = 0;
let groundY = 0.5;

let sceneryGroup;
const SCENERY_SPEED = 0.25;
const SCENERY_SPACING = 10;
const SCENERY_COUNT = 50;

function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xCDE6FF, 25, 85);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 3, 6);
  camera.lookAt(0, 1, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setClearColor(0x9fd2ff, 1);

  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x224400, 0.9);
  scene.add(hemi);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 2000),
    new THREE.MeshBasicMaterial({ color: 0x6CC57B })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.position.z = -40;
  scene.add(ground);

  for (let i = 0; i < LANES.length; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 120),
      new THREE.MeshBasicMaterial({ color: 0x245135 })
    );
    line.position.set(LANES[i], 0.03, -40);
    scene.add(line);
  }

  player = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x4f7cff })
  );
  player.position.set(LANES[laneIndex], groundY, 0);
  scene.add(player);

  addScenery();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setupInput({
    onLeft:  () => { if (!running) return; laneIndex = Math.max(0, laneIndex - 1); player.position.x = LANES[laneIndex]; },
    onRight: () => { if (!running) return; laneIndex = Math.min(LANES.length - 1, laneIndex + 1); player.position.x = LANES[laneIndex]; },
    onJump:  () => { if (!running || isJumping) return; startJump(); }
  });

  onStart(() => { startGame(); });

  showOverlay(true);
}

function addScenery() {
  sceneryGroup = new THREE.Group();
  scene.add(sceneryGroup);

  const leftX = -3.5, rightX = 3.5;
  for (let i = 0; i < SCENERY_COUNT; i++) {
    const z = -i * SCENERY_SPACING;
    sceneryGroup.add(makeTree(leftX, z));
    sceneryGroup.add(makeTree(rightX, z));
  }
}

function makeTree(x, z) {
  const tree = new THREE.Group();

  const trunkH = 0.9 + Math.random() * 0.7;
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, trunkH, 0.18),
    new THREE.MeshBasicMaterial({ color: 0x8B5A2B })
  );
  trunk.position.y = trunkH / 2;
  tree.add(trunk);

  const variant = Math.random() < 0.5 ? "cone" : "ball";
  let crown;
  if (variant === "cone") {
    crown = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.1, 6),
      new THREE.MeshBasicMaterial({ color: 0x2E7D32 })
    );
    crown.position.y = trunkH + 0.6;
  } else {
    crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.MeshBasicMaterial({ color: 0x2E7D32 })
    );
    crown.position.y = trunkH + 0.55;
  }
  tree.add(crown);

  tree.position.set(x, 0, z);
  return tree;
}

function updateScenery() {
  if (!sceneryGroup) return;
  for (const obj of sceneryGroup.children) {
    obj.position.z += SCENERY_SPEED;
    if (obj.position.z > 5) {
      obj.position.z -= SCENERY_COUNT * SCENERY_SPACING;
      const trunk = obj.children[0];
      const crown = obj.children[1];
      const newH = 0.9 + Math.random() * 0.7;
      trunk.scale.y = newH / trunk.geometry.parameters.height;
      trunk.position.y = (newH / 2);
      crown.position.y = newH + (crown.geometry.type.includes("Cone") ? 0.6 : 0.55);
    }
  }
}
function startJump() {
  isJumping = true;
  jumpStartTime = performance.now();
}

function updateJump(currentTime) {
  if (!isJumping) return;
  const elapsed = currentTime - jumpStartTime;
  const progress = Math.min(1, elapsed / JUMP_DURATION);
  
  if (progress >= 1) {
    isJumping = false;
    player.position.y = groundY;
  } else {
    const jumpY = Math.sin(progress * Math.PI) * JUMP_HEIGHT;
    player.position.y = groundY + jumpY;
  }
}

function startGame() {
  resetObstacles(scene);
  laneIndex = 1;
  player.position.set(LANES[laneIndex], groundY, 0);
  isJumping = false;
  score = 0;
  setScore(score);
  setStartLabel("Restart");
  running = true;
  lastSpawn = performance.now();
  showOverlay(false);
}

function endGame() {
  running = false;
  setStartLabel("Game Over - Restart");
  showOverlay(true);
}

function loop(t) {
  requestAnimationFrame(loop);

  if (running) {
    updateJump(t);
    updateScenery();

    if (t - lastSpawn > SPAWN_MS) { spawnObstacle(scene); lastSpawn = t; }

    updateObstacles(scene, player.position.x, player.position.y, player.position.z, {
      onPass: () => { score += 1; setScore(score); },
      onHit:  () => { endGame(); }
    });
  }

  renderer.render(scene, camera);
}
init();
requestAnimationFrame(loop);
