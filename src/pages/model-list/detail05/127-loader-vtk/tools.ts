import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.01, 1e10);
    this.camera.position.set(0, 0, 0.2);
    this.scene.add(this.camera);

    // 创建光线
    this.createLight();

    // 创建模型
    this.loadModel();

    // webgl渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 0.5;
    this.controls.rotateSpeed = 1.0;
    this.controls.minPolarAngle = Math.PI/2;
    this.controls.maxPolarAngle = Math.PI/2;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createLight() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(2, 2, 2);

    this.scene.add(light1, light2);
  }

  // 加载模型
  private loadModel() {
    const loader = new VTKLoader();
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    {
      const url = "/examples/models/vtk/bunny.vtk";
      loader.load(url, (geometry) => {
        toast.close();

        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.name = "mesh";
        mesh.position.set(0, -0.075, 0);
        mesh.scale.multiplyScalar(0.2);
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    }

    {
      const url = "/examples/models/vtk/cube_ascii.vtp";
      loader.load(url, (geometry) => {
        toast.close();

        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.name = "mesh";
        mesh.position.set(0, -0.025, 0);
        mesh.scale.multiplyScalar(0.01);
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    }

    {
      const url = "/examples/models/vtk/cube_binary.vtp";
      loader.load(url, (geometry) => {
        toast.close();

        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.name = "mesh";
        mesh.position.set(0, 0.025, 0);
        mesh.scale.multiplyScalar(0.01);
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    }

    {
      const url = "/examples/models/vtk/cube_no_compression.vtp";
      loader.load(url, (geometry) => {
        toast.close();

        geometry.center();
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.name = "mesh";
        mesh.position.set(0, 0.075, 0);
        mesh.scale.multiplyScalar(0.01);
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    }
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.scene.traverse((object) => {
      if (object.name === "mesh") {
        object.rotation.y += 0.005;
      }
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

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
    };
  }
}

export default THREE;

