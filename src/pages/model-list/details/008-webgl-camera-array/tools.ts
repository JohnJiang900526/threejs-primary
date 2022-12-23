import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.ArrayCamera
  private stats: null | Stats
  private readonly amount: number
  private aspect: number
  private mesh: null | THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.amount = 6;
    this.aspect = this.width/this.height;
    this.mesh = null;
  }

  getCameras() {
    // 设备像素比
    const devicePixelRatio = window.devicePixelRatio;
    const width = (this.width/this.amount) * devicePixelRatio;
    const height = (this.height/this.amount) * devicePixelRatio;
    const cameras:THREE.PerspectiveCamera[] = [];

    for (let i = 0; i < this.amount; i++) {
      for (let j = 0; j < this.amount; j++) {
        const camera = new THREE.PerspectiveCamera(40, this.aspect, 0.1, 10);
        // @ts-ignore
        camera.viewport = new THREE.Vector4(Math.floor(j * width), Math.floor(i * height), Math.ceil(width), Math.ceil(height));
        camera.position.x = (j / this.amount) - 0.5;
        camera.position.y = 0.5 - (i / this.amount);
        camera.position.z = 1.5;
        camera.position.multiplyScalar(2);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        cameras.push(camera);
      }
    }

    return cameras;
  }

  init() {
    // 主相机
    const cameras = this.getCameras();
    this.camera = new THREE.ArrayCamera(cameras);
    this.camera.position.z = 3;

    // 创建一个主场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x212190);
    // 在主场景中添加一束光
    this.scene.add(new THREE.AmbientLight(0x222244));

    // 创建一束平行光
    const light = new THREE.DirectionalLight();
    light.position.set(0.5, 0.5, 1);
    light.castShadow = true;
    light.shadow.camera.zoom = 4;
    this.scene.add(light);

    // 设置背景颜色
    const geometryBackground = new THREE.PlaneGeometry(100, 100);
    const materialBackground = new THREE.MeshPhongMaterial({color: 0x000066});
    const backgroud = new THREE.Mesh(geometryBackground, materialBackground);
    backgroud.receiveShadow = true;
    backgroud.position.set(0, 0, -1);
    this.scene.add(backgroud);

    // 圆柱体
    const geometryCylinder = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32);
    const materialCylinder = new THREE.MeshPhongMaterial({color: 0xff0000});
    this.mesh = new THREE.Mesh(geometryCylinder, materialCylinder);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // 性能统计信息
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.animate();
    this.resize();
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });
    
    // 统计信息更新
    if (this.stats) {
      this.stats.update();
    }

    if (this.mesh) {
      this.mesh.rotation.x += 0.005;
      this.mesh.rotation.z += 0.01;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width/this.height;
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

