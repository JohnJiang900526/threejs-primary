import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls
  private particleLight: THREE.Mesh
  private group: THREE.Group
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
    this.particleLight = new THREE.Mesh();
    this.group = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 1000;

    // 加载材质
    this.loadTexture(() => {
      this.generateLight();
    });
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

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
    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({color: 0xffffff});
    const light = new THREE.PointLight(0xffffff, 1);

    this.particleLight = new THREE.Mesh(geometry, material);
    this.particleLight.add(light);

    this.scene.add(this.particleLight);
  }

  private generateMesh() {
    const geometry = new THREE.SphereGeometry(80, 64, 32);
    const loader = new THREE.TextureLoader();

    const diffuseUrl = "/examples/textures/carbon/Carbon.png";
    const diffuse = loader.load(diffuseUrl);
    diffuse.encoding = THREE.sRGBEncoding;
    // 纹理贴图在水平方向上将如何包裹，在UV映射中对应于U。默认值是THREE.ClampToEdgeWrapping
    diffuse.wrapS = THREE.RepeatWrapping;
    // 定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V。可以使用与 .wrapS : number相同的选项
    diffuse.wrapT = THREE.RepeatWrapping;
    // 纹理在表面上重复的次数，在U和v的每个方向上。如果repeat在任何一个方向上都大于1，
    // 相应的Wrap参数也应该设置为THREE。重复包装或三。使用mirrrerepeatwrapped来达到
    // 想要的平铺效果。为纹理设置不同的重复值的限制方式与offset相同
    diffuse.repeat.set(10, 10)

    const normalMapUrl = "/examples/textures/carbon/Carbon_Normal.png";
    const normalMap = loader.load(normalMapUrl);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    const normalMap2Url = "/examples/textures/water/Water_1_M_Normal.jpg";
    const normalMap2 = loader.load(normalMap2Url);

    const normalMap3 = new THREE.CanvasTexture(new FlakesTexture());
    normalMap3.wrapS = THREE.RepeatWrapping;
    normalMap3.wrapT = THREE.RepeatWrapping;
    normalMap3.repeat.set(10, 6);
    // 沿着轴，通过具有最高纹素密度的像素的样本数。 默认情况下，这个值为1。
    // 设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本。
    // 使用renderer.capabilities.getMaxAnisotropy() 来查询GPU中各向异性的最大有效值；这个值通常是2的幂
    normalMap3.anisotropy = 16;

    const normalMap4Url = "/examples/textures/golfball.jpg";
    const normalMap4 = loader.load(normalMap4Url);

    const clearcoatNormalMapUrl = "/examples/textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png";
    const clearcoatNormalMap = loader.load(clearcoatNormalMapUrl);

    {
      const material = new THREE.MeshPhysicalMaterial({
        // 表示clear coat层的强度，范围从0.0到1.0m，当需要在表面加一层薄薄的半透明材质的时候，
        // 可以使用与clear coat相关的属性，默认为0.0
        clearcoat: 1.0,
        // clear coat层的粗糙度，由0.0到1.0。 默认为0.0
        clearcoatRoughness: 0.1,
        metalness: 0.9,
        roughness: 0.5,
        color: 0x0000ff,
        normalMap: normalMap3,
        // 法线贴图对材质的影响程度。典型范围是0-1。默认值是Vector2设置为（1,1）
        normalScale: new THREE.Vector2(0.15, 0.15)
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
      mesh.position.y = 100;
      this.group.add(mesh);
    }

    {
      const material = new THREE.MeshPhysicalMaterial({
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        map: diffuse,
        normalMap: normalMap
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 100;
      mesh.position.y = 100;
      this.group.add(mesh);
    }

    {
      const material = new THREE.MeshPhysicalMaterial({
        metalness: 0.0,
        roughness: 0.1,
        clearcoat: 1.0,
        normalMap: normalMap4,
        // 用于为clear coat层设置的独立的法线贴图，默认为null
        clearcoatNormalMap: clearcoatNormalMap,
        // 衡量.clearcoatNormalMap影响clear coat层多少的值，由(0,0)到(1,1)，默认为(1,1)
        clearcoatNormalScale: new THREE.Vector2(2.0, -2.0)
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
      mesh.position.y = -100;
      this.group.add(mesh);
    }

    {
      const material = new THREE.MeshPhysicalMaterial({
        clearcoat: 1.0,
        metalness: 1.0,
        color: 0xff0000,
        normalMap: normalMap2,
        normalScale: new THREE.Vector2(0.15, 0.15),
        clearcoatNormalMap: clearcoatNormalMap,
        clearcoatNormalScale: new THREE.Vector2(2.0, -2.0)
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 100;
      mesh.position.y = -100;
      this.group.add(mesh);
    }
  }

  private loadTexture(fn?: () => void) {
    const loader = new HDRCubeTextureLoader();
    const path = "/examples/textures/cube/pisaHDR/";
    const urls = ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];

    // toast
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.setPath(path).load(urls, (texture) => {
      toast.close();

      this.scene.background = texture;
      this.scene.environment = texture;

      this.generateMesh();
      fn && fn();
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
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

    const timer = Date.now() * 0.00025;
    this.particleLight.position.set(
      Math.sin(timer * 7) * 300,
      Math.cos(timer * 5) * 400,
      Math.cos(timer * 3) * 300,
    );

    this.group.children.forEach((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.rotation.y += 0.0005;
    });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
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

