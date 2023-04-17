import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  
  private cameraTarget: THREE.Vector3
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.cameraTarget = new THREE.Vector3(0, -0.1, 0);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x72645b);
    this.scene.fog = new THREE.Fog(0x72645b, 2, 15);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 15);
    this.camera.position.set(3, 0.15, 3);

    this.createLight();
    this.createGround();

    // 加载模型
    this.loadModel();

    // webgl渲染器
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

  private createGround() {
    const material = new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), material);

    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.5;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  private createLight() {
    const light = new THREE.HemisphereLight(0x443333, 0x111122);

    this.scene.add(light);
    this.addShadowedLight(1, 1, 1, 0xffffff, 1.35);
    this.addShadowedLight(0.5, 1, - 1, 0xffaa00, 1);
  }

  // 添加光线
  private addShadowedLight(x: number, y: number, z: number, color: number, intensity: number) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    light.castShadow = true;

    // 正交相机（OrthographicCamera）
    // 这一摄像机使用orthographic projection（正交投影）来进行投影
    // 在这种投影模式下，无论物体距离相机距离远或者近，在最终渲染的图片中物体的大小都保持不变
    // 这对于渲染2D场景或者UI元素是非常有用的
    light.shadow.camera.left = -1;
    light.shadow.camera.right = 1;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -1;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 4;

    // 一个Vector2定义阴影贴图的宽度和高度
    // 较高的值会以计算时间为代价提供更好的阴影质量。
    // 值必须是2的幂，直到给定设备的WebGLRenderer.capabilities.maxTextureSize， 
    // 虽然宽度和高度不必相同（例如，（512,1024）有效）。 默认值为*（512,512）
    light.shadow.mapSize.set(1024, 1024);
    // 阴影贴图偏差，在确定曲面是否在阴影中时，从标准化深度添加或减去多少。
    // 默认值为0.此处非常小的调整（大约0.0001）可能有助于减少阴影中的伪影
    light.shadow.bias = -0.001;
    
    this.scene.add(light);
  }

  // 加载模型
  private loadModel() {
    const loader = new PLYLoader();
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    (() => {
      const url = `/examples/models/ply/binary/Lucy100k.ply`;
      loader.load(url, (geometry) => {
        toast.close();
        // 通过面片法向量的平均值计算每个顶点的法向量
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({color: 0x0055ff, flatShading: true});
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(-0.2, -0.02, -0.2);
        mesh.scale.multiplyScalar(0.0006);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    })();

    (() => {
      const url = `/examples/models/ply/ascii/dolphins.ply`;
      loader.load(url, (geometry) => {
        toast.close();
        // 通过面片法向量的平均值计算每个顶点的法向量
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({color: 0x0055ff, flatShading: true});
        const mesh = new THREE.Mesh(geometry, material);

        mesh.rotation.x = -Math.PI/2;
        mesh.position.y = -0.2;
        mesh.position.z = 0.3;
        mesh.scale.multiplyScalar(0.001);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      }, undefined, () => { toast.close(); });
    })();
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
    const timer = Date.now() * 0.0005;

    if (this.camera) {
      this.camera.position.x = Math.sin(timer) * 2.5;
      this.camera.position.z = Math.cos(timer) * 2.5;
      this.camera.lookAt(this.cameraTarget);
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

