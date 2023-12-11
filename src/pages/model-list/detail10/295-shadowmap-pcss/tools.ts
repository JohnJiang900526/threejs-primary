import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';
import { PCSS, PCSSGetShadow } from './vars';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private group: THREE.Group;
  private shadowmap_pars_fragment: string;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.group = new THREE.Group();
    this.shadowmap_pars_fragment = `${THREE.ShaderChunk.shadowmap_pars_fragment}`;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xcce0ff, 5, 100);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.set(7, 13, 7);

    // 光线
    this.generateLight();

    // 圆球
    this.genereteSpheres();

    // 地板和柱状物
    this.createGroundAndColumn();

    this.retSetShader();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 75;
    this.controls.target.set(0, 2.5, 0);
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

  private generateLight() {
    const light1 = new THREE.AmbientLight(0x666666)

    const light2 = new THREE.DirectionalLight(0xdfebff, 1.75);
    light2.position.set(2, 8, 4);
    light2.castShadow = true;
    light2.shadow.mapSize.width = 1024;
    light2.shadow.mapSize.height = 1024;
    light2.shadow.camera.far = 20;

    this.scene.add(light1, light2);

    const helper = new THREE.CameraHelper(light2.shadow.camera);
    this.scene.add(helper);
  }

  private genereteSpheres() {
    const geometry = new THREE.SphereGeometry(0.3, 20, 20);

    for (let i = 0; i < 20; i++) {
      const material = new THREE.MeshPhongMaterial({ 
        color: Math.random() * 0xffffff 
      });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = Math.random() - 0.5;
      sphere.position.z = Math.random() - 0.5;
      sphere.position.normalize();
      sphere.position.multiplyScalar(Math.random() * 2 + 1);

      sphere.castShadow = true;
      sphere.receiveShadow = true;

      sphere.userData.phase = Math.random() * Math.PI;

      this.group.add(sphere);
    }
  }

  private createGroundAndColumn() {
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x404040, 
      specular: 0x111111
    });

    {
      const geometry = new THREE.PlaneGeometry(20000, 20000, 8, 8);
      const ground = new THREE.Mesh(geometry, material);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    {
      const geometry = new THREE.BoxGeometry(1, 4, 1);
      const column = new THREE.Mesh(geometry, material);
      column.position.y = 2;
      column.castShadow = true;
      column.receiveShadow = true;
      this.scene.add(column);
    }
  }

  private retSetShader() {
    let shader = THREE.ShaderChunk.shadowmap_pars_fragment;

    shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP' + PCSS);

    shader = shader.replace('#if defined( SHADOWMAP_TYPE_PCF )', PCSSGetShadow + '#if defined( SHADOWMAP_TYPE_PCF )');

    THREE.ShaderChunk.shadowmap_pars_fragment = shader;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    const time = performance.now() / 1000;
    this.group.traverse((obj) => {
      if ('phase' in obj.userData) {
        const y = Math.abs(Math.sin(time + obj.userData.phase)) * 4 + 0.3;
        obj.position.y = y;
      }
    });

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    THREE.ShaderChunk.shadowmap_pars_fragment = this.shadowmap_pars_fragment;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

