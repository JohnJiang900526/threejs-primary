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
  private readonly positions: number[][];
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
    this.positions = [
      [-0.5, 0.25, -1],
      [0, 0.25, -3],
      [2, 0.25, 0]
    ];
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
    // 创建电灯泡
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
    this.bulbLight = new THREE.PointLight(0xffee88, 1, 100, 2);
    this.bulbMat = new THREE.MeshStandardMaterial({
      // 材质的放射（光）颜色，基本上是不受其他光照影响的固有颜色。默认为黑色
      emissive: 0xffffee,
      // 放射光强度。调节发光颜色。默认为1
      emissiveIntensity: 1,
      // 材质的颜色(Color)，默认值为白色 (0xffffff)
      color: 0x000000
    });
    this.bulbLight.add(new THREE.Mesh(bulbGeometry, this.bulbMat));
    this.bulbLight.position.set(0, 2, 0);
    this.bulbLight.castShadow = true;
    this.scene.add(this.bulbLight);

    // 半球光
    this.hemiLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.02);
		this.scene.add(this.hemiLight);

    // 地板材质
    this.floorMat = new THREE.MeshStandardMaterial({
      // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。默认值为1.0。
      // 如果还提供roughnessMap，则两个值相乘
      roughness: 0.8,
      // 材质的颜色(Color)，默认值为白色 (0xffffff)
      color: 0xffffff,
      // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值。 
      // 默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
      metalness: 0.2,
      // 凹凸贴图会对材质产生多大影响。典型范围是0-1。默认值为1
      bumpScale: 0.0005
    });
    // 加载纹理
    const path = "/examples/textures/";
    const loader = new THREE.TextureLoader();
    loader.load(`${path}hardwood2_diffuse.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      // 沿着轴，通过具有最高纹素密度的像素的样本数。 默认情况下，这个值为1。
      // 设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      map.encoding = THREE.sRGBEncoding;
      // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null。 
      // 纹理贴图颜色由漫反射颜色.color调节
      this.floorMat.map = map;
      this.floorMat.needsUpdate = true;
    });
    loader.load(`${path}hardwood2_bump.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      // 用于创建凹凸贴图的纹理。黑色和白色值映射到与光照相关的感知深度。
      // 凹凸实际上不会影响对象的几何形状，只影响光照。
      // 如果定义了法线贴图，则将忽略该贴图
      this.floorMat.bumpMap = map;
      this.floorMat.needsUpdate = true;
    });
    loader.load(`${path}hardwood2_roughness.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(10, 24);
      // 该纹理的绿色通道用于改变材质的粗糙度
      this.floorMat.roughnessMap = map;
      this.floorMat.needsUpdate = true;
    });

    // 箱体材质
    this.cubeMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      color: 0xffffff,
      bumpScale: 0.002,
      metalness: 0.2
    });
    loader.load(`${path}brick_diffuse.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(1, 1);
      map.encoding = THREE.sRGBEncoding;
      this.cubeMat.map = map;
      this.cubeMat.needsUpdate = true;
    });
    loader.load(`${path}brick_bump.jpg`, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 4;
      map.repeat.set(1, 1);
      this.cubeMat.bumpMap = map;
      this.cubeMat.needsUpdate = true;
    });

    // 球体材质
    this.ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 1.0
    });
    loader.load(`${path}planets/earth_atmos_2048.jpg`, (map) => {
      map.anisotropy = 4;
      map.encoding = THREE.sRGBEncoding;
      this.ballMat.map = map;
      this.ballMat.needsUpdate = true;
    });
    loader.load(`${path}planets/earth_specular_2048.jpg`, (map) => {
      map.anisotropy = 4;
      map.encoding = THREE.sRGBEncoding;
      // 该纹理的蓝色通道用于改变材质的金属度
      this.ballMat.metalnessMap = map;
      this.ballMat.needsUpdate = true;
    });

    // 创建地板
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floor = new THREE.Mesh(floorGeometry, this.floorMat);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI/2;
    this.scene.add(floor);

    // 创建球体
    const ballGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const ball = new THREE.Mesh(ballGeometry, this.ballMat);
    ball.position.set(1, 0.25, 1);
    ball.rotation.y = Math.PI;
    ball.castShadow = true;
    this.scene.add(ball);

    // 创建三个箱子
    const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.positions.forEach((arr) => {
      const box = new THREE.Mesh(boxGeometry, this.cubeMat);
      const [x, y, z] = arr;

      box.position.set(x, y, z);
      box.castShadow = true;
      this.scene.add(box);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // 是否使用物理上正确的光照模式。 默认是false
    // @ts-ignore
    this.renderer.physicallyCorrectLights = true;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // - enabled: 如果设置开启，允许在场景中使用阴影贴图。默认是 false
    this.renderer.shadowMap.enabled = true;
    // 色调映射
    // 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
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

    if (this.renderer) {
      // 色调映射的曝光级别。默认是1
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
      // 放射光强度。调节发光颜色。默认为1
      this.bulbMat.emissiveIntensity = this.bulbLight.intensity / Math.pow(0.02, 2.0); 
      // @ts-ignore 光照强度。 缺省值 1
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

