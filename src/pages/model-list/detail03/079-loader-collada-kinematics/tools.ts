import * as THREE from 'three';
import { showLoadingToast } from "vant";
import TWEEN, { Tween } from '@tweenjs/tween.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import type { KinematicsType } from '.';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private particleLight: THREE.Mesh
  private dae: THREE.Scene
  private kinematics: null | KinematicsType
  private kinematicsTween: null | Tween<{[key: string]: number}>
  private tweenParameters: {[key: string]: any}
  private timer: any
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.particleLight = new THREE.Mesh();
    this.dae = new THREE.Scene();
    this.kinematics = null;
    this.kinematicsTween = null;
    this.tweenParameters = {};
    this.timer = null;
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 2000);
    this.camera.position.set(20, 10, 20);
    this.camera.lookAt(0, 5, 0);

    // 加载模型
    this.loadModel();

    // 地板
    this.createFloor();

    // 灯光
    this.createLight();

    // 渲染器
    this.createRenderer();
    
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createFloor() {
    const helper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    this.scene.add(helper);
  }

  // 创建光源
  private createLight() {
    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.particleLight = new THREE.Mesh(geometry, material);
    this.scene.add(this.particleLight);

    const light = new THREE.HemisphereLight(0xffeeee, 0x111122);
    this.scene.add(light);

    const pointLight = new THREE.PointLight(0xffffff, 0.3);
    this.particleLight.add(pointLight);
  }

  // 加载模型
  private loadModel() {
    const loader = new ColladaLoader();
    const url = "/examples/models/collada/abb_irb52_7_120.dae";

    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (collada) => {
      toast.close();

      this.dae = collada.scene;
      this.dae.traverse((child) => {
        const obj = child as THREE.Mesh;
        if (obj.isMesh) {
          // @ts-ignore
          obj.material.flatShading = true;
        }
      });

      this.dae.scale.set(10.0, 10.0, 10.0);
      this.dae.updateMatrix();
      this.kinematics = collada.kinematics as KinematicsType;
      this.scene.add(this.dae);
      this.setupTween();
    }, undefined, () => {
      toast.close();
    });
  }

  // 设置 补间动画
  private setupTween() {
    const that = this;
    const duration = THREE.MathUtils.randInt(1000, 5000);
    const target: {[key: string]: any} = {};

    if (this.kinematics) {
      for (const prop in this.kinematics.joints) {
        if (this.kinematics.joints[prop]) {
          if (!this.kinematics.joints[prop].static) {
            const joint = this.kinematics.joints[prop];
            const old = this.tweenParameters[prop];
            const position = old ? old : joint.zeroPosition;
            
            this.tweenParameters[prop] = position;
            target[prop] = THREE.MathUtils.randInt(joint.limits.min, joint.limits.max);
          }
        }
      }
  
      this.kinematicsTween = new Tween<{[key: string]: number}>(this.tweenParameters).to(target, duration).easing(TWEEN.Easing.Quadratic.Out);
      this.kinematicsTween.onUpdate((object) => {
        if (that.kinematics) {
          for (const prop in that.kinematics.joints) {
            const joint = that.kinematics.joints[prop];
            if (joint && !joint.static) {
              that.kinematics.setJointValue(prop, object[prop]);
            }
          }
        }
      });
      this.kinematicsTween.start();
    }

    this.timer && clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.setupTween(); }, duration);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

    TWEEN.update();
    if (this.camera) {
      const timer = Date.now() * 0.0001;

      const x = Math.cos(timer) * 20;
      const y = 10;
      const z = Math.sin(timer) * 20;

      this.camera.position.set(x, y, z);
      this.camera.lookAt(0, 5, 0);

      this.particleLight.position.set(
        Math.sin(timer * 4) * 3009,
        Math.cos(timer * 5) * 4000,
        Math.cos(timer * 4) * 3009,
      );
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 执行渲染
    if (this.camera && this.renderer) {
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

