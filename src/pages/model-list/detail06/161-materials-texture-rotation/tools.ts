import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

  private mesh: THREE.Mesh
  private controls: null | OrbitControls;
  private gui: GUI;
  private params: {
    UvTransform: boolean,
    offsetX: number,
    offsetY: number,
    repeatX: number,
    repeatY: number,
    rotation: number,
    centerX: number,
    centerY: number,
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mesh = new THREE.Mesh();
    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.params = {
      UvTransform: false,
      offsetX: 0,
      offsetY: 0,
      repeatX: 0.25,
      repeatY: 0.25,
      rotation: Math.PI / 4,
      centerX: 0.5,
      centerY: 0.5
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(10, 15, 25);
    this.scene.add(this.camera);

    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 20;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.addEventListener("change", () => { this.render(); });

    this.setUpGUI();
    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, "UvTransform").onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'offsetX', 0.0, 1.0 ).name('offset.x').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'offsetY', 0.0, 1.0 ).name('offset.y').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'repeatX', 0.25, 2.0 ).name('repeat.x').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'repeatY', 0.25, 2.0 ).name('repeat.y').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'rotation', - 2.0, 2.0 ).name('rotation').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'centerX', 0.0, 1.0 ).name('center.x').onChange(() => {
      this.updateTransform();
    });
    this.gui.add(this.params, 'centerY', 0.0, 1.0 ).name('center.y').onChange(() => {
      this.updateTransform();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private loadModel() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/uv_grid_opengl.jpg";
    const geometry = new THREE.BoxGeometry(6, 6, 6);

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (texture) => {
      toast.close();

      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = (this.renderer as THREE.WebGLRenderer).capabilities.getMaxAnisotropy();

      const material = new THREE.MeshBasicMaterial({map: texture});
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.y = 2;
      this.scene.add(this.mesh);

      this.updateTransform();
    }, undefined, () => { toast.close(); });
  }

  // 更新 核心方法
  private updateTransform() {
    const texture = (this.mesh.material as THREE.MeshBasicMaterial).map as THREE.Texture;

    if (texture.matrixAutoUpdate) {
      texture.offset.set(this.params.offsetX, this.params.offsetY);
      texture.repeat.set(this.params.repeatX, this.params.repeatY);
      texture.center.set(this.params.centerX, this.params.centerY);
      texture.rotation = this.params.rotation;
    } else {
      if (!this.params.UvTransform) {
        // 方案1
        // 将此矩阵重置为3x3单位矩阵
        texture.matrix.identity();
        texture.matrix.translate(-this.params.centerX, -this.params.centerY)
        texture.matrix.rotate(this.params.rotation)
        texture.matrix.scale(this.params.repeatX, this.params.repeatY)
        texture.matrix.translate(this.params.centerX, this.params.centerY)
        texture.matrix.translate(this.params.offsetX, this.params.offsetY);
      } else {
        // 方案2
        texture.matrix.setUvTransform(
          this.params.offsetX, this.params.offsetY, 
          this.params.repeatX, this.params.repeatY, 
          this.params.rotation, 
          this.params.centerX, this.params.centerY
        );
      }
    }

    this.render();
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

  private render() {
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });
    
    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
      this.render();
    };
  }
}

export default THREE;

