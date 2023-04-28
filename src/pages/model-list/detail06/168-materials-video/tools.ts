import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private gui: GUI
  private video: HTMLVideoElement
  private texture: THREE.VideoTexture | null
  private material: THREE.MeshLambertMaterial
  private mesh: THREE.Mesh
  private composer: EffectComposer | null
  private mouse: THREE.Vector2
  private half: THREE.Vector2
  private cube_count: number
  private meshes: THREE.Mesh[]
  private materials: THREE.MeshLambertMaterial[]
  private grid: THREE.Vector2
  private isPlay: boolean
  private h: number
  private counter: number
  constructor(container: HTMLDivElement, video: HTMLVideoElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.video = video;
    this.texture = new THREE.VideoTexture(this.video);
    this.material = new THREE.MeshLambertMaterial();
    this.mesh = new THREE.Mesh();
    this.composer = null;
    this.cube_count = 0;
    this.mouse = new THREE.Vector2(0, 0);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.meshes = [];
    this.materials = [];
    this.grid = new THREE.Vector2(20, 10);
    this.isPlay = false;
    this.h = 0;
    this.counter = 1;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 10000);
    this.camera.position.z = 700;

    this.generateLight();
    // 渲染器
    this.createRenderer();

    const renderModel = new RenderPass(this.scene, this.camera);
    const effectBloom = new BloomPass(1.3);
    const effectCopy = new ShaderPass(CopyShader);

    this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer);
    this.composer.addPass(renderModel);
    this.composer.addPass(effectBloom);
    this.composer.addPass(effectCopy);

    this.bind();
    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    }
  }

  private setUpGUI() {
    const option = {
      play: () => {
        this.gui.close();
        if (this.isPlay) {
          return false;
        }

        this.generateVideo();
        this.createHandle();
      }
    };
    this.gui.add(option, "play").name("播放");
  }

  // 核心1
  private createHandle() {
    let i: number, j: number, ox: number, oy: number, geometry: THREE.BoxGeometry;

    const ux = 1 / this.grid.x;
    const uy = 1 / this.grid.y;

    const xsize = 480 / this.grid.x;
    const ysize = 204 / this.grid.y;

    const parameters = {color: 0xffffff, map: this.texture};
    this.cube_count = 0;

    for(i = 0; i < this.grid.x; i++) {
      for (j = 0; j < this.grid.y; j++) {
        ox = i;
        oy = j;

        geometry = new THREE.BoxGeometry(xsize, ysize, xsize);
        this.change_uvs(geometry, ux, uy, ox, oy);

        this.materials[this.cube_count] = new THREE.MeshLambertMaterial(parameters);
        this.material = this.materials[this.cube_count];
        // @ts-ignore
        this.material.hue = i / this.grid.x;
        // @ts-ignore
        this.material.saturation = 1 - j/this.grid.y;
        // @ts-ignore
        this.material.color.setHSL(this.material.hue, this.material.saturation, 0.5);

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(
          (i - this.grid.x / 2) * xsize,
          (j - this.grid.y / 2) * ysize,
          0,
        );
        this.mesh.scale.set(1, 1, 1);

        // @ts-ignore
        this.mesh.dx = 0.001 * (0.5 - Math.random());
        // @ts-ignore
        this.mesh.dy = 0.001 * (0.5 - Math.random());
        this.scene.add(this.mesh);
        this.meshes[this.cube_count] = this.mesh;
        this.cube_count += 1;
      }
    }
  }

  // 核心2
  private change_uvs(geometry: THREE.BoxGeometry, unitx: number, unity: number, offsetx: number, offsety: number) {
    // @ts-ignore
    const array = geometry.attributes.uv.array || [];
    for (let i = 0; i < array.length; i += 2) {
      array[i] = (array[i] + offsetx) * unitx;
      array[i + 1] = (array[i + 1] + offsety) * unity;
    }
  }

  private generateVideo() {
    this.video.play();
    this.video.onplay = () => {
      this.video.currentTime = 3;
    };
    this.texture = new THREE.VideoTexture(this.video);
  }

  private generateLight() {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0.5, 1, 1).normalize();
    this.scene.add(light);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
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

  // 核心3
  private render() {
    const time = Date.now() * 0.00005;
    if (this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
			this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      this.materials.forEach((material) => {
        this.material = material;
        // @ts-ignore
        this.h = (360 * (this.material.hue + time) % 360) / 360;
        // @ts-ignore
        this.material.color.setHSL(this.h, this.material.saturation, 0.5);
      });

      if (this.counter % 1000 > 200) {
        this.meshes.forEach((mesh) => {
          // @ts-ignore
          const { dx, dy } = mesh;
          this.mesh = mesh;

          this.mesh.rotation.x += 10 * dx;
          this.mesh.rotation.y += 10 * dy;
  
          // @ts-ignore
          this.mesh.position.x -= 150 * dx;
          // @ts-ignore
          this.mesh.position.y += 150 * dy;
          // @ts-ignore
          this.mesh.position.z += 300 * dx;
        });
      }

      if (this.counter % 1000 === 0) {
        this.meshes.forEach((mesh) => {
          this.mesh = mesh;
          // @ts-ignore
          this.mesh.dx *= -1;
          // @ts-ignore
          this.mesh.dy *= -1;
        });
      }
      this.counter++;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });
    
    this.render();
    this.stats?.update();

    // 执行渲染
    if (this.renderer && this.camera && this.composer) {
      this.renderer.clear();
      this.composer.render();
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.composer) {
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

