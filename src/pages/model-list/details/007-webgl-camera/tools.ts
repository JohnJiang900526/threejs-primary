import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private clock: null | THREE.Clock
  private process: number
  private model: null | THREE.Group
  private stats: null | Stats
  private control: null | OrbitControls
  private mixers: THREE.AnimationMixer[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.clock = null;
    this.process = 0;
    this.model = null;
    this.stats = null;
    this.control = null;
    this.mixers = [];
  }

  init() {
    
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
    
    // 混合器需要更新 否则动画不执行
    if (this.mixers && this.clock) {
      const delta = this.clock.getDelta();
      this.mixers.forEach((mixer) => { mixer.update(delta); });
    }

    // 控制器跟随更新
    if (this.control) {
      this.control.update();
    }

    // 渲染器同步渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer?.render(this.scene, this.camera);
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

