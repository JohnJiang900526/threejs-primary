import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { showLoadingToast } from 'vant';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private RADIUS: number;
  private lights_pars_begin: string;
  private lights_fragment_end: string;
  private lights: THREE.Group[];
  private State: {
    rows: number;
    cols: number;
    width: number;
    height: number;
    tileData: { value: any },
    tileTexture: { value: any },
    lightTexture: {
      value: THREE.DataTexture;
    },
  }
  private renderTarget: THREE.WebGLRenderTarget;
  private bloom: null | UnrealBloomPass;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();

    this.RADIUS = 75;
    this.lights_pars_begin = `${THREE.ShaderChunk.lights_pars_begin}`;
    this.lights_fragment_end = `${THREE.ShaderChunk.lights_fragment_end}`;
    this.lights = [];

    const data = new Float32Array(32 * 2 * 4);
    const texture = new THREE.DataTexture(data, 32, 2, THREE.RGBAFormat, THREE.FloatType);
    this.State = {
      rows: 0,
      cols: 0,
      width: 0,
      height: 0,
      tileData: { value: null },
      tileTexture: { value: null },
      lightTexture: {
        value: texture
      },
    };
    this.renderTarget = new THREE.WebGLRenderTarget();
    this.renderTarget.setSize(this.width, this.height);
    this.bloom = null;
  }

  initSet() {
    THREE.ShaderChunk['lights_pars_begin'] += `
      #if defined TILED_FORWARD
      uniform vec4 tileData;
      uniform sampler2D tileTexture;
      uniform sampler2D lightTexture;
      #endif
    `;

    THREE.ShaderChunk['lights_fragment_end'] += `
      #if defined TILED_FORWARD
      vec2 tUv = floor(gl_FragCoord.xy / tileData.xy * 32.) / 32. + tileData.zw;
      vec4 tile = texture2D(tileTexture, tUv);
      for (int i=0; i < 4; i++) {
        float tileVal = tile.x * 255.;
          tile.xyzw = tile.yzwx;
        if(tileVal == 0.){ continue; }
          float tileDiv = 128.;
        for (int j=0; j < 8; j++) {
            if (tileVal < tileDiv) {  tileDiv *= 0.5; continue; }
          tileVal -= tileDiv;
          tileDiv *= 0.5;
            PointLight pointlight;
          float uvx = (float(8 * i + j) + 0.5) / 32.;
            vec4 lightData = texture2D(lightTexture, vec2(uvx, 0.));
            vec4 lightColor = texture2D(lightTexture, vec2(uvx, 1.));
            pointlight.position = lightData.xyz;
            pointlight.distance = lightData.w;
            pointlight.color = lightColor.rgb;
            pointlight.decay = lightColor.a;
            getPointLightInfo( pointlight, geometry, directLight );
          RE_Direct( directLight, geometry, material, reflectedLight );
        }
      }
      #endif
    `;
  }

  init() {
    this.initSet();

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.onBeforeRender = (renderer, scene, camera) => {
      this.tileLights(renderer, scene, camera);
    }
    this.scene.onAfterRender = (renderer) => {
      // @ts-ignore
      this.bloom!.render(renderer, null, this.renderTarget);
    };
    this.resizeTiles();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 2000);
    this.camera.position.set(0.0, 0.0, 300.0);

    // light
    this.generateLight();
    // 渲染器
    this.createRenderer();

    // bloom
    const v2 = new THREE.Vector2(this.width, this.height);
    this.bloom = new UnrealBloomPass(v2, 0.8, 0.6, 0.8);
    this.bloom.renderToScreen = true;

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.update();

    // 加载模型
    this.loadModel();
    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private lightBounds() {
    const v = new THREE.Vector3();

    return (camera: THREE.Camera, pos: THREE.Vector3, r: number) => {
      let minX = this.State.width, maxX = 0, minY = this.State.height, maxY = 0;
      const hw = this.State.width / 2, hh = this.State.height / 2;

      for (let i = 0; i < 8; i++) {
        v.copy(pos);
        v.x += i & 1 ? r : - r;
        v.y += i & 2 ? r : - r;
        v.z += i & 4 ? r : - r;
        const vector = v.project(camera);
        const x = (vector.x * hw) + hw;
        const y = (vector.y * hh) + hh;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }

      return [minX, maxX, minY, maxY];
    }
  }

  private tileLights(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    if (!camera.projectionMatrix) { return; }

    const d = this.State.tileTexture.value.image.data;
    const ld = this.State.lightTexture.value.image.data;
    const viewMatrix = camera.matrixWorldInverse;
    d.fill(0);

    const vector = new THREE.Vector3();
    this.lights.forEach((light, index) => {
      // @ts-ignore
      const _light = light._light;
      vector.setFromMatrixPosition(light.matrixWorld);
      const lightBounds = this.lightBounds();
      const bs = lightBounds(camera, vector, _light.radius as number);

      vector.applyMatrix4(viewMatrix);
      vector.toArray(ld, 4 * index);
      ld[4 * index + 3] = _light.radius;
      _light.color.toArray(ld, 32 * 4 + 4 * index);
      ld[32 * 4 + 4 * index + 3] = _light.decay;

      if (bs[1] < 0 || bs[0] > this.State.width || bs[3] < 0 || bs[2] > this.State.height) return;
      if (bs[0] < 0) bs[0] = 0;
      if (bs[1] > this.State.width) bs[1] = this.State.width;
      if (bs[2] < 0) bs[2] = 0;
      if (bs[3] > this.State.height) bs[3] = this.State.height;

      const i4 = Math.floor(index / 8), i8 = 7 - (index % 8);
      for (let i = Math.floor(bs[2] / 32); i <= Math.ceil(bs[3] / 32); i++) {
        for (let j = Math.floor(bs[0] / 32); j <= Math.ceil(bs[1] / 32); j++) {
          d[(this.State.cols * i + j) * 4 + i4] |= 1 << i8;
        }
      }
    });

    this.State.tileTexture.value.needsUpdate = true;
    this.State.lightTexture.value.needsUpdate = true;
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.33);
    const light2 = new THREE.PointLight(0xff0000, 0.1, 0.1);
    
    this.scene.add(light1, light2);
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/walt/WaltHead.obj";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (object) => {
      toast.close();

      const mesh = object.children[0] as THREE.Mesh;
      const geometry = mesh.geometry;

      this.initHandle(geometry);
    }, undefined, () => {
      toast.close();
    });
  }

  private initHandle(geometry: THREE.BufferGeometry) {
    const materials = [];

    const Heads = [
      { type: 'physical', uniforms: { 'diffuse': 0x888888, 'metalness': 1.0, 'roughness': 0.66 }, defines: {} },
      { type: 'standard', uniforms: { 'diffuse': 0x666666, 'metalness': 0.1, 'roughness': 0.33 }, defines: {} },
      { type: 'phong', uniforms: { 'diffuse': 0x777777, 'shininess': 20 }, defines: {} },
      { type: 'phong', uniforms: { 'diffuse': 0x555555, 'shininess': 10 }, defines: { TOON: 1 } }
    ];

    const sphereGeom = new THREE.SphereGeometry(1.5, 32, 32);
    const tIndex = Math.round(Math.random() * 3);

    Heads.forEach((conf, index) => {
      const g = new THREE.Group();
      const ml = THREE.ShaderLib[conf.type];
      const mtl = new THREE.ShaderMaterial({
        lights: true,
        fragmentShader: ml.fragmentShader,
        vertexShader: ml.vertexShader,
        uniforms: THREE.UniformsUtils.clone(ml.uniforms),
        defines: conf.defines,
        transparent: tIndex === index ? true : false,
      });

      mtl.extensions.derivatives = true;

      mtl.uniforms['opacity'].value = tIndex === index ? 0.9 : 1;
      mtl.uniforms['tileData'] = this.State.tileData;
      mtl.uniforms['tileTexture'] = this.State.tileTexture;
      mtl.uniforms['lightTexture'] = this.State.lightTexture;

      for (const u in conf.uniforms) {
        // @ts-ignore
        const vu = conf.uniforms[u];
        if (mtl.uniforms[u].value.set) {
          mtl.uniforms[u].value.set(vu);
        } else {
          mtl.uniforms[u].value = vu;
        }
      }

      mtl.defines['TILED_FORWARD'] = 1;
      materials.push(mtl);

      const obj = new THREE.Mesh(geometry, mtl);
      obj.position.y = -37;
      mtl.side = tIndex === index ? THREE.FrontSide : THREE.DoubleSide;

      g.rotation.y = index * Math.PI / 2;
      g.position.x = Math.sin(index * Math.PI / 2) * this.RADIUS;
      g.position.z = Math.cos(index * Math.PI / 2) * this.RADIUS;
      g.add(obj);

      for (let i = 0; i < 8; i++) {
        const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
        const l = new THREE.Group();

        {
          const material = new THREE.MeshBasicMaterial({ color: color });
          const mesh = new THREE.Mesh(sphereGeom, material); 
          l.add(mesh);
        }

        {
          const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.033
          });
          const mesh = new THREE.Mesh(sphereGeom, material); 
          l.add(mesh);
        }

        l.children[1].scale.set(6.66, 6.66, 6.66);

        // @ts-ignore
        l._light = {
          color: color,
          radius: this.RADIUS,
          decay: 1,
          sy: Math.random(),
          sr: Math.random(),
          sc: Math.random(),
          py: Math.random() * Math.PI,
          pr: Math.random() * Math.PI,
          pc: Math.random() * Math.PI,
          dir: Math.random() > 0.5 ? 1 : - 1
        };

        this.lights.push(l);
        g.add(l);
      }
      this.scene.add(g);
    });

    this.renderer?.setAnimationLoop((timer) => {
      this.stats?.update();
      this.controls?.update();
      this.render(timer / 1000);
      
      // 执行渲染
      this.renderer?.setRenderTarget(this.renderTarget);
      this.renderer?.render(this.scene, this.camera!);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  private resizeTiles() {
    this.State.width = this.width;
    this.State.height = this.height;

    this.State.cols = Math.ceil(this.width / 32);
    this.State.rows = Math.ceil(this.height / 32);

    this.State.tileData.value = [
      this.width, this.height, 
      0.5 / Math.ceil(this.width / 32), 
      0.5 / Math.ceil(this.height / 32),
    ];

    const data = new Uint8Array(this.State.cols * this.State.rows * 4);
    const tileTexture = new THREE.DataTexture(data, this.State.cols, this.State.rows);;
    this.State.tileTexture.value = tileTexture;
  }

  private render(now: number) {
    this.lights.forEach((l) => {
      // @ts-ignore
      const ld = l._light;
      const radius = 0.8 + 0.2 * Math.sin(ld.pr + (0.6 + 0.3 * ld.sr) * now);
      l.position.x = (Math.sin(ld.pc + (0.8 + 0.2 * ld.sc) * now * ld.dir)) * radius * this.RADIUS;
      l.position.z = (Math.cos(ld.pc + (0.8 + 0.2 * ld.sc) * now * ld.dir)) * radius * this.RADIUS;
      l.position.y = Math.sin(ld.py + (0.8 + 0.2 * ld.sy) * now) * radius * 32;
    });
  }

  // 消除 副作用
  dispose() {
    THREE.ShaderChunk['lights_pars_begin'] = this.lights_pars_begin;
    THREE.ShaderChunk['lights_fragment_end'] = this.lights_fragment_end;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
      this.renderTarget.setSize(this.width, this.height);

      this.resizeTiles();
    };
  }
}

export default THREE;

