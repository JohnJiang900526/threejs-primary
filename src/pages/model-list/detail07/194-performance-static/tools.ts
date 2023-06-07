import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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

  private objects: THREE.Mesh[];
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.objects = [];
    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.matrixAutoUpdate = false;

    // 相机
    this.camera = new THREE.PerspectiveCamera(90, this.aspect, 1, 10000);
    this.camera.position.z = 4000;

    // 创建模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    this.bind();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 核心事件
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = (e.clientX - this.half.x) * 10;
        const y = (e.clientY - 45 - this.half.y) * 10;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        if (e.isPrimary) { return; }
        const x = (e.clientX - this.half.x) * 10;
        const y = (e.clientY - 45 - this.half.y) * 10;
        this.mouse.set(x, y);
      };
    }
  }

  private loadModel() {
    const material = new THREE.MeshNormalMaterial();
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/suzanne_buffergeometry.json";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (geometry) => {
      toast.close();
      geometry.computeVertexNormals();

      for(let i = 0; i < 7700; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        const scale = Math.random() * 50 + 100;

        mesh.position.set(
          Math.random() * 10000 - 5000,
          Math.random() * 10000 - 5000,
          Math.random() * 10000 - 5000,
        );
        mesh.rotation.x = Math.random() * 2 * Math.PI;
        mesh.rotation.y = Math.random() * 2 * Math.PI;
        mesh.scale.set(scale, scale, scale);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();

        this.objects.push(mesh);
        this.scene.add(mesh);
      }
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    if (this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * .05;
      this.camera.position.y += (-this.mouse.y - this.camera.position.y) * .05;
      this.camera.lookAt(this.scene.position);
    }
    
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
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

