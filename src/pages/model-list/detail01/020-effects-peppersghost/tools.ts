import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PeppersGhostEffect } from 'three/examples/jsm/effects/PeppersGhostEffect';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats; 
  private effect: null | PeppersGhostEffect
  private group: null | THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.effect = null;
    this.group = null;
  }

  // 初始化方法入口
  init() {
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 0.01, 100000);

    // 创建一个场景
    this.scene = new THREE.Scene();

    // 创建一个分组
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // 创建cube立方体
    const geometry = new THREE.BoxGeometry().toNonIndexed();
    const position = geometry.attributes.position;
    const colors = [];
    const color = new THREE.Color();
    // 为立方体的每一面生成不同的颜色
    for (let i = 0; i < position.count; i += 6) {
      color.setHex(Math.random() * 0xffffff);
      // 第一面
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      // 第二面
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    // 创建材质
    const material = new THREE.MeshBasicMaterial({vertexColors: true});
    for (let i = 0; i < 10; i ++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = Math.random() * 2 - 1;
      cube.position.y = Math.random() * 2 - 1;
      cube.position.z = Math.random() * 2 - 1;
      cube.scale.multiplyScalar(Math.random() + 0.5);
      this.group.add(cube);
    }

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 创建effect
    this.effect = new PeppersGhostEffect(this.renderer);
    this.effect.setSize(this.width, this.height);
    this.effect.cameraDistance = 5;

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
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

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // group
    if (this.group) {
      this.group.rotation.y += 0.01;
    }

    // 执行渲染
    if (this.scene && this.camera && this.effect) {
      this.effect.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.effect) {
        this.effect.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

