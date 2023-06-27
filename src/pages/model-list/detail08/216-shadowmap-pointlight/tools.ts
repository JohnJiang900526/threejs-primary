import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private pointLight1: THREE.PointLight;
  private pointLight2: THREE.PointLight;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.pointLight1 = new THREE.PointLight();
    this.pointLight2 = new THREE.PointLight();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 1000);
    this.camera.position.set(0, 10, 120);

    // light
    this.generateLight();
    // model
    this.createModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 10, 0);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createModel() {
    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshPhongMaterial({
      color: 0xa0adaf,
      shininess: 10,
      specular: 0x111111,
      side: THREE.BackSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 10;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0x111122);
    
    this.pointLight1 = this.createLight(0x0088ff);
    this.pointLight2 = this.createLight(0xff8888);
    
    this.scene.add(ambient, this.pointLight1, this.pointLight2);
  }

  private createLight(color: number) {
    const intensity = 2;

    const light = new THREE.PointLight(color, intensity, 20);
    light.castShadow = true;
    light.shadow.bias = -0.005;

    let geometry = new THREE.SphereGeometry(0.3, 12, 6);
    let material:THREE.MeshBasicMaterial | THREE.MeshPhongMaterial = new THREE.MeshBasicMaterial({ color: color });
    material.color.multiplyScalar(intensity);
    let sphere = new THREE.Mesh(geometry, material);
    light.add(sphere);

    const texture = new THREE.CanvasTexture(this.generateTexture());
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1, 4.5);

    geometry = new THREE.SphereGeometry(2, 32, 8);
    material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      alphaMap: texture,
      alphaTest: 0.5
    });

    sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    light.add(sphere);

    const distanceMaterial = new THREE.MeshDistanceMaterial({
      alphaMap: material.alphaMap,
      alphaTest: material.alphaTest
    });
    sphere.customDistanceMaterial = distanceMaterial;

    return light;
  }

  private generateTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.fillStyle = 'white';
		context.fillRect(0, 1, 2, 1);

    return canvas;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
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

  private render() {
    let time = performance.now() * 0.001;

    {
      this.pointLight1.position.set(
        Math.sin( time * 0.6 ) * 9,
        Math.sin( time * 0.7 ) * 9 + 6,
        Math.sin( time * 0.8 ) * 9,
      );
      this.pointLight1.rotation.x = time;
      this.pointLight1.rotation.z = time;
    }

    time += 10000;

    {
      this.pointLight2.position.set(
        Math.sin( time * 0.6 ) * 9,
        Math.sin( time * 0.7 ) * 9 + 6,
        Math.sin( time * 0.8 ) * 9,
      );
      this.pointLight2.rotation.x = time;
      this.pointLight2.rotation.z = time;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();
    this.stats?.update();
    
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

