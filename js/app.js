
const canvas = document.querySelector('#scene');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#172238');

const camera = new THREE.PerspectiveCamera(
  42,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  100
);

camera.position.set(8, 7, 10);

const hemi = new THREE.HemisphereLight(
  0xffffff,
  0x667080,
  2
);

scene.add(hemi);

const light = new THREE.DirectionalLight(0xffffff, 2.5);
light.position.set(5, 10, 7);
light.castShadow = true;
scene.add(light);

let roomGroup = new THREE.Group();
scene.add(roomGroup);

let furniture = [];
let selected = null;

const mat = (c, rough = 0.8) =>
  new THREE.MeshStandardMaterial({
    color: c,
    roughness: rough
  });

function box(w, h, d, m, x, y, z, parent = roomGroup) {
  const o = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    m
  );

  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;

  parent.add(o);
  return o;
}

function buildRoom() {
  roomGroup.clear();

  const w = +roomW.value;
  const d = +roomD.value;
  const h = +roomH.value;

  const floorMat = mat(floorColor.value);
  const wallMat = mat(wallColor.value);

  // Lantai
  box(w, 0.16, d, floorMat, 0, -0.08, 0);

  // Dinding
  box(w, h, 0.12, wallMat, 0, h / 2, -d / 2);
  box(0.12, h, d, wallMat, -w / 2, h / 2, 0);
  box(0.12, h, d, wallMat, w / 2, h / 2, 0);

  // Grid lantai
  const grid = new THREE.GridHelper(
    Math.max(w, d),
    Math.max(w, d),
    0x7886a5,
    0x4a5875
  );

  grid.position.y = 0.012;
  roomGroup.add(grid);

  furniture.forEach(o => roomGroup.add(o));

  updateStats();
}

function makeFurniture(kind) {
  const g = new THREE.Group();

  const c = furnitureColor.value;
  const m = mat(c);
  const dark = mat('#39445b');
  const soft = mat('#c8b8a7');

  // SOFA
  if (kind === 'sofa') {
    box(2, 0.35, 0.85, m, 0, 0.45, 0, g);
    box(2, 0.8, 0.22, m, 0, 0.95, -0.32, g);

    [-0.8, 0.8].forEach(x =>
      box(0.25, 0.55, 0.85, dark, x, 0.65, 0, g)
    );
  }

  // TEMPAT TIDUR
  if (kind === 'bed') {
    box(1.8, 0.28, 2.1, dark, 0, 0.25, 0, g);
    box(1.7, 0.22, 1.75, soft, 0, 0.48, 0.12, g);
    box(1.7, 0.35, 0.18, m, 0, 0.78, -0.9, g);

    [-0.5, 0.5].forEach(x =>
      box(0.55, 0.14, 0.4, mat('#f5f0e8'), x, 0.68, -0.55, g)
    );
  }

  // MEJA
  if (kind === 'table') {
    box(1.5, 0.14, 0.9, m, 0, 0.85, 0, g);

    [-0.6, 0.6].forEach(x =>
      [-0.32, 0.32].forEach(z =>
        box(0.12, 0.82, 0.12, dark, x, 0.41, z, g)
      )
    );
  }

  // KURSI
  if (kind === 'chair') {
    box(0.75, 0.15, 0.7, m, 0, 0.55, 0, g);
    box(0.75, 0.85, 0.13, m, 0, 1, -0.28, g);

    [-0.28, 0.28].forEach(x =>
      [-0.25, 0.25].forEach(z =>
        box(0.1, 0.55, 0.1, dark, x, 0.27, z, g)
      )
    );
  }

  // TANAMAN
  if (kind === 'plant') {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.65, 12),
      mat('#8a5737')
    );

    stem.position.y = 0.5;
    g.add(stem);

    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 10),
        mat('#4e9b70')
      );

      leaf.scale.set(0.7, 1.5, 0.6);

      leaf.position.set(
        Math.cos(i) * 0.25,
        1 + Math.sin(i) * 0.12,
        Math.sin(i) * 0.25
      );

      g.add(leaf);
    }

    box(0.55, 0.5, 0.55, mat('#bd7958'), 0, 0.25, 0, g);
  }

  // LAMPU
  if (kind === 'lamp') {
    box(0.12, 1.5, 0.12, dark, 0, 0.75, 0, g);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.45, 20, 1, true),
      mat('#f4d58b')
    );

    shade.position.y = 1.55;
    g.add(shade);

    box(0.55, 0.08, 0.55, dark, 0, 0.05, 0, g);
  }

  g.userData = {
    kind,
    color: c
  };

  g.position.set(
    (Math.random() - 0.5) * 2,
    0,
    (Math.random() - 0.5) * 2
  );

  furniture.push(g);

  buildRoom();
  select(g);
}

function select(o) {
  selected = o;

  selectedName.textContent = o
    ? o.userData.kind
    : 'Belum ada objek dipilih.';

  if (o) {
    selectedColor.value = o.userData.color;
  }
}

// Tambah furnitur
document.querySelectorAll('[data-kind]').forEach(button => {
  button.onclick = () => makeFurniture(button.dataset.kind);
});

// Terapkan ukuran dan warna ruangan
apply.onclick = () => {
  buildRoom();
  area.textContent = (+roomW.value * +roomD.value) + ' m²';
};

// Ganti warna objek
selectedColor.oninput = () => {
  if (selected) {
    selected.traverse(o => {
      if (o.isMesh && o.material.color) {
        o.material.color.set(selectedColor.value);
      }
    });

    selected.userData.color = selectedColor.value;
  }
};

// Putar objek
rotate.onclick = () => {
  if (selected) {
    selected.rotation.y += Math.PI / 4;
  }
};

// Hapus objek
delete.onclick = () => {
  if (selected) {
    furniture = furniture.filter(x => x !== selected);
    select(null);
    buildRoom();
  }
};

// Reset desain
reset.onclick = () => {
  furniture = [];
  select(null);
  buildRoom();
};

// Statistik
function updateStats() {
  count.textContent = furniture.length;
  area.textContent =
    (+roomW.value * +roomD.value) + ' m²';
}

// Simpan desain menjadi JSON
save.onclick = () => {
  const data = {
    project: project.value,

    room: {
      width: roomW.value,
      depth: roomD.value,
      height: roomH.value,
      wall: wallColor.value,
      floor: floorColor.value
    },

    furniture: furniture.map(o => ({
      type: o.userData.kind,
      x: o.position.x,
      z: o.position.z,
      rotation: o.rotation.y,
      color: o.userData.color
    }))
  };

  const a = document.createElement('a');

  a.href = URL.createObjectURL(
    new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    )
  );

  a.download = 'roomvision-design.json';
  a.click();

  URL.revokeObjectURL(a.href);
};

// Kamera 3D
let dragging = false;
let px = 0;
let py = 0;

let theta = 0.65;
let phi = 1.0;
let radius = 13;

canvas.addEventListener('pointerdown', e => {
  dragging = true;
  px = e.clientX;
  py = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', () => {
  dragging = false;
});

canvas.addEventListener('pointermove', e => {
  if (!dragging) return;

  theta -= (e.clientX - px) * 0.008;

  phi = Math.max(
    0.25,
    Math.min(1.45, phi + (e.clientY - py) * 0.006)
  );

  px = e.clientX;
  py = e.clientY;
});

// Zoom kamera
canvas.addEventListener('wheel', e => {
  radius = Math.max(
    7,
    Math.min(22, radius + e.deltaY * 0.01)
  );

  e.preventDefault();
}, { passive: false });

// Pilih furnitur dengan klik
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();

  mouse.x =
    ((e.clientX - rect.left) / rect.width) * 2 - 1;

  mouse.y =
    -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(furniture, true);

  if (hits.length) {
    let o = hits[0].object;

    while (o.parent && o.parent !== roomGroup) {
      o = o.parent;
    }

    if (furniture.includes(o)) {
      select(o);
    }
  }
});

// Animasi
function animate() {
  requestAnimationFrame(animate);

  camera.position.set(
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi),
    radius * Math.cos(theta) * Math.sin(phi)
  );

  camera.lookAt(0, 1, 0);

  renderer.render(scene, camera);
}

// Jalankan aplikasi
buildRoom();
animate();

// Responsive canvas
new ResizeObserver(() => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  renderer.setSize(w, h, false);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}).observe(canvas);
