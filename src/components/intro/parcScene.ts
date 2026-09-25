import * as THREE from "three";

/**
 * Scène du loader : le Parc des Princes de nuit (photo en couches avec parallaxe, projecteurs qui s'allument
 * section par section, faisceaux, brume) et le logo des Dames du Parc en médaille 3D (relief, carbone, métal, vernis).
 * Tout est piloté par une seule valeur de progression p (0 → 1) : render(p, hold, exit, time).
 */

const BASE = "/loader";
const PHOTO_ASPECT = 1920 / 1080;
const FOV = 32;
const Z_START = 1.05;
const Z_END = 3;
const LOGO_DIST = 2.2;
const LAMP_COUNT = 16;
const LAMP_Y = 1 - 165 / 1125; // hauteur des projecteurs sur la photo (uv, y vers le haut)
const SECTION_ORDER = [2, 1, 3, 0, 4]; // du centre vers les bords
const T = 0.16; // épaisseur de la médaille

export interface ParcScene {
  render(p: number, hold: number, exit: number, time: number): void;
  resize(): void;
  dispose(): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const STADIUM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STADIUM_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec4 uRegion;
  uniform vec2 uFeather;
  uniform vec2 uRes;
  uniform float uTime, uSil, uAmb, uFull, uBanner;
  uniform vec3 uLamps[${LAMP_COUNT}];
  varying vec2 vUv;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
  }

  void main() {
    vec2 iuv = uRegion.xy + vUv * (uRegion.zw - uRegion.xy);
    vec3 tex = texture2D(uTex, iuv).rgb;
    float l = dot(tex, vec3(0.2126, 0.7152, 0.0722));
    float aspect = 1.7778;

    // Nuit : bleu très profond, les volumes n'apparaissent qu'en silhouette
    vec3 night = vec3(0.0012, 0.0024, 0.008) + vec3(0.030, 0.058, 0.140) * pow(l, 0.9) * uSil;
    float redness = clamp(tex.r - max(tex.g, tex.b), 0.0, 1.0);
    night += vec3(0.07, 0.006, 0.015) * redness * uSil;

    // Projecteurs : éclairage, halo, faisceaux
    float illum = 0.0;
    vec3 glow = vec3(0.0);
    float beams = 0.0;
    float rays = noise(vec2(iuv.x * 46.0, iuv.y * 7.0 - uTime * 0.05));
    for (int i = 0; i < ${LAMP_COUNT}; i++) {
      vec3 L = uLamps[i];
      float I = L.z;
      if (I < 0.001) continue;
      vec2 d = iuv - L.xy;
      d.x *= aspect;
      float below = max(-d.y, 0.0);
      float above = max(d.y, 0.0);
      illum += I * exp(-(d.x * d.x) / 0.03 - (below * below) / 0.85 - (above * above) / 0.004);
      float r2 = dot(d, d);
      glow += I * vec3(0.72, 0.84, 1.0) * (exp(-r2 / 0.00035) + 0.00035 / (r2 + 0.0016));
      float w = 0.010 + below * 0.085;
      beams += I * exp(-(d.x * d.x) / (w * w)) * smoothstep(0.0, 0.03, below) * exp(-below * 2.4) * (0.35 + 0.9 * rays);
    }

    float lit = clamp(uAmb * 0.78 + illum * 0.85 + uFull * 0.32, 0.0, 1.0);
    vec3 day = pow(tex, vec3(1.3)) * vec3(0.86, 0.98, 1.2) * (1.0 + uFull * 0.3);
    vec3 col = mix(night, day, lit);
    col += glow * 0.5 + beams * vec3(0.55, 0.68, 0.95) * 0.13;
    col += illum * vec3(0.02, 0.035, 0.075) * (0.4 + l);

    // Brume rasante, plus dense près de la pelouse
    float h = fbm(vec2(iuv.x * 3.4 + uTime * 0.014, iuv.y * 5.0 - uTime * 0.009));
    float band = smoothstep(0.44, 0.16, iuv.y);
    col += vec3(0.07, 0.11, 0.22) * h * band * (0.1 + 0.5 * lit);

    // Bandeau « Ici c'est Paris »
    vec2 bq = (iuv - vec2(0.505, 0.905)) / vec2(0.25, 0.034);
    float bm = smoothstep(1.15, 0.85, abs(bq.x)) * smoothstep(1.5, 0.7, abs(bq.y));
    col += uBanner * bm * (tex * 1.5 + vec3(0.05, 0.08, 0.16));

    // Ciel de nuit : le dessus du toit reste noir
    float sky = smoothstep(0.925, 0.955, iuv.y);
    col = mix(col, vec3(0.006, 0.011, 0.03), sky * 0.94);

    // Vignette et grain
    vec2 sp = gl_FragCoord.xy / uRes - 0.5;
    sp.x *= uRes.x / uRes.y;
    col *= 0.2 + 0.8 * smoothstep(1.3, 0.18, length(sp));
    col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.004;
    col = 1.0 - exp(-max(col, 0.0) * 1.35);

    float a = 1.0;
    if (uFeather.x > 0.0) a *= smoothstep(0.0, uFeather.x, vUv.y);
    if (uFeather.y > 0.0) a *= smoothstep(0.0, uFeather.y, 1.0 - vUv.y);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

const SWEEP_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uPos, uI;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float d = dot(p, normalize(vec2(1.0, 0.32))) - uPos;
    float band = exp(-d * d * 60.0) + 0.3 * exp(-(d - 0.14) * (d - 0.14) * 420.0);
    vec3 c = texture2D(uTex, vUv).rgb;
    float m = 0.25 + 1.1 * dot(c, vec3(0.33));
    gl_FragColor = vec4(vec3(0.82, 0.9, 1.0) * band * m * uI, 1.0);
  }
`;

const HALO_FRAG = /* glsl */ `
  uniform float uI;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float g = exp(-r * r * 3.2);
    vec3 c = mix(vec3(0.16, 0.28, 0.7), vec3(0.85, 0.92, 1.0), g * g);
    gl_FragColor = vec4(c * g * uI, 1.0);
  }
`;

const PLAIN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DUST_VERT = /* glsl */ `
  uniform float uTime, uScale;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.02 + aSeed * 0.05) + aSeed * 7.0, 1.0) * 0.5 - 0.25;
    p.x += sin(uTime * 0.2 + aSeed * 20.0) * 0.03;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.5 + aSeed * 3.5) * uScale / -mv.z;
    vA = 0.35 + 0.65 * abs(sin(uTime * (0.4 + aSeed) + aSeed * 30.0));
    gl_Position = projectionMatrix * mv;
  }
`;
const DUST_FRAG = /* glsl */ `
  uniform float uI;
  varying float vA;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, r);
    gl_FragColor = vec4(vec3(0.7, 0.8, 1.0) * a * a * vA * uI, 1.0);
  }
`;

function buildEnvironment(renderer: THREE.WebGLRenderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x02040c);
  const panel = (w: number, h: number, pos: [number, number, number], color: number, intensity: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(6, 3, [-4, 5, 4], 0xe8f0ff, 7);
  panel(2, 5, [5, 2, -3], 0xbcd0ff, 6);
  panel(4, 0.6, [-5, -1, 2], 0xff2a45, 4);
  panel(10, 1, [0, 6, -2], 0xffffff, 3);
  panel(3, 3, [3, -3, 4], 0x2a4a9a, 1.2);
  panel(8, 0.3, [0, -4, -4], 0x9ab8ff, 2);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose();
  s.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}

interface Layer {
  mesh: THREE.Mesh;
  z: number;
  region: [number, number, number, number];
}

export async function createParcScene(container: HTMLElement, onLoad?: (fraction: number) => void): Promise<ParcScene> {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !coarse, powerPreference: "high-performance", alpha: false });
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x02040c, 1);
  const canvas = renderer.domElement;
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  container.appendChild(canvas);

  /* ---------- Textures ---------- */
  const loader = new THREE.TextureLoader();
  const files: Array<[string, boolean]> = [
    ["parc.webp", true],
    ["logo-color.webp", true],
    ["logo-normal.webp", false],
    ["logo-orm.webp", false],
    ["carbon.webp", true],
  ];
  let done = 0;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const [parcTex, colorTex, normalTex, ormTex, carbonTex] = await Promise.all(
    files.map(
      ([name, srgb]) =>
        new Promise<THREE.Texture>((resolve, reject) =>
          loader.load(
            `${BASE}/${name}`,
            (t) => {
              t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
              t.anisotropy = Math.min(8, maxAniso);
              done++;
              onLoad?.(done / files.length);
              resolve(t);
            },
            undefined,
            reject,
          ),
        ),
    ),
  );
  parcTex.generateMipmaps = false;
  parcTex.minFilter = THREE.LinearFilter;
  carbonTex.wrapS = carbonTex.wrapT = THREE.RepeatWrapping;

  /* ---------- Fond : Parc des Princes en trois couches (toit, tribunes, pelouse) ---------- */
  const bgScene = new THREE.Scene();
  const fgScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 30);
  fgScene.add(camera);

  const lampVec = Array.from({ length: LAMP_COUNT }, (_, i) => new THREE.Vector3(0.03 + (i * 0.94) / (LAMP_COUNT - 1), LAMP_Y - (i % 2) * 0.006, 0));
  const stadiumUniforms = {
    uTex: { value: parcTex },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uSil: { value: 0 },
    uAmb: { value: 0 },
    uFull: { value: 0 },
    uBanner: { value: 0 },
    uLamps: { value: lampVec },
  };
  const layerDefs: Array<{ z: number; region: [number, number, number, number]; feather: [number, number] }> = [
    { z: 0, region: [0, 0, 1, 1], feather: [0, 0] },
    { z: 0.2, region: [0, 0.76, 1, 1], feather: [0.22, 0] },
    { z: 0.42, region: [0, 0, 1, 0.235], feather: [0, 0.3] },
  ];
  const layers: Layer[] = layerDefs.map((d, i) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...stadiumUniforms, uRegion: { value: new THREE.Vector4(...d.region) }, uFeather: { value: new THREE.Vector2(...d.feather) } },
      vertexShader: STADIUM_VERT,
      fragmentShader: STADIUM_FRAG,
      transparent: i > 0,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.renderOrder = i;
    bgScene.add(mesh);
    return { mesh, z: d.z, region: d.region };
  });

  /* ---------- Médaille 3D ---------- */
  const envTex = buildEnvironment(renderer);
  fgScene.environment = envTex;
  fgScene.environmentIntensity = 0.05;

  const pivot = new THREE.Group();
  const floater = new THREE.Group();
  pivot.add(floater);
  camera.add(pivot);
  pivot.position.set(0, 0.0, -LOGO_DIST);

  const faceMat = new THREE.MeshPhysicalMaterial({
    map: colorTex,
    normalMap: normalTex,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughnessMap: ormTex,
    metalnessMap: ormTex,
    roughness: 1,
    metalness: 1,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.994, 160), faceMat);
  face.position.z = T / 2;
  floater.add(face);

  const profile = [
    [0.99, T / 2],
    [1.035, T / 2 - 0.012],
    [1.062, T / 2 - 0.045],
    [1.07, T / 2 - 0.08],
    [1.07, -T / 2 + 0.06],
    [1.05, -T / 2 + 0.02],
    [0.99, -T / 2],
    [0, -T / 2],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const rimGeo = new THREE.LatheGeometry(profile, 160);
  rimGeo.rotateX(Math.PI / 2);
  carbonTex.repeat.set(36, 2);
  const rimMat = new THREE.MeshPhysicalMaterial({
    map: carbonTex,
    bumpMap: carbonTex,
    bumpScale: 2,
    color: 0xffffff,
    metalness: 0.75,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });
  floater.add(new THREE.Mesh(rimGeo, rimMat));

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.013, 16, 200),
    new THREE.MeshPhysicalMaterial({ color: 0xd90f2c, metalness: 1, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }),
  );
  ring.position.z = T / 2 - 0.004;
  floater.add(ring);

  const sweepMat = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: colorTex }, uPos: { value: -2 }, uI: { value: 0 } },
    vertexShader: PLAIN_VERT,
    fragmentShader: SWEEP_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(0.994, 96), sweepMat);
  sweep.position.z = T / 2 + 0.006;
  floater.add(sweep);

  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uI: { value: 0 } },
    vertexShader: PLAIN_VERT,
    fragmentShader: HALO_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.2), haloMat);
  halo.position.z = -0.5;
  pivot.add(halo);

  // Lumières liées à la caméra pour rester stables pendant le travelling
  const key = new THREE.DirectionalLight(0xdfe9ff, 0);
  key.position.set(-2.4, 2.6, 3);
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0);
  rim.position.set(2.6, 1.4, -LOGO_DIST - 2.4);
  const red = new THREE.PointLight(0xff2a45, 0, 7, 2);
  red.position.set(-1.5, -1.0, -LOGO_DIST + 1.3);
  const glint = new THREE.PointLight(0xffffff, 0, 6, 2);
  glint.position.set(-2, 0.3, -LOGO_DIST + 1.1);
  for (const l of [key, rim]) {
    camera.add(l, l.target);
    l.target.position.set(0, 0, -LOGO_DIST);
  }
  const hemi = new THREE.HemisphereLight(0x9db8ff, 0x0a1030, 0);
  camera.add(red, glint, hemi);

  /* ---------- Poussière atmosphérique ---------- */
  const dustCount = coarse ? 70 : 140;
  const dustGeo = new THREE.BufferGeometry();
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uI: { value: 0 }, uScale: { value: 2.2 * dpr } },
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  camera.add(dust);

  function layoutDust(aspect: number) {
    const pos = new Float32Array(dustCount * 3);
    const seed = new Float32Array(dustCount);
    const th = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    for (let i = 0; i < dustCount; i++) {
      const d = 0.9 + Math.random() * 3.4;
      pos[i * 3] = (Math.random() * 2 - 1) * d * th * aspect;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * d * th;
      pos[i * 3 + 2] = -d;
      seed[i] = Math.random();
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  }

  /* ---------- Mise en page ---------- */
  let planeW = 1;
  let planeH = 1;
  let panRange = 0;
  let logoRadius = 0.5;

  function resize() {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stadiumUniforms.uRes.value.set(w * dpr, h * dpr);

    const fh = 2 * Z_END * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const fw = fh * camera.aspect;
    planeH = Math.max(fh, fw / PHOTO_ASPECT) * 1.05;
    planeW = planeH * PHOTO_ASPECT;
    panRange = Math.max(planeW - fw, 0) / 2 * 0.72;
    for (const l of layers) {
      const s = (Z_END - l.z) / Z_END;
      const rw = l.region[2] - l.region[0];
      const rh = l.region[3] - l.region[1];
      l.mesh.scale.set(planeW * rw * s, planeH * rh * s, 1);
      l.mesh.position.set(((l.region[0] + l.region[2]) / 2 - 0.5) * planeW * s, ((l.region[1] + l.region[3]) / 2 - 0.5) * planeH * s, l.z);
    }

    const visH = 2 * LOGO_DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const visW = visH * camera.aspect;
    logoRadius = Math.min(0.235 * visH, 0.33 * visW);
    pivot.scale.setScalar(logoRadius);
    pivot.position.y = visH * 0.055;
    dustMat.uniforms.uScale.value = 2.2 * dpr * (h / 900);
    layoutDust(camera.aspect);
  }
  resize();

  const lampSection = (i: number) => Math.min(4, Math.floor((i / LAMP_COUNT) * 5));
  const rank = SECTION_ORDER.map((sec, k) => ({ sec, k }));

  function render(p: number, hold: number, exit: number, time: number) {
    /* Allumage : silhouette → sections de projecteurs → stade entier → bandeau */
    const sil = ss(0.16, 0.42, p);
    const amb = ss(0.58, 0.82, p);
    const full = ss(0.8, 0.96, p);
    const banner = ss(0.9, 0.99, p);
    const secOn = new Array(5).fill(0);
    for (const { sec, k } of rank) secOn[sec] = ss(0.4 + k * 0.06, 0.4 + k * 0.06 + 0.09, p);
    for (let i = 0; i < LAMP_COUNT; i++) {
      const on = secOn[lampSection(i)];
      const flick = on < 1 ? 0.55 + 0.45 * Math.abs(Math.sin(time * 23 + i * 5.3) * Math.sin(time * 11 + i)) : 1;
      lampVec[i].z = on * flick * (1 + full * 0.55);
    }
    stadiumUniforms.uTime.value = time;
    stadiumUniforms.uSil.value = sil * 0.55;
    stadiumUniforms.uAmb.value = amb;
    stadiumUniforms.uFull.value = full;
    stadiumUniforms.uBanner.value = banner * 0.75;

    /* Caméra : recul lent et légère montée, du gros plan des tribunes au cadre frontal */
    const x = clamp01(p / 0.97);
    const c = x * x * (3 - 2 * x);
    const cz = lerp(Z_START, Z_END, c) + exit * 0.25;
    const camX = lerp(-panRange, panRange, ss(0.05, 0.95, p)) + Math.sin(time * 0.31) * 0.004;
    const camY = lerp(-0.15, 0.05, c) + Math.sin(time * 0.23) * 0.003;
    camera.position.set(camX, camY, cz);
    camera.lookAt(camX * 0.6, lerp(-0.17, 0.0, c), 0);
    camera.updateMatrixWorld();

    /* Médaille : rotation lente de quelques degrés, flottement discret */
    const yaw = THREE.MathUtils.degToRad(lerp(-9, 8, p) + Math.sin(time * 0.6) * 1.6);
    floater.rotation.set(THREE.MathUtils.degToRad(Math.sin(time * 0.45) * 1.6 - 2), yaw, THREE.MathUtils.degToRad(Math.sin(time * 0.35) * 0.6));
    floater.position.y = Math.sin(time * 0.9) * 0.018;
    pivot.scale.setScalar(logoRadius * (1 + exit * 0.12));

    const reveal = ss(0.38, 0.9, p);
    fgScene.environmentIntensity = 0.05 + 0.8 * reveal;
    key.intensity = 3.4 * ss(0.48, 0.92, p);
    hemi.intensity = 0.9 * ss(0.42, 0.85, p);
    rim.intensity = 0.5 * ss(0.05, 0.35, p) + 3.8 * ss(0.4, 0.9, p);
    red.intensity = 9 * ss(0.6, 0.95, p);

    /* Balayages de lumière : au moment où les projecteurs s'allument, puis en fin de chargement */
    const s1 = ss(0.62, 0.82, p);
    const inFirst = s1 > 0 && s1 < 1;
    const inFinal = hold > 0 && hold < 1;
    const running = inFirst || inFinal;
    const which = inFinal ? hold : s1;
    const pos = lerp(-1.7, 1.7, which);
    sweepMat.uniforms.uPos.value = pos;
    sweepMat.uniforms.uI.value = running ? Math.sin(Math.PI * which) * 0.5 : 0;
    glint.position.x = lerp(-2.2, 2.2, which);
    glint.intensity = running ? Math.sin(Math.PI * which) * 7 : 0;

    haloMat.uniforms.uI.value = 0.05 * ss(0.3, 0.6, p) + 0.5 * ss(0.62, 0.95, p) + 0.35 * exit + (running ? 0.12 * Math.sin(Math.PI * which) : 0);
    dustMat.uniforms.uTime.value = time;
    dustMat.uniforms.uI.value = 0.15 + 0.7 * ss(0.4, 0.9, p);

    renderer.clear();
    renderer.render(bgScene, camera);
    renderer.clearDepth();
    renderer.render(fgScene, camera);
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    for (const l of layers) {
      l.mesh.geometry.dispose();
      (l.mesh.material as THREE.Material).dispose();
    }
    for (const t of [parcTex, colorTex, normalTex, ormTex, carbonTex, envTex]) t.dispose();
    fgScene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
        o.geometry.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      }
    });
    renderer.dispose();
    canvas.remove();
  }

  return { render, resize, dispose };
}
