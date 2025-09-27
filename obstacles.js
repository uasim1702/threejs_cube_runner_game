import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js";
import { LANES, OBSTACLE_SPEED, SPAWN_Z, PASS_Z, HIT_DIST_X, HIT_DIST_Z } from "./config.js";

let obstacles = [];

export function resetObstacles(scene) {
  obstacles.forEach(o => scene.remove(o));
  obstacles = [];
}

export function spawnObstacle(scene) {
  const lane = Math.floor(Math.random() * LANES.length);

  const width  = 0.7 + Math.random() * 0.9;
  const height = 0.8 + Math.random() * 1.3;
  const depth  = 0.6 + Math.random() * 0.8;

  const geo = new THREE.BoxGeometry(width, height, depth);
  const palette = [0xE4572E, 0x17BEBB, 0xFFC914, 0x2E86AB, 0x6A4C93];
  const mat = new THREE.MeshBasicMaterial({ color: palette[(Math.random() * palette.length) | 0] });

  const box = new THREE.Mesh(geo, mat);
  box.position.set(LANES[lane], height/2, SPAWN_Z);
  box.userData = { scored: false };
  scene.add(box);
  obstacles.push(box);
}

export function updateObstacles(scene, playerX, playerY, playerZ, { onPass, onHit }) {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += OBSTACLE_SPEED * 16;

    if (!o.userData.scored && o.position.z > PASS_Z) {
      o.userData.scored = true;
      onPass && onPass();
    }

    if (o.position.z > PASS_Z + 5) {
      scene.remove(o);
      obstacles.splice(i, 1);
      continue;
    }

    if (Math.abs(o.position.z - playerZ) < 2) {
      const dx = Math.abs(o.position.x - playerX);
      const dz = Math.abs(o.position.z - playerZ);
      const dy = Math.abs(o.position.y - playerY);
      
      if (dx < HIT_DIST_X && dz < HIT_DIST_Z && dy < 1.0) {
        onHit && onHit();
        return;
      }
    }
  }
}
