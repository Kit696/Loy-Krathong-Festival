import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class LoyKrathongScene {
  constructor(container, onSelectKrathong) {
    this.container = container;
    this.onSelectKrathong = onSelectKrathong;

    this.krathongMeshes = new Map();
    this.people = [];
    this.lanterns = [];
    this.torches = [];
    this.torchLights = [];
    this.waterVertices = [];

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.isDragging = false;
    this.pointerDownPos = { x: 0, y: 0 };

    this.init();
    this.createTwilightSky();
    this.createEnvironment();
    this.createRiverbankTorches();
    this.createTrees();
    this.createLandmarks();
    this.createCrowd();
    this.setupEvents();
    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  init() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    // Atmospheric twilight fog matching the sky
    this.scene.fog = new THREE.FogExp2(0x192b52, 0.007);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    this.camera.position.set(0, 13, 27);

    // 3. Renderer with high color vibrancy and bright exposure
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Bright, rich and vivid (not dark)
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 2, 0);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 65;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.minPolarAngle = 0.2;

    // 5. Lighting
    this.setupLighting();
  }

  // สร้างท้องฟ้ายามทไวไลท์ (Magic Hour Twilight Sky) สีน้ำเงินครามเหลือบม่วงและส้มทองตามรูปที่ 2
  createTwilightSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0.00, '#031b4e'); // น้ำเงินครามเข้มด้านบนสุด
    grad.addColorStop(0.20, '#093a82'); // ฟ้าครามสดใส
    grad.addColorStop(0.45, '#1e5bb5'); // ฟ้าสว่างทไวไลท์
    grad.addColorStop(0.68, '#612a80'); // ม่วงมาเจนต้าพลบค่ำ
    grad.addColorStop(0.82, '#a53238'); // แดงส้มอาทิตย์อัสดง
    grad.addColorStop(0.92, '#d96414'); // ส้มทองอบอุ่น
    grad.addColorStop(1.00, '#f59e0b'); // ขอบฟ้าสีเหลืองทองเรืองรอง

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    const bgTexture = new THREE.CanvasTexture(canvas);
    this.scene.background = bgTexture;
  }

  setupLighting() {
    // 1. Hemisphere Light: Sky = ฟ้าครามสดใส, Ground = ส้มทองสะท้อนพื้นดิน ป้องกันฉากมืดทึบ
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0xf59e0b, 1.6);
    this.scene.add(hemiLight);

    // 2. Warm Sunset Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffeedb, 1.1);
    this.scene.add(ambientLight);

    // 3. Main Sunset / Twilight Directional Light (แสงสีทองนวลส่องกระทบผิวน้ำ)
    this.sunLight = new THREE.DirectionalLight(0xffbe76, 2.2);
    this.sunLight.position.set(15, 35, -30);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -35;
    this.sunLight.shadow.camera.right = 35;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.scene.add(this.sunLight);

    // 4. Warm Festival Golden Lights along the bank
    const festivalWarmLight = new THREE.PointLight(0xffa126, 3.0, 60);
    festivalWarmLight.position.set(0, 9, 16);
    this.scene.add(festivalWarmLight);

    const templeZoneLight = new THREE.PointLight(0xff7722, 2.5, 45);
    templeZoneLight.position.set(-18, 7, 20);
    this.scene.add(templeZoneLight);
  }

  createEnvironment() {
    // 1. Full Moon with soft golden glowing halo
    const moonGeo = new THREE.SphereGeometry(4.2, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfffae6,
    });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moon.position.set(22, 38, -48);
    this.scene.add(this.moon);

    // Moon Glow disk
    const haloGeo = new THREE.RingGeometry(4.2, 11, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(this.moon.position);
    halo.position.z += 0.1;
    this.scene.add(halo);

    // 2. Stars twinkling in upper sky
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = 30 + Math.random() * 70; // Upper sky
      const z = (Math.random() - 0.5) * 200;
      starPos.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, transparent: true, opacity: 0.75 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // 3. Floating Sky Lanterns (โคมลอย) สว่างไสว
    this.lanternGroup = new THREE.Group();
    for (let i = 0; i < 35; i++) {
      const lanternGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
      const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(
        (Math.random() - 0.5) * 80,
        9 + Math.random() * 45,
        -10 - Math.random() * 60
      );
      lantern.userData = {
        speedY: 0.015 + Math.random() * 0.02,
        swaySpeed: 0.5 + Math.random() * 0.8,
        swayOffset: Math.random() * Math.PI * 2,
        initialX: lantern.position.x
      };
      this.lanterns.push(lantern);
      this.lanternGroup.add(lantern);
    }
    this.scene.add(this.lanternGroup);

    // 4. The River (แม่น้ำสีครามค่ำคืนสะท้อนประกายแสงทองตามรูป 2)
    const riverGeo = new THREE.PlaneGeometry(85, 55, 48, 48);
    riverGeo.rotateX(-Math.PI / 2);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x113b69, // น้ำเงินครามสะท้อนท้องฟ้า
      roughness: 0.10, // มันวาวสะท้อนแสงไฟ
      metalness: 0.75,
      flatShading: true,
    });
    this.river = new THREE.Mesh(riverGeo, this.waterMat);
    this.river.position.set(0, 0, 0);
    this.river.receiveShadow = true;
    this.scene.add(this.river);

    // Save initial water heights for wave animation
    const pos = riverGeo.attributes.position;
    this.initialWaterY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      this.initialWaterY[i] = pos.getY(i);
    }

    // River bed
    const bedGeo = new THREE.PlaneGeometry(85, 55);
    bedGeo.rotateX(-Math.PI / 2);
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x07152b, roughness: 0.9 });
    const bed = new THREE.Mesh(bedGeo, bedMat);
    bed.position.set(0, -1.2, 0);
    this.scene.add(bed);

    // Lotus pads / leaves on the water surface (ใบบัวริมน้ำเหมือนในรูป 2)
    this.createLotusPads();

    // 5. Riverfront Bank - ตลิ่งเขียวชอุ่มและลานจัดงานเทศกาล (Lush Grass Bank)
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // หญ้าเขียวชอุ่มเหมือนริมน้ำสุโขทัย
      roughness: 0.85,
    });
    const walkwayGeo = new THREE.BoxGeometry(80, 1.8, 18);
    this.walkway = new THREE.Mesh(walkwayGeo, grassMat);
    this.walkway.position.set(0, 0.7, 23);
    this.walkway.receiveShadow = true;
    this.scene.add(this.walkway);

    // Paved Promenade strip (ทางเดินปูหินเรียบริมตลิ่ง)
    const promenadeGeo = new THREE.BoxGeometry(76, 0.2, 7);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.7 });
    const promenade = new THREE.Mesh(promenadeGeo, stoneMat);
    promenade.position.set(0, 1.65, 18);
    promenade.receiveShadow = true;
    this.scene.add(promenade);

    // Wooden Pier / Viewing Terrace on the river bank
    const pierGeo = new THREE.BoxGeometry(20, 0.35, 4.5);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.7 });
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(0, 0.45, 13.5);
    pier.receiveShadow = true;
    this.scene.add(pier);

    // Festive Market Tents (เต็นท์ซุ้มงานวัดสีส้มแดงเรืองแสงเหมือนในรูปที่ 2)
    this.createFestivalTents();
  }

  // ใบบัวริมน้ำ (Lotus Leaves on Water)
  createLotusPads() {
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.5,
      side: THREE.DoubleSide
    });

    const positions = [
      [-18, 0.05, 11], [-16.5, 0.05, 11.5], [-19, 0.05, 9.8],
      [-22, 0.05, 12], [-20.5, 0.05, 10.5], [-14, 0.05, 12.2],
      [14, 0.05, 11.8], [15.5, 0.05, 12.5], [17, 0.05, 11],
      [19, 0.05, 10.2], [21, 0.05, 11.5], [23, 0.05, 12]
    ];

    positions.forEach(([x, y, z]) => {
      const radius = 0.5 + Math.random() * 0.4;
      const padGeo = new THREE.CircleGeometry(radius, 16);
      padGeo.rotateX(-Math.PI / 2);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, y, z);
      this.scene.add(pad);
    });
  }

  // คบเพลิงไม้ไผ่ปักริมแม่น้ำ (Bamboo Torches / Fire Stakes) ถอดแบบจากภาพที่ 2 สุโขทัย
  createRiverbankTorches() {
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const cupMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 });

    // ปักเรียงโค้งตามแนวตลิ่งแม่น้ำ
    const count = 26;
    for (let i = 0; i < count; i++) {
      const x = -32 + (i * 2.5);
      const z = 13.6 + Math.sin(i * 0.45) * 0.8;

      const torchGroup = new THREE.Group();

      // Bamboo stake
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.07, 2.2, 8);
      const pole = new THREE.Mesh(poleGeo, bambooMat);
      pole.position.y = 1.0;
      pole.castShadow = true;
      torchGroup.add(pole);

      // Woven cup top
      const cupGeo = new THREE.CylinderGeometry(0.2, 0.12, 0.35, 8);
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.y = 2.1;
      torchGroup.add(cup);

      // Blazing Fire Flame
      const flameGeo = new THREE.ConeGeometry(0.16, 0.55, 8);
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 2.45;
      torchGroup.add(flame);

      torchGroup.position.set(x, 0.2, z);
      this.scene.add(torchGroup);

      this.torches.push({ group: torchGroup, flame: flame, baseScale: 1.0 });

      // Add warm point lights every few torches to create the golden water reflection carpet
      if (i % 3 === 0) {
        const fireLight = new THREE.PointLight(0xff9900, 1.8, 9);
        fireLight.position.set(x, 2.4, z - 0.3);
        this.scene.add(fireLight);
        this.torchLights.push(fireLight);
      }
    }
  }

  // เต็นท์ซุ้มงานวัดสีส้มแดงเรืองแสง (Festival Pavilions & Stalls) เหมือนในรูปที่ 2
  createFestivalTents() {
    const tentGroup = new THREE.Group();
    const tentRoofMat = new THREE.MeshStandardMaterial({
      color: 0xe65100, // ส้มแดงงานวัด
      emissive: 0xbf360c,
      emissiveIntensity: 0.4,
      roughness: 0.5,
    });
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f,
      emissive: 0xffa000,
      emissiveIntensity: 0.3,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f });

    // 3 Tent stalls on the left side
    const tentOffsets = [-24, -16, -8];
    tentOffsets.forEach((tx) => {
      // Canopy roof
      const roofGeo = new THREE.ConeGeometry(3.6, 1.8, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, tentRoofMat);
      roof.position.set(tx, 4.4, 23);
      roof.scale.set(1.4, 1.0, 0.9);
      roof.castShadow = true;
      tentGroup.add(roof);

      // Poles
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), frameMat);
      p1.position.set(tx - 2, 2.1, 21.5);
      tentGroup.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), frameMat);
      p2.position.set(tx + 2, 2.1, 21.5);
      tentGroup.add(p2);

      // Warm glow inside tent
      const tentLight = new THREE.PointLight(0xffaa33, 2.2, 14);
      tentLight.position.set(tx, 3.0, 22.5);
      tentGroup.add(tentLight);
    });

    this.scene.add(tentGroup);
  }

  // ต้นไม้ประดับไฟเขียวและไฟทอง (Illuminated Trees) ถอดแบบจากต้นไม้เด่นตรงกลางในรูปที่ 2
  createTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.9 });
    const leavesMat = new THREE.MeshStandardMaterial({
      color: 0x1b5e20,
      roughness: 0.6,
      emissive: 0x004d40,
      emissiveIntensity: 0.2,
    });

    // 1. Iconic Center Tree lit up with vivid green uplight
    const tree1 = new THREE.Group();
    const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 6, 8), trunkMat);
    trunk1.position.y = 4.0;
    trunk1.castShadow = true;
    tree1.add(trunk1);

    const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), leavesMat);
    foliage1.position.y = 7.5;
    foliage1.castShadow = true;
    tree1.add(foliage1);

    const foliage1b = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), leavesMat);
    foliage1b.position.set(1.5, 6.8, 0.8);
    tree1.add(foliage1b);

    tree1.position.set(7, 1.4, 21);
    this.scene.add(tree1);

    // Green Uplight for Center Tree (เหมือนแสงไฟเขียวส่องต้นไม้ในรูปที่ 2)
    const treeGreenLight = new THREE.SpotLight(0x00e676, 5.0, 20, Math.PI / 4, 0.6);
    treeGreenLight.position.set(7, 1.8, 19);
    treeGreenLight.target = foliage1;
    this.scene.add(treeGreenLight);

    // 2. Secondary trees
    const tree2 = new THREE.Group();
    const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 5.5, 8), trunkMat);
    trunk2.position.y = 3.6;
    tree2.add(trunk2);

    const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), leavesMat);
    foliage2.position.y = 6.8;
    tree2.add(foliage2);

    tree2.position.set(-2, 1.4, 23);
    this.scene.add(tree2);

    const treeWarmLight = new THREE.SpotLight(0xffb74d, 4.0, 18, Math.PI / 4, 0.6);
    treeWarmLight.position.set(-2, 1.8, 21);
    treeWarmLight.target = foliage2;
    this.scene.add(treeWarmLight);
  }

  createLandmarks() {
    // 1. วัด (Thai Temple / Phra Ubosot) - สว่างด้วยไฟประดับ
    this.temple = this.buildThaiTemple();
    this.temple.position.set(-22, 1.4, 27);
    this.scene.add(this.temple);

    // 2. พระเจดีย์สุโขทัยสีอิฐแดงทองอร่าม (Sukhothai Golden-Terracotta Chedi) เหมือนรูปที่ 2 เด่นสง่า
    this.chedi = this.buildThaiChedi();
    this.chedi.position.set(16, 1.4, 25); // เด่นอยู่ฝั่งขวาเหมือนในรูปที่ 2
    this.scene.add(this.chedi);

    // 3. บ้านทรงไทยริมน้ำ (Thai Traditional Houses on Stilts)
    this.house1 = this.buildThaiHouse();
    this.house1.position.set(28, 1.4, 26);
    this.scene.add(this.house1);
  }

  buildThaiTemple() {
    const templeGroup = new THREE.Group();

    // Base podium
    const baseGeo = new THREE.BoxGeometry(14, 1.5, 10);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.75;
    base.castShadow = true;
    base.receiveShadow = true;
    templeGroup.add(base);

    // Temple Walls
    const wallGeo = new THREE.BoxGeometry(11, 4.5, 7.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y = 3.5;
    walls.castShadow = true;
    templeGroup.add(walls);

    // Columns (เสาระเบียงวัด)
    const colMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 });
    const colX = [-5.2, -5.2, 5.2, 5.2];
    const colZ = [-3.5, 3.5, -3.5, 3.5];
    for (let i = 0; i < 4; i++) {
      const colGeo = new THREE.CylinderGeometry(0.3, 0.35, 4.5, 12);
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(colX[i], 3.5, colZ[i]);
      col.castShadow = true;
      templeGroup.add(col);
    }

    // Tiered Roof (หลังคาซ้อนชั้นเอกลักษณ์ไทย สีแดงชาด)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xb71c1c, // แดงสดใสขึ้น
      roughness: 0.35,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, // ขอบทองประกาย
      metalness: 0.85,
      roughness: 0.25,
    });

    // Lower Roof Tier
    const r1Geo = new THREE.ConeGeometry(8, 3.2, 4);
    r1Geo.rotateY(Math.PI / 4);
    const r1 = new THREE.Mesh(r1Geo, roofMat);
    r1.position.y = 7;
    r1.scale.set(1.15, 0.7, 0.9);
    r1.castShadow = true;
    templeGroup.add(r1);

    // Upper Roof Tier
    const r2Geo = new THREE.ConeGeometry(6, 2.8, 4);
    r2Geo.rotateY(Math.PI / 4);
    const r2 = new THREE.Mesh(r2Geo, roofMat);
    r2.position.y = 8.5;
    r2.scale.set(1.1, 0.8, 0.85);
    r2.castShadow = true;
    templeGroup.add(r2);

    // Gable / Chofah (ช่อฟ้า ปลายหลังคา)
    const chofahGeo = new THREE.ConeGeometry(0.2, 1.8, 6);
    const c1 = new THREE.Mesh(chofahGeo, goldTrimMat);
    c1.position.set(-5, 9.8, 0);
    c1.rotation.z = -0.3;
    templeGroup.add(c1);

    const c2 = new THREE.Mesh(chofahGeo, goldTrimMat);
    c2.position.set(5, 9.8, 0);
    c2.rotation.z = 0.3;
    templeGroup.add(c2);

    // Temple internal warm festive light
    const templeLight = new THREE.PointLight(0xffb74d, 3.0, 20);
    templeLight.position.set(0, 4.0, 4.2);
    templeGroup.add(templeLight);

    return templeGroup;
  }

  // เจดีย์สุโขทัยสีอิฐแดงและทองคำเรืองรอง (Sukhothai Chedi เหมือนในภาพที่ 2)
  buildThaiChedi() {
    const chediGroup = new THREE.Group();

    // Terracotta-Brick with Golden Glow Material (สีอิฐแดงทองเรืองรองเหมือนเจดีย์สุโขทัยยามค่ำคืน)
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0xc0392b, // สีอิฐแดงสุโขทัย
      roughness: 0.55,
      emissive: 0x8b1e10,
      emissiveIntensity: 0.35,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x664400,
      emissiveIntensity: 0.3,
    });

    // Step 1: Base podiums (ฐานแปดเหลี่ยม/สี่เหลี่ยมซ้อนชั้น)
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.4, 1.4, 16), brickMat);
    b1.position.y = 0.7;
    b1.castShadow = true;
    b1.receiveShadow = true;
    chediGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.6, 1.2, 16), brickMat);
    b2.position.y = 1.9;
    b2.castShadow = true;
    chediGroup.add(b2);

    const b3 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 1.0, 16), brickMat);
    b3.position.y = 2.95;
    b3.castShadow = true;
    chediGroup.add(b3);

    // Step 2: Bell body (องค์ระฆังสีอิฐแดงทอง)
    const bellGeo = new THREE.CylinderGeometry(2.0, 3.1, 4.2, 24);
    const bell = new THREE.Mesh(bellGeo, brickMat);
    bell.position.y = 5.2;
    bell.castShadow = true;
    chediGroup.add(bell);

    // Step 3: Ball throne & Rings (บัลลังก์และปล้องไฉนสีทอง)
    const throne = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 2.5), goldMat);
    throne.position.y = 7.6;
    chediGroup.add(throne);

    const spireRingsGeo = new THREE.ConeGeometry(1.4, 4.8, 20);
    const spire = new THREE.Mesh(spireRingsGeo, goldMat);
    spire.position.y = 10.2;
    spire.castShadow = true;
    chediGroup.add(spire);

    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 4.2, 12), goldMat);
    needle.position.y = 14.2;
    needle.castShadow = true;
    chediGroup.add(needle);

    // Powerful Red-Gold Floodlight illuminating Chedi from ground (เหมือนไฟส่ององค์เจดีย์ในรูปที่ 2)
    const chediLight = new THREE.SpotLight(0xff7722, 7.0, 30, Math.PI / 3.5, 0.5);
    chediLight.position.set(0, 1.2, 7);
    chediLight.target = bell;
    chediGroup.add(chediLight);

    const chediLightBack = new THREE.PointLight(0xffbb33, 3.5, 16);
    chediLightBack.position.set(0, 6, -3);
    chediGroup.add(chediLightBack);

    return chediGroup;
  }

  buildThaiHouse() {
    const houseGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 });
    const wallWoodMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.6 });
    const roofTilesMat = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.4 });

    // Stilts (เสาใต้ถุนเรือนไทย)
    const stiltPositions = [
      [-3.2, -2], [3.2, -2],
      [-3.2, 2], [3.2, 2],
      [0, -2], [0, 2]
    ];
    stiltPositions.forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 3, 8), woodMat);
      stilt.position.set(sx, 1.5, sz);
      stilt.castShadow = true;
      houseGroup.add(stilt);
    });

    // Floor Platform
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 6), woodMat);
    floor.position.set(0, 3, 0);
    floor.castShadow = true;
    houseGroup.add(floor);

    // Walls
    const room = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 4.8), wallWoodMat);
    room.position.set(0, 4.7, 0);
    room.castShadow = true;
    houseGroup.add(room);

    // Curved Gable Roof
    const roofGeo = new THREE.ConeGeometry(5.2, 3.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, roofTilesMat);
    roof.position.set(0, 7.3, 0);
    roof.scale.set(1.1, 0.9, 0.9);
    roof.castShadow = true;
    houseGroup.add(roof);

    // Warm verandah light
    const verandahLight = new THREE.PointLight(0xffb74d, 2.2, 12);
    verandahLight.position.set(0, 3.8, 2.5);
    houseGroup.add(verandahLight);

    return houseGroup;
  }

  // 5. บรรยากาศภายในงาน มีผู้คนเดินชมงาน อยู่ 20 คน
  createCrowd() {
    this.crowdGroup = new THREE.Group();
    const clothingColors = [
      0xf44336, 0x2196f3, 0x4caf50, 0xffeb3b, 0x9c27b0,
      0xff9800, 0x00bcd4, 0xff5722, 0xe91e63, 0x009688
    ];

    for (let i = 0; i < 20; i++) {
      const person = new THREE.Group();

      // Shirt / Body
      const bodyColor = clothingColors[i % clothingColors.length];
      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.5 });
      const bodyGeo = new THREE.CylinderGeometry(0.28, 0.32, 1.0, 8);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.3;
      body.castShadow = true;
      person.add(body);

      // Pants / Chong Kraben
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.8 });
      const pantsGeo = new THREE.CylinderGeometry(0.32, 0.25, 0.8, 8);
      const pants = new THREE.Mesh(pantsGeo, pantsMat);
      pants.position.y = 0.5;
      pants.castShadow = true;
      person.add(pants);

      // Head
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffd1a4, roughness: 0.4 });
      const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.0;
      head.castShadow = true;
      person.add(head);

      // Hair
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const hairGeo = new THREE.SphereGeometry(0.25, 8, 8);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 2.12, -0.04);
      hair.scale.set(0.95, 0.8, 0.95);
      person.add(hair);

      // Little handheld lantern or lotus flower
      if (i % 2 === 0) {
        const glowGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
        const handLight = new THREE.Mesh(glowGeo, glowMat);
        handLight.position.set(0.35, 1.2, 0.2);
        person.add(handLight);
      }

      // Initial placement along the promenade (x: -30 to 30, z: 16 to 22)
      const startX = -28 + (i * 2.8) + (Math.random() - 0.5);
      const startZ = 16.5 + (Math.random() * 4.5);
      person.position.set(startX, 1.7, startZ);

      // Animation parameters
      person.userData = {
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 0.025 + Math.random() * 0.025,
        minX: -32,
        maxX: 32,
        bobSpeed: 7 + Math.random() * 4,
        bobOffset: Math.random() * Math.PI * 2,
        baseY: 1.7,
      };

      this.people.push(person);
      this.crowdGroup.add(person);
    }

    this.scene.add(this.crowdGroup);
  }

  // 4. ในแม่น้ำมีกระทงหลากสี ลอยอยู่ 20 กระทง
  updateKrathongs(krathongList) {
    const currentIds = new Set(krathongList.map((k) => k.id));

    // Remove deleted
    for (const [id, mesh] of this.krathongMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.krathongMeshes.delete(id);
      }
    }

    // Add or update
    krathongList.forEach((data, index) => {
      let mesh = this.krathongMeshes.get(data.id);
      if (!mesh) {
        mesh = this.buildKrathongMesh(data, index);
        this.krathongMeshes.set(data.id, mesh);
        this.scene.add(mesh);
      } else {
        mesh.userData.data = data;
      }
    });
  }

  buildKrathongMesh(data, index) {
    const group = new THREE.Group();
    group.userData = {
      isKrathong: true,
      id: data.id,
      data: data,
      initialX: data.x !== undefined ? data.x : (Math.random() - 0.5) * 35,
      initialZ: data.z !== undefined ? data.z : -10 + Math.random() * 20,
      driftSpeed: data.speed || (0.005 + Math.random() * 0.006),
      floatOffset: index * 0.45,
      rotationSpeed: (Math.random() - 0.5) * 0.006,
    };

    // 1. Banana leaf disc base (เขียวใบตองสดใส)
    const baseGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.45, 18);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // เขียวใบตองสด
      roughness: 0.5,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    // 2. Petals (กลีบกระทงสีสันสดใส สว่างเด่น)
    const petalColor = new THREE.Color(data.color || 0xff4081);
    const petalMat = new THREE.MeshStandardMaterial({
      color: petalColor,
      roughness: 0.35,
      side: THREE.DoubleSide,
      emissive: petalColor,
      emissiveIntensity: 0.2, // เปล่งประกายเรืองแสงเบาๆ
    });

    const petalCount = 12;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalGeo = new THREE.ConeGeometry(0.38, 0.95, 4);
      petalGeo.rotateZ(Math.PI / 4);
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * 1.25, 0.45, Math.sin(angle) * 1.25);
      petal.rotation.y = -angle;
      petal.rotation.x = 0.35;
      group.add(petal);

      // Inner layer of smaller petals
      const innerPetal = new THREE.Mesh(petalGeo, petalMat);
      innerPetal.position.set(Math.cos(angle + 0.25) * 0.85, 0.55, Math.sin(angle + 0.25) * 0.85);
      innerPetal.scale.set(0.75, 0.75, 0.75);
      innerPetal.rotation.y = -(angle + 0.25);
      innerPetal.rotation.x = 0.2;
      group.add(innerPetal);
    }

    // 3. Incense Sticks (ธูป 3 ดอก)
    const incenseMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const incenseTipMat = new THREE.MeshBasicMaterial({ color: 0xff1744 }); // จุดแดงปลายธูป
    for (let i = -1; i <= 1; i++) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), incenseMat);
      stick.position.set(i * 0.12, 1.0, -0.2);
      stick.rotation.z = i * 0.08;
      group.add(stick);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), incenseTipMat);
      tip.position.set(i * 0.12, 1.7, -0.2);
      group.add(tip);
    }

    // 4. Candle & Candle Flame (เทียนและเปลวไฟเรืองแสงสีทองสว่างไสว)
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xfff9c4, roughness: 0.3 });
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.85, 8), candleMat);
    candle.position.set(0, 0.75, 0.15);
    group.add(candle);

    // Blazing Golden Flame
    const flameGeo = new THREE.ConeGeometry(0.15, 0.42, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(0, 1.3, 0.15);
    group.add(flame);

    // Candle PointLight for water reflection
    const candleLight = new THREE.PointLight(0xffa000, 1.6, 6.5);
    candleLight.position.set(0, 1.35, 0.15);
    group.add(candleLight);

    // Invisible Hitbox for Raycaster
    const hitboxGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.0, 8);
    const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.y = 0.9;
    hitbox.userData = { isHitbox: true, parentKrathong: group };
    group.add(hitbox);

    group.position.set(group.userData.initialX, 0.15, group.userData.initialZ);
    return group;
  }

  setupEvents() {
    const dom = this.renderer.domElement;

    const onPointerDown = (e) => {
      this.isDragging = false;
      this.pointerDownPos.x = e.clientX || (e.touches && e.touches[0].clientX);
      this.pointerDownPos.y = e.clientY || (e.touches && e.touches[0].clientY);
    };

    const onPointerMove = (e) => {
      const cx = e.clientX || (e.touches && e.touches[0].clientX);
      const cy = e.clientY || (e.touches && e.touches[0].clientY);
      const dist = Math.hypot(cx - this.pointerDownPos.x, cy - this.pointerDownPos.y);
      if (dist > 8) {
        this.isDragging = true;
      }
    };

    const onPointerUp = (e) => {
      if (this.isDragging) return;

      const rect = dom.getBoundingClientRect();
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);

      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(Array.from(this.krathongMeshes.values()), true);

      if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        let krathongGroup = null;

        while (hitObject) {
          if (hitObject.userData && hitObject.userData.isKrathong) {
            krathongGroup = hitObject;
            break;
          }
          if (hitObject.userData && hitObject.userData.parentKrathong) {
            krathongGroup = hitObject.userData.parentKrathong;
            break;
          }
          hitObject = hitObject.parent;
        }

        if (krathongGroup && krathongGroup.userData && krathongGroup.userData.data) {
          this.focusOnKrathong(krathongGroup.position);
          if (this.onSelectKrathong) {
            this.onSelectKrathong(krathongGroup.userData.data);
          }
        }
      }
    };

    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    dom.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    dom.addEventListener('touchend', onPointerUp);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  focusOnKrathong(targetPos) {
    this.controls.target.lerp(new THREE.Vector3(targetPos.x, 1, targetPos.z), 0.5);
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate(time) {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const t = time * 0.001;

    // 1. Water Wave Ripple Animation
    const pos = this.river.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getZ(i);
      const wave = Math.sin(u * 0.4 + t * 2.2) * 0.12 + Math.cos(v * 0.3 + t * 1.8) * 0.08;
      pos.setY(i, this.initialWaterY[i] + wave);
    }
    pos.needsUpdate = true;

    // 2. Krathongs Bobbing & Gentle River Drift
    for (const [id, mesh] of this.krathongMeshes.entries()) {
      const u = mesh.userData;
      mesh.position.x -= u.driftSpeed;
      if (mesh.position.x < -38) {
        mesh.position.x = 38;
      }

      const waveHeight = Math.sin(t * 2.5 + u.floatOffset) * 0.09;
      mesh.position.y = 0.18 + waveHeight;
      mesh.rotation.y += u.rotationSpeed;
      mesh.rotation.x = Math.sin(t * 1.8 + u.floatOffset) * 0.04;
      mesh.rotation.z = Math.cos(t * 2.0 + u.floatOffset) * 0.04;
    }

    // 3. Bamboo Torch Flame Flickering Effect (ประกายเปลวไฟคบเพลิงวูบวาบ)
    this.torches.forEach((torch, idx) => {
      const flicker = 0.85 + Math.sin(t * 12 + idx * 1.5) * 0.15;
      torch.flame.scale.set(flicker, flicker, flicker);
    });

    // 4. Crowd Animation (20 People walking along the walkway)
    this.people.forEach((person) => {
      const p = person.userData;
      person.position.x += p.speed * p.direction;

      if (person.position.x > p.maxX) {
        person.position.x = p.maxX;
        p.direction = -1;
        person.rotation.y = -Math.PI / 2;
      } else if (person.position.x < p.minX) {
        person.position.x = p.minX;
        p.direction = 1;
        person.rotation.y = Math.PI / 2;
      }

      person.position.y = p.baseY + Math.abs(Math.sin(t * p.bobSpeed + p.bobOffset)) * 0.12;
    });

    // 5. Sky Lanterns Floating Upwards
    this.lanterns.forEach((lantern) => {
      const u = lantern.userData;
      lantern.position.y += u.speedY;
      lantern.position.x = u.initialX + Math.sin(t * u.swaySpeed + u.swayOffset) * 0.8;

      if (lantern.position.y > 60) {
        lantern.position.y = 9;
        lantern.position.x = (Math.random() - 0.5) * 80;
        u.initialX = lantern.position.x;
      }
    });

    // 6. Controls & Render
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
