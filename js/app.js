
/* =========================================
   ROOMVISION 3D
   Main JavaScript Application
========================================= */

// Mengambil elemen HTML
const $ = id => document.getElementById(id);

const canvas = $('scene');

const roomW = $('roomW');
const roomD = $('roomD');
const roomH = $('roomH');

const floorColor = $('floorColor');
const wallColor = $('wallColor');
const furnitureColor = $('furnitureColor');

const project = $('project');

const selectedName = $('selectedName');
const selectedColor = $('selectedColor');

const count = $('count');
const area = $('area');

const apply = $('apply');
const rotate = $('rotate');
const deleteBtn = $('delete');
const reset = $('reset');
const save = $('save');

// Memastikan elemen utama tersedia
if (!canvas || !roomW || !roomD || !roomH) {
  throw new Error('Elemen HTML RoomVision 3D tidak ditemukan.');
}


/* =========================================
   THREE.JS SETUP
========================================= */

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();

scene.background = new THREE.Color('#172238');

const camera = new THREE.PerspectiveCamera(
  42,
  canvas.clientWidth / canvas.clientHeight,
  0.1,
  100
);

camera.position.set(8, 7, 10);

// Pencahayaan
const hemi = new THREE.HemisphereLight(
  0xffffff,
  0x667080,
  2
);

scene.add(hemi);

const light = new THREE.DirectionalLight(
  0xffffff,
  2.5
);

light.position.set(5, 10, 7);
light.castShadow = true;

scene.add(light);

// Grup ruangan
const roomGroup = new THREE.Group();

scene.add(roomGroup);

// Data furnitur
let furniture = [];
let selected = null;


/* =========================================
   MATERIAL DAN OBJECT
========================================= */

function mat(color, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: roughness
  });
}

function box(
  width,
  height,
  depth,
  material,
  x,
  y,
  z,
  parent = roomGroup
) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );

  object.position.set(x, y, z);

  object.castShadow = true;
  object.receiveShadow = true;

  parent.add(object);

  return object;
}


/* =========================================
   MEMBUAT RUANGAN
========================================= */

function buildRoom() {
  roomGroup.clear();

  const width = Number(roomW.value);
  const depth = Number(roomD.value);
  const height = Number(roomH.value);

  const floorMat = mat(floorColor.value);
  const wallMat = mat(wallColor.value);

  // Lantai
  box(
    width,
    0.16,
    depth,
    floorMat,
    0,
    -0.08,
    0
  );

  // Dinding belakang
  box(
    width,
    height,
    0.12,
    wallMat,
    0,
    height / 2,
    -depth / 2
  );

  // Dinding kiri
  box(
    0.12,
    height,
    depth,
    wallMat,
    -width / 2,
    height / 2,
    0
  );

  // Dinding kanan
  box(
    0.12,
    height,
    depth,
    wallMat,
    width / 2,
    height / 2,
    0
  );

  // Grid lantai
  const grid = new THREE.GridHelper(
    Math.max(width, depth),
    Math.max(width, depth),
    0x7886a5,
    0x4a5875
  );

  grid.position.y = 0.012;

  roomGroup.add(grid);

  // Memasukkan kembali furnitur
  furniture.forEach(object => {
    roomGroup.add(object);
  });

  updateStats();
}


/* =========================================
   MEMBUAT FURNITUR
========================================= */

function makeFurniture(kind) {
  const group = new THREE.Group();

  const color = furnitureColor.value;

  const mainMaterial = mat(color);
  const darkMaterial = mat('#39445b');
  const softMaterial = mat('#c8b8a7');

  // SOFA
  if (kind === 'sofa') {
    box(2, 0.35, 0.85, mainMaterial, 0, 0.45, 0, group);

    box(2, 0.8, 0.22, mainMaterial, 0, 0.95, -0.32, group);

    [-0.8, 0.8].forEach(x => {
      box(
        0.25, 0.55, 0.85,
        darkMaterial,
        x, 0.65, 0,
        group
      );
    });
  }

  // TEMPAT TIDUR
  if (kind === 'bed') {
    box(1.8, 0.28, 2.1, darkMaterial, 0, 0.25, 0, group);

    box(1.7, 0.22, 1.75, softMaterial, 0, 0.48, 0.12, group);

    box(1.7, 0.35, 0.18, mainMaterial, 0, 0.78, -0.9, group);

    [-0.5, 0.5].forEach(x => {
      box(
        0.55, 0.14, 0.4,
        mat('#f5f0e8'),
        x, 0.68, -0.55,
        group
      );
    });
  }

  // MEJA
  if (kind === 'table') {
    box(1.5, 0.14, 0.9, mainMaterial, 0, 0.85, 0, group);

    [-0.6, 0.6].forEach(x => {
      [-0.32, 0.32].forEach(z => {
        box(
          0.12, 0.82, 0.12,
          darkMaterial,
          x, 0.41, z,
          group
        );
      });
    });
  }

  // KURSI
  if (kind === 'chair') {
    box(0.75, 0.15, 0.7, mainMaterial, 0, 0.55, 0, group);

    box(0.75, 0.85, 0.13, mainMaterial, 0, 1, -0.28, group);

    [-0.28, 0.28].forEach(x => {
      [-0.25, 0.25].forEach(z => {
        box(
          0.1, 0.55, 0.1,
          darkMaterial,
          x, 0.27, z,
          group
        );
      });
    });
  }

  // TANAMAN
  if (kind === 'plant') {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.65, 12),
      mat('#8a5737')
    );

    stem.position.y = 0.5;

    group.add(stem);

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

      group.add(leaf);
    }

    box(
      0.55, 0.5, 0.55,
      mat('#bd7958'),
      0, 0.25, 0,
      group
    );
  }

  // LAMPU
  if (kind === 'lamp') {
    box(
      0.12, 1.5, 0.12,
      darkMaterial,
      0, 0.75, 0,
      group
    );

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 0.45, 20, 1, true),
      mat('#f4d58b')
    );

    shade.position.y = 1.55;

    group.add(shade);

    box(
      0.55, 0.08, 0.55,
      darkMaterial,
      0, 0.05, 0,
      group
    );
  }

  // Informasi furnitur
  group.userData = {
    kind: kind,
    color: color
  };

  // Posisi awal furnitur
  group.position.set(
    (Math.random() - 0.5) * 2,
    0,
    (Math.random() - 0.5) * 2
  );

  furniture.push(group);

  buildRoom();

  selectFurniture(group);
}


/* =========================================
   MEMILIH FURNITUR
========================================= */

function selectFurniture(object) {
  selected = object;

  if (selectedName) {
    selectedName.textContent = object
      ? object.userData.kind
      : 'Belum ada objek dipilih.';
  }

  if (object && selectedColor) {
    selectedColor.value = object.userData.color;
  }
}


/* =========================================
   TOMBOL TAMBAH FURNITUR
========================================= */

document.querySelectorAll('[data-kind]').forEach(button => {
  button.addEventListener('click', () => {
    makeFurniture(button.dataset.kind);
  });
});


/* =========================================
   MENGATUR RUANGAN
========================================= */

if (apply) {
  apply.addEventListener('click', () => {
    buildRoom();
  });
}

// Warna lantai
if (floorColor) {
  floorColor.addEventListener('input', buildRoom);
}

// Warna dinding
if (wallColor) {
  wallColor.addEventListener('input', buildRoom);
}


/* =========================================
   MENGUBAH WARNA FURNITUR
========================================= */

if (selectedColor) {
  selectedColor.addEventListener('input', () => {
    if (!selected) return;

    selected.traverse(object => {
      if (object.isMesh && object.material.color) {
        object.material.color.set(selectedColor.value);
      }
    });

    selected.userData.color = selectedColor.value;
  });
}


/* =========================================
   MEMUTAR FURNITUR
========================================= */

if (rotate) {
  rotate.addEventListener('click', () => {
    if (!selected) return;

    selected.rotation.y += Math.PI / 4;
  });
}


/* =========================================
   MENGHAPUS FURNITUR
========================================= */

if (deleteBtn) {
  deleteBtn.addEventListener('click', () => {
    if (!selected) return;

    furniture = furniture.filter(
      object => object !== selected
    );

    selectFurniture(null);

    buildRoom();
  });
}


/* =========================================
   RESET DESAIN
========================================= */

if (reset) {
  reset.addEventListener('click', () => {
    furniture = [];

    selectFurniture(null);

    buildRoom();
  });
}


/* =========================================
   STATISTIK RUANGAN
========================================= */

function updateStats() {
  if (count) {
    count.textContent = furniture.length;
  }

  if (area) {
    area.textContent =
      (Number(roomW.value) * Number(roomD.value)) + ' m²';
  }
}


/* =========================================
   MENYIMPAN DESAIN
========================================= */

if (save) {
  save.addEventListener('click', () => {
    const data = {
      project: project ? project.value : 'RoomVision Design',

      room: {
        width: roomW.value,
        depth: roomD.value,
        height: roomH.value,
        wall: wallColor ? wallColor.value : '#ffffff',
        floor: floorColor ? floorColor.value : '#cccccc'
      },

      furniture: furniture.map(object => ({
        type: object.userData.kind,
        x: object.position.x,
        z: object.position.z,
        rotation: object.rotation.y,
        color: object.userData.color
      }))
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'roomvision-design.json';

    link.click();

    URL.revokeObjectURL(url);
  });
}


/* =========================================
   KONTROL KAMERA 3D
========================================= */

let dragging = false;

let previousX = 0;
let previousY = 0;

let theta = 0.65;
let phi = 1.0;
let radius = 13;

// Mulai menggeser kamera
canvas.addEventListener('pointerdown', event => {
  dragging = true;

  previousX = event.clientX;
  previousY = event.clientY;

  canvas.setPointerCapture(event.pointerId);
});

// Berhenti menggeser kamera
canvas.addEventListener('pointerup', () => {
  dragging = false;
});

canvas.addEventListener('pointercancel', () => {
  dragging = false;
});

// Rotasi kamera
canvas.addEventListener('pointermove', event => {
  if (!dragging) return;

  theta -= (event.clientX - previousX) * 0.008;

  phi = Math.max(
    0.25,
    Math.min(
      1.45,
      phi + (event.clientY - previousY) * 0.006
    )
  );

  previousX = event.clientX;
  previousY = event.clientY;
});


/* =========================================
   ZOOM KAMERA
========================================= */

canvas.addEventListener('wheel', event => {
  radius = Math.max(
    7,
    Math.min(
      22,
      radius + event.deltaY * 0.01
    )
  );

  event.preventDefault();
}, { passive: false });


/* =========================================
   MEMILIH FURNITUR DENGAN KLIK
========================================= */

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

canvas.addEventListener('click', event => {
  const rect = canvas.getBoundingClientRect();

  mouse.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  mouse.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(
    furniture,
    true
  );

  if (hits.length === 0) return;

  let object = hits[0].object;

  while (
    object.parent &&
    object.parent !== roomGroup
  ) {
    object = object.parent;
  }

  if (furniture.includes(object)) {
    selectFurniture(object);
  }
});


/* =========================================
   ANIMASI 3D
========================================= */

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


/* =========================================
   RESPONSIVE CANVAS
========================================= */

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) return;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;

  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(() => {
  resizeRenderer();
});

resizeObserver.observe(canvas);


/* =========================================
   MENJALANKAN ROOMVISION 3D
========================================= */

resizeRenderer();

buildRoom();

animate();
