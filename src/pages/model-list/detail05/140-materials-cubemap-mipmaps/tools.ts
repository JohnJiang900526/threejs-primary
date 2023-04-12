import * as THREE from 'three';
import { showFailToast, showLoadingToast } from 'vant';
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

  private controls: null | OrbitControls
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
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 800;

    // 渲染模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.autoRotate = true;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.maxPolarAngle = Math.PI / 1.5;
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

  // 创建模型
  private generateModel() {
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loadCubeTexture().then((cubeTexture) => {
      toast.close();
      this.generateMesh(cubeTexture);
    }).catch((e) => {
      toast.close();
      showFailToast(e.message);
    });
  }

  // 创建mesh
  private generateMesh(cubeTexture: THREE.CubeTexture) {
    const sphere = new THREE.SphereGeometry(100, 128, 128);
    // 模型1
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      envMap: cubeTexture 
    });
    material.name = 'manual mipmaps';
    const mesh1 = new THREE.Mesh(sphere, material);
    mesh1.name = 'manual mipmaps';
    mesh1.position.set(0, 125, 0);

    // 模型2
    const material1 = material.clone();
    material1.name = 'auto mipmaps';
    const autoCubeTexture = cubeTexture.clone();
    autoCubeTexture.mipmaps = [];
    autoCubeTexture.generateMipmaps = true;
    autoCubeTexture.needsUpdate = true;
    material1.envMap = autoCubeTexture;

    const mesh2 = new THREE.Mesh(sphere, material1);
    mesh2.position.set(0, -125, 0);
    mesh2.name = 'auto mipmaps';

    this.scene.add(mesh1, mesh2);
  }

  // 加载cube贴图
  private async loadCubeTexture() {
    const path = '/examples/textures/cube/angus/';
    const format = '.jpg';
    const mipmaps: THREE.CubeTexture[] = [];
    const maxLevel = 8;

    const loadTexture = async (urls: string[]) => {
      return new Promise<THREE.CubeTexture>((resolve) => {
        const loader = new THREE.CubeTextureLoader();
        loader.load(urls, function (cubeTexture) {
          resolve(cubeTexture);
        }, undefined, () => {
          resolve(new THREE.CubeTexture());
        });
      });
    };

    const pendings = [];
    for (let level = 0; level <= maxLevel; level++) {
      const urls: string[] = [];

      for (let face = 0; face < 6; face++) {
        urls.push(`${path}cube_m0${level}_c0${face}${format}`);
      }
      const mipmapLevel = level;
      pendings.push(loadTexture(urls).then((cubeTexture) => {
        mipmaps[mipmapLevel] = cubeTexture;
      }));
    }

    await Promise.all(pendings);

    const cubeTexture = mipmaps.shift() as THREE.CubeTexture;
    // 用户所给定的mipmap数组（可选）
    cubeTexture.mipmaps = mipmaps;
    // 当一个纹素覆盖小于一个像素时，贴图将如何采样。
    // 默认值为THREE.LinearMipmapLinearFilter， 它将使用mipmapping以及三次线性滤镜
    cubeTexture.minFilter = THREE.LinearMipMapLinearFilter;
    // 当一个纹素覆盖大于一个像素时，贴图将如何采样。
    // 默认值为THREE.LinearFilter， 它将获取四个最接近的纹素，并在他们之间进行双线性插值。 
    // 另一个选项是THREE.NearestFilter，它将使用最接近的纹素的值
    cubeTexture.magFilter = THREE.LinearFilter;
    // 是否为纹理生成mipmap（如果可用）。默认为true。 如果你手动生成mipmap，请将其设为false
    cubeTexture.generateMipmaps = false;
    // 将其设置为true，以便在下次使用纹理时触发一次更新。 这对于设置包裹模式尤其重要
    cubeTexture.needsUpdate = true;

    return cubeTexture;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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

