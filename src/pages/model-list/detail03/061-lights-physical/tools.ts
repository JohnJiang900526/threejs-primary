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
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private bulbLight: THREE.PointLight;
  private bulbMat: THREE.MeshStandardMaterial;
  private hemiLight: THREE.HemisphereLight;
  private ballMat: THREE.MeshStandardMaterial;
  private cubeMat: THREE.MeshStandardMaterial;
  private floorMat: THREE.MeshStandardMaterial;
  private previousShadowMap: boolean;
  private bulbLuminousPowers: {
    '110000 lm (1000W)': number,
    '3500 lm (300W)': number,
    '1700 lm (100W)': number,
    '800 lm (60W)': number,
    '400 lm (40W)': number,
    '180 lm (25W)': number,
    '20 lm (4W)': number,
    'Off': number
  }
  private hemiLuminousIrradiances: {
    '0.0001 lx (Moonless Night)': number,
    '0.002 lx (Night Airglow)': number,
    '0.5 lx (Full Moon)': number,
    '3.4 lx (City Twilight)': number,
    '50 lx (Living Room)': number,
    '100 lx (Very Overcast)': number,
    '350 lx (Office Room)': number,
    '400 lx (Sunrise/Sunset)': number,
    '1000 lx (Overcast)': number,
    '18000 lx (Daylight)': number,
    '50000 lx (Direct Sun)': number
  }
  private params: {
    shadows: boolean,
    exposure: number,
    bulbPower: string,
    hemiIrradiance: string
  }
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
    this.bulbLight = new THREE.PointLight();
    this.bulbMat = new THREE.MeshStandardMaterial();
    this.hemiLight = new THREE.HemisphereLight();
    this.ballMat = new THREE.MeshStandardMaterial();
    this.cubeMat = new THREE.MeshStandardMaterial();
    this.floorMat = new THREE.MeshStandardMaterial();
    this.previousShadowMap = false;
    this.bulbLuminousPowers = {
      '110000 lm (1000W)': 110000,
      '3500 lm (300W)': 3500,
      '1700 lm (100W)': 1700,
      '800 lm (60W)': 800,
      '400 lm (40W)': 400,
      '180 lm (25W)': 180,
      '20 lm (4W)': 20,
      'Off': 0
    };
    this.hemiLuminousIrradiances = {
      '0.0001 lx (Moonless Night)': 0.0001,
      '0.002 lx (Night Airglow)': 0.002,
      '0.5 lx (Full Moon)': 0.5,
      '3.4 lx (City Twilight)': 3.4,
      '50 lx (Living Room)': 50,
      '100 lx (Very Overcast)': 100,
      '350 lx (Office Room)': 350,
      '400 lx (Sunrise/Sunset)': 400,
      '1000 lx (Overcast)': 1000,
      '18000 lx (Daylight)': 18000,
      '50000 lx (Direct Sun)': 50000
    }
    this.params = {
      shadows: true,
      exposure: 0.68,
      bulbPower: Object.keys(this.bulbLuminousPowers)[4],
      hemiIrradiance: Object.keys(this.hemiLuminousIrradiances)[0]
    };
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 0.1, 100);
    this.camera.position.set(-4, 2, 4);

    // 创建模型
    this.createModel();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置属性
  setAttr(obj: any) {
    this.params = Object.assign(this.params, obj);
  }

  // 创建模型
  private createModel() {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);

    this.bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);
    this.bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 1,
      color: 0x000000
    });
    this.bulbLight.add(new THREE.Mesh(bulbGeometry, this.bulbMat));
    this.bulbLight.position.set(0, 2, 0);
    this.bulbLight.castShadow = true;
    this.scene.add(this.bulbLight);

    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
		this.scene.add(this.hemiLight);

    this.floorMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      color: 0xffffff,
      metalness: 0.2,
      bumpScale: 0.0005
    });

    // 加载材质
    const path = "/examples/textures/";
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(`${path}hardwood2_diffuse.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      map.encoding = THREE.sRGBEncoding;
      this.floorMat.map = map;
      this.floorMat.needsUpdate = true;
    });
    textureLoader.load(`${path}hardwood2_bump.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      this.floorMat.bumpMap = map;
      this.floorMat.needsUpdate = true;
    });
    textureLoader.load(`${path}hardwood2_roughness.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      this.floorMat.roughnessMap = map;
      this.floorMat.needsUpdate = true;
    });

    this.cubeMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0xffffff,
      bumpScale: 0.002,
      metalness: 0.2
    });
    textureLoader.load(`${path}brick_diffuse.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(1, 1);
      map.encoding = THREE.sRGBEncoding;
      this.cubeMat.map = map;
      this.cubeMat.needsUpdate = true;
    });
    textureLoader.load(`${path}brick_bump.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(1, 1);
      this.cubeMat.bumpMap = map;
      this.cubeMat.needsUpdate = true;
    });

    this.ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 1.0
    });
    textureLoader.load(`${path}planets/earth_atmos_2048.jpg`, (map) => {
      map.anisotropy = 4;
      map.encoding = THREE.sRGBEncoding;
      this.ballMat.map = map;
      this.ballMat.needsUpdate = true;
    });
    textureLoader.load(`${path}planets/earth_specular_2048.jpg`, (map) => {
      map.anisotropy = 4;
      map.encoding = THREE.sRGBEncoding;
      this.ballMat.metalnessMap = map;
      this.ballMat.needsUpdate = true;
    });

    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMesh = new THREE.Mesh(floorGeometry, this.floorMat);
    floorMesh.receiveShadow = true;
    floorMesh.rotation.x = -Math.PI / 2.0;
    this.scene.add(floorMesh);

    const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const ballMesh = new THREE.Mesh(ballGeometry, this.ballMat);
    ballMesh.position.set(1, 0.25, 1);
    ballMesh.rotation.y = Math.PI;
    ballMesh.castShadow = true;
    this.scene.add(ballMesh);

    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const boxMesh = new THREE.Mesh(boxGeometry, this.cubeMat);
    boxMesh.position.set(-0.5, 0.25, -1);
    boxMesh.castShadow = true;
    this.scene.add(boxMesh);

    const boxMesh2 = new THREE.Mesh(boxGeometry, this.cubeMat);
    boxMesh2.position.set(0, 0.25, -3);
    boxMesh2.castShadow = true;
    this.scene.add(boxMesh2);

    const boxMesh3 = new THREE.Mesh(boxGeometry, this.cubeMat);
    boxMesh3.position.set(2, 0.25, 0);
    boxMesh3.castShadow = true;
    this.scene.add(boxMesh3);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
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

    if (this.renderer) {
      this.renderer.toneMappingExposure = Math.pow(this.params.exposure, 5.0);
      this.renderer.shadowMap.enabled = this.params.shadows;
      this.bulbLight.castShadow = this.params.shadows;

      if (this.params.shadows !== this.previousShadowMap) {
        this.ballMat.needsUpdate = true;
        this.cubeMat.needsUpdate = true;
        this.floorMat.needsUpdate = true;
        this.previousShadowMap = this.params.shadows;
      }

      // @ts-ignore
      this.bulbLight.power = this.bulbLuminousPowers[this.params.bulbPower];
      this.bulbMat.emissiveIntensity = this.bulbLight.intensity / Math.pow(0.02, 2.0); 
      // @ts-ignore
      this.hemiLight.intensity = this.hemiLuminousIrradiances[this.params.hemiIrradiance];

      const time = Date.now() * 0.0005;
      this.bulbLight.position.y = Math.cos(time) * 0.75 + 1.25;
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
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

