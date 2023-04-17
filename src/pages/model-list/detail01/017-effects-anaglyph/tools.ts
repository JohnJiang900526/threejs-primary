import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private effect: null | AnaglyphEffect
  private mouseX: number
  private mouseY: number
  private halfX: number
  private halfY: number
  private spheres: THREE.Mesh[]
  private readonly path: string
  private readonly format: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.effect = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.halfX = this.width / 2;
    this.halfY = this.height / 2;
    this.spheres = [];
    this.path = "/examples/textures/cube/pisa/";
    this.format = ".png";
  }

  // 初始化方法入口
  init() {
    // 初始化 图片数组
    const urls = [
      `px${this.format}`, `nx${this.format}`, 
      `py${this.format}`, `ny${this.format}`, 
      `pz${this.format}`, `nz${this.format}`, 
    ];

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 0.01, 100);
    this.camera.position.z = 3;
    // @ts-ignore
    this.camera.focalLength = 3;

    // 创建一个场景
    const textureCube = new THREE.CubeTextureLoader().setPath(this.path).load(urls); 
    this.scene = new THREE.Scene();
    // .background : Object
    // 若不为空，在渲染场景的时候将设置背景，且背景总是首先被渲染的
    // 可以设置一个用于的“clear”的Color（颜色）、
    // 一个覆盖canvas的Texture（纹理）， 
    // 或是 a cubemap as a CubeTexture or an equirectangular as a Texture。
    // 默认值为null
    this.scene.background = textureCube;

    // 创建球体集合
    const geometry = new THREE.SphereGeometry(0.1, 32, 16);
    // .envMap : Texture
    // 环境贴图。默认值为null
    const material = new THREE.MeshBasicMaterial({color: 0xffffff, envMap: textureCube});
    for (let i = 0; i < 500; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      const scale = (Math.random() * 3 + 1);

      mesh.position.x = Math.random() * 10 - 5;
      mesh.position.y = Math.random() * 10 - 5;
      mesh.position.z = Math.random() * 10 - 5;

      // .scale : Vector3
      // 物体的局部缩放。默认值是Vector3( 1, 1, 1 )
      mesh.scale.x = scale;
      mesh.scale.y = scale;
      mesh.scale.z = scale;

      this.scene.add(mesh);
      this.spheres.push(mesh);
    }

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    // AnaglyphEffect
    this.effect = new AnaglyphEffect(this.renderer);
    this.effect.setSize(this.width, this.height);

    // 鼠标移动事件
    window.onmousemove = (e) => {
      this.mouseX = (e.clientX - this.halfX) / 100;
			this.mouseY = (e.clientY - 50 - this.halfY) / 100;
    };
    // 触摸事件
    window.ontouchmove = (event) => {
      const e = event.touches[0];
      if (e) {
        this.mouseX = (e.clientX - this.halfX) / 100;
        this.mouseY = (e.clientY - 50 - this.halfY) / 100;
      }
    };

    window.onpointermove = (e) => {
      this.mouseX = (e.clientX - this.halfX) / 100;
			this.mouseY = (e.clientY - 50 - this.halfY) / 100;
    };

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

    // 让球体动起来
    if (this.camera && this.effect && this.scene) {
      const timer = 0.0001 * Date.now();

      this.camera.position.x += ((this.mouseX - this.camera.position.x) * 0.05);
      this.camera.position.y += ((-this.mouseY - this.camera.position.y) * 0.05);

      this.camera.lookAt(this.scene.position);
      this.spheres.forEach((sphere, i) => {
        sphere.position.x = (5 * Math.cos(timer + i));
        sphere.position.y = (5 * Math.sin(timer + i * 1.1));
      });
    }

    // 统计信息更新
    if (this.stats) {
      this.stats.update();
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

