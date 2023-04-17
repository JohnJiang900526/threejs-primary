import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBMLoader } from 'three/examples/jsm/loaders/RGBMLoader';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader';
// @ts-ignore
import { DebugEnvironment } from 'three/examples/jsm/environments/DebugEnvironment';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private gui: GUI
  private controls: null | OrbitControls
  private params: {
    envMap: string,
    roughness: number,
    metalness: number,
    exposure: number,
    debug: boolean,
  }
  private torusMesh: THREE.Mesh
  private planeMesh: THREE.Mesh
  private generatedCubeRenderTarget: null | THREE.WebGLRenderTarget
  private ldrCubeRenderTarget: null | THREE.WebGLRenderTarget
  private hdrCubeRenderTarget: null | THREE.WebGLRenderTarget
  private rgbmCubeRenderTarget: null | THREE.WebGLRenderTarget
  private ldrCubeMap: THREE.CubeTexture
  private hdrCubeMap: THREE.CubeTexture
  private rgbmCubeMap: THREE.CubeTexture
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.controls = null;
    this.params = {
      envMap: 'HDR',
      roughness: 0.0,
      metalness: 0.0,
      exposure: 1.0,
      debug: false,
    };
    this.torusMesh = new THREE.Mesh();
    this.planeMesh = new THREE.Mesh();
    this.generatedCubeRenderTarget = null;
    this.ldrCubeRenderTarget = null;
    this.hdrCubeRenderTarget = null;
    this.rgbmCubeRenderTarget = null;
    this.ldrCubeMap = new THREE.CubeTexture();
    this.hdrCubeMap = new THREE.CubeTexture();
    this.rgbmCubeMap = new THREE.CubeTexture();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 120)

    this.generateMesh();
    // 渲染器
    this.createRenderer();
    this.loadTexture();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 50;
		this.controls.maxDistance = 300;

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'envMap', ['HDR', 'Generated', 'LDR', 'RGBM16']).name("环境贴图");
    this.gui.add(this.params, 'roughness', 0, 1, 0.01).name("粗糙程度");
    this.gui.add(this.params, 'metalness', 0, 1, 0.01).name("金属感程度");
    this.gui.add(this.params, 'exposure', 0, 2, 0.01).name("曝光度");
    this.gui.add(this.params, 'debug').name("显示桌面");
  }

  private generateMesh() {
    {
      // 圆环缓冲扭结几何体（TorusKnotGeometry）
      // 创建一个圆环扭结，其特殊形状由一对互质的整数，p和q所定义。
      // 如果p和q不互质，创建出来的几何体将是一个环面链接

      // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
      // radius - 圆环的半径，默认值为1。
      // tube — 管道的半径，默认值为0.4。
      // tubularSegments — 管道的分段数量，默认值为64。
      // radialSegments — 横截面分段数量，默认值为8。
      // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2。
      // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3。
      const geometry = new THREE.TorusKnotGeometry(10, 3, 150, 20);
      const material = new THREE.MeshStandardMaterial({
        // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值。 
        // 默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
        metalness: this.params.metalness,
        // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。
        // 默认值为1.0。如果还提供roughnessMap，则两个值相乘
        roughness: this.params.roughness,
        // 通过乘以环境贴图的颜色来缩放环境贴图的效果
        envMapIntensity: 1.0,
      });

      this.torusMesh = new THREE.Mesh(geometry, material);
    }

    {
      // 平面缓冲几何体（PlaneGeometry）
      // 一个用于生成平面几何体的类
      const geometry = new THREE.PlaneGeometry(200, 200);
      const material = new THREE.MeshBasicMaterial();
  
      this.planeMesh = new THREE.Mesh(geometry, material);
      this.planeMesh.position.y = -50;
      this.planeMesh.rotation.x = -Math.PI * 0.5;
    }

    this.scene.add(this.torusMesh, this.planeMesh);
  }

  private loadTexture () {
    // 这个类从cubeMap环境纹理生成预过滤、mipmmapped Radiance Environment Map (PMREM)。
    // 这允许基于材质粗糙度快速访问不同级别的模糊。它被打包成一种特殊的CubeUV格式，
    // 允许我们执行自定义插值，这样我们就可以支持RGBE等非线性格式。与传统的mipmap链不同，
    // 它只会下降到LOD MIN级别(上图)，然后在相同的LOD MIN分辨率下创建额外的更多过滤“mips”，
    // 与更高的粗糙度级别相关。这样我们就能保持平滑的分辨率
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);

    // 预编译等矩形着色器。通过在纹理的网络获取期间调用此方法，可以获得更快的启动速度，从而提高并发性。
    pmremGenerator.compileEquirectangularShader();
    // LoadingManager是一个全局实例, 当其他加载器没有指定加载管理器时，
    //它将被其他大多数的加载器设为默认的加载管理器。

    // LoadingManager对于大多数加载器来说已经足够了，但有时您可能需要
    // 单独设置加载管理器，例如纹理、模型加载器。
    THREE.DefaultLoadingManager.onLoad = () => {
      pmremGenerator.dispose();
    };

    // hdr
    {
      const urls = ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];
      const path = "/examples/textures/cube/pisaHDR/";
      const loader = (new HDRCubeTextureLoader()).setPath(path);

      this.hdrCubeMap = loader.load(urls, () => {
        this.hdrCubeRenderTarget = pmremGenerator.fromCubemap(this.hdrCubeMap);
        this.hdrCubeMap.magFilter = THREE.LinearFilter;
        this.hdrCubeMap.needsUpdate = true;
      });
    }

    // ldr
    {
      const urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
      const path = "/examples/textures/cube/pisa/";
      const loader = (new THREE.CubeTextureLoader()).setPath(path);
      this.ldrCubeMap = loader.load(urls, () => {
        this.ldrCubeMap.encoding = THREE.sRGBEncoding;
        this.ldrCubeRenderTarget = pmremGenerator.fromCubemap(this.ldrCubeMap);
      });
    }

    // rgb16
    {
      const urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
      const path = "/examples/textures/cube/pisaRGBM16/";
      const loader = (new RGBMLoader()).setPath(path).setMaxRange(16);

      this.rgbmCubeMap = loader.loadCubemap(urls, () => {
        this.rgbmCubeRenderTarget = pmremGenerator.fromCubemap(this.rgbmCubeMap);
      });
    }

    // generated
    const envScene = new DebugEnvironment();
    this.generatedCubeRenderTarget = pmremGenerator.fromScene(envScene);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // @ts-ignore
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

  private render() {
    const material = this.torusMesh.material as THREE.MeshStandardMaterial;
    material.roughness = this.params.roughness;
    material.metalness = this.params.metalness;

    let renderTarget, cubeMap = new THREE.Texture();
    switch (this.params.envMap) {
      case 'Generated':
        renderTarget = this.generatedCubeRenderTarget;
        cubeMap = this.generatedCubeRenderTarget?.texture as THREE.Texture;
        break;
      case 'LDR':
        renderTarget = this.ldrCubeRenderTarget;
        cubeMap = this.ldrCubeMap;
        break;
      case 'HDR':
        renderTarget = this.hdrCubeRenderTarget;
        cubeMap = this.hdrCubeMap;
        break;
      case 'RGBM16':
        renderTarget = this.rgbmCubeRenderTarget;
        cubeMap = this.rgbmCubeMap;
        break;
    }

    {
      const material = this.torusMesh.material as THREE.MeshStandardMaterial;
      const material1 = this.planeMesh.material as THREE.MeshBasicMaterial;
      const newEnvMap = renderTarget ? renderTarget.texture : null;

      if (newEnvMap !== material.envMap) {
        material.envMap = newEnvMap;
        material.needsUpdate = true;
  
        material1.map = newEnvMap;
        material1.needsUpdate = true;
      }
  
      this.torusMesh.rotation.y += 0.005;
      this.planeMesh.visible = this.params.debug;
      this.scene.background = cubeMap;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    
    this.stats?.update();
    this.controls?.update();
    this.render();

    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      // 色调映射的曝光级别。默认是1
      this.renderer.toneMappingExposure = this.params.exposure;
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

