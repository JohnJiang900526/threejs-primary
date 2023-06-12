import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { FocusShader } from 'three/examples/jsm/shaders/FocusShader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mesh: THREE.Points
  private parent: THREE.Object3D
  private meshes: {
    mesh: THREE.Points, 
    verticesDown: number, 
    verticesUp: number, 
    direction: number, 
    speed: number, 
    delay: number,
    start: number,
  }[]
  private clonemeshes: {mesh: THREE.Points, speed: number}[]
  private composer: null | EffectComposer
  private effectFocus: null | ShaderPass
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mesh = new THREE.Points();
    this.parent = new THREE.Object3D();
    this.meshes = [];
    this.clonemeshes = [];
    this.composer = null;
    this.effectFocus = null;
    this.clock = new THREE.Clock();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000104);
		this.scene.fog = new THREE.FogExp2(0x000104, 0.0000675);
    this.scene.add(this.parent);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 50000);
    this.camera.position.set(0, 700, 7000);
    this.camera.lookAt(this.scene.position);

    // 创建模型
    this.loadModel();
    this.createGird();
    
    // 渲染器
    this.createRenderer();
    this.postProcessing();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url1 = "/examples/models/obj/male02/male02.obj";
    const url2 = "/examples/models/obj/female02/female02.obj";

    loader.load(url1, (object) => {
      const positions = this.combineBuffer(object, "position");
      
      this.createMesh(positions, this.scene, 4.05, - 500, - 350, 600, 0xff7744);
      this.createMesh(positions, this.scene, 4.05, 500, - 350, 0, 0xff5522);
      this.createMesh(positions, this.scene, 4.05, - 250, - 350, 1500, 0xff9922);
      this.createMesh(positions, this.scene, 4.05, - 250, - 350, - 1500, 0xff99ff);
    });

    loader.load(url2, (object) => {
      const positions = this.combineBuffer(object, "position");
      
      this.createMesh(positions, this.scene, 4.05, - 1000, - 350, 0, 0xffdd44);
      this.createMesh(positions, this.scene, 4.05, 0, - 350, 0, 0xffffff);
      this.createMesh(positions, this.scene, 4.05, 1000, - 350, 400, 0xff4422);
      this.createMesh(positions, this.scene, 4.05, 250, - 350, 1500, 0xff9955);
      this.createMesh(positions, this.scene, 4.05, 250, - 350, 2500, 0xff77dd);
    });
  }

  // 核心
  private createMesh(positions: THREE.BufferAttribute, scene: THREE.Scene, scale: number, x: number, y: number, z: number, color: number) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positions.clone());
    geometry.setAttribute('initialPosition', positions.clone());

    (geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

    const clones = [
      [6000, 0, - 4000],
      [5000, 0, 0],
      [1000, 0, 5000],
      [1000, 0, - 5000],
      [4000, 0, 2000],
      [- 4000, 0, 1000],
      [- 5000, 0, - 5000],
      [0, 0, 0]
    ];

    clones.forEach((item, i) => {
      const c = ( i < clones.length - 1 ) ? 0x252525 : color;
      this.mesh = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 30, color: c }));
      this.mesh.scale.set(scale, scale, scale);

      this.mesh.position.set(
        x + clones[i][0],
        y + clones[i][1],
        z + clones[i][2],
      );

      this.parent.add(this.mesh);
      this.clonemeshes.push({ mesh: this.mesh, speed: 0.5 + Math.random() });
    });

    this.meshes.push({
      mesh: this.mesh, 
      verticesDown: 0, 
      verticesUp: 0, 
      direction: 0, 
      speed: 15, 
      delay: Math.floor(200 + 200 * Math.random()),
      start: Math.floor(100 + 200 * Math.random()),
    });
  }

  private combineBuffer(model: THREE.Group, bufferName: string) {
    let count = 0;

    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const buffer = mesh.geometry.attributes[bufferName] as THREE.Float32BufferAttribute;
        count += buffer.array.length;
      }
    });

    const combined = new Float32Array(count);
    let offset = 0;

    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const buffer = mesh.geometry.attributes[bufferName] as THREE.Float32BufferAttribute;
        combined.set(buffer.array, offset);
        offset += buffer.array.length;
      }
    });

    return new THREE.BufferAttribute(combined, 3);
  }

  private postProcessing() {
    const renderModel = new RenderPass(this.scene, this.camera as THREE.PerspectiveCamera);
    const effectBloom = new BloomPass( 0.75 );
    const effectFilm = new FilmPass(0.5, 0.5, 1448, 0);

    this.effectFocus = new ShaderPass(FocusShader);
    this.effectFocus.uniforms['screenWidth'].value = this.width * window.devicePixelRatio;
    this.effectFocus.uniforms['screenHeight'].value = this.height * window.devicePixelRatio;

    this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer);
    this.composer.addPass(renderModel);
    this.composer.addPass(effectBloom);
    this.composer.addPass(effectFilm);
    this.composer.addPass(this.effectFocus);
  }

  private createGird() {
    const geometry = new THREE.PlaneGeometry(15000, 15000, 64, 64);
    const material = new THREE.PointsMaterial({ color: 0xff0000, size: 10 });

    const grid = new THREE.Points(geometry, material);
    grid.position.y = -400;
    grid.rotation.x = -Math.PI / 2;

    this.parent.add(grid);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.autoClear = false;
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

  // 核心逻辑 还没吃透
  private render() {
    let delta = 10 * this.clock.getDelta();
    delta = delta < 2 ? delta : 2;
    this.parent.rotation.y += - 0.02 * delta;

    this.clonemeshes.forEach((cm) => {
      cm.mesh.rotation.y += -0.1 * delta * cm.speed;
    });

    this.meshes.forEach((data) => {
      const positions = data.mesh.geometry.attributes.position as THREE.BufferAttribute;
      const initialPositions = data.mesh.geometry.attributes.initialPosition as THREE.BufferAttribute;
      const count = positions.count;

      if (data.start > 0) {
        data.start -= 1;
      } else {
        if (data.direction === 0) {
          data.direction = -1;
        }
      }

      for(let i = 0; i < count; i++) {
        const px = positions.getX(i);
        const py = positions.getY(i);
        const pz = positions.getZ(i);

        // falling down
        if (data.direction < 0) {
          if (py > 0) {
            positions.setXYZ(
              i,
              px + 1.5 * (0.50 - Math.random()) * data.speed * delta,
              py + 3.0 * (0.25 - Math.random()) * data.speed * delta,
              pz + 1.5 * (0.50 - Math.random()) * data.speed * delta
            );
          } else {
            data.verticesDown += 1;
          }
        }

        // rising up
        if ( data.direction > 0 ) {
          const ix = initialPositions.getX(i);
          const iy = initialPositions.getY(i);
          const iz = initialPositions.getZ(i);

          const dx = Math.abs(px - ix);
          const dy = Math.abs(py - iy);
          const dz = Math.abs(pz - iz);

          const d = dx + dy + dx;
          if ( d > 1 ) {
            positions.setXYZ(
              i,
              px - (px - ix) / dx * data.speed * delta * (0.85 - Math.random()),
              py - (py - iy) / dy * data.speed * delta * (1 + Math.random()),
              pz - (pz - iz) / dz * data.speed * delta * (0.85 - Math.random())
            );
          } else {
            data.verticesUp += 1;
          }
        }
      }

      // all vertices down
      if (data.verticesDown >= count) {
        if (data.delay <= 0) {
          data.direction = 1;
          data.speed = 5;
          data.verticesDown = 0;
          data.delay = 320;
        } else {
          data.delay -= 1;
        }
      }

      // all vertices up
      if (data.verticesUp >= count) {
        if (data.delay <= 0) {
          data.direction = -1;
          data.speed = 15;
          data.verticesUp = 0;
          data.delay = 120;
        } else {
          data.delay -= 1;
        }
      }
      positions.needsUpdate = true;
    });

    this.composer?.render(0.1);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    this.render();
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.composer && this.effectFocus) {
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);

				this.effectFocus.uniforms['screenWidth'].value = this.width * window.devicePixelRatio;
        this.effectFocus.uniforms['screenHeight'].value = this.height * window.devicePixelRatio;
      }
    };
  }
}

export default THREE;

