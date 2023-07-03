import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import GUI from 'lil-gui';
import { showLoadingToast } from 'vant';

class MeshCustomNodeMaterial extends Nodes.MeshStandardNodeMaterial {
  constructor() {
    super();
  }
}

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

  private controls: null | TrackballControls;
  private pmremGenerator: null | THREE.PMREMGenerator;
  private environments: {
    'Venice Sunset': { filename: string, texture?: THREE.Texture },
		'Overpass': { filename: string, texture?: THREE.Texture }
  };
  private params: {
    environment: string
  }
  private gui: GUI
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
    this.pmremGenerator = null;
    this.environments = {
      'Venice Sunset': { 
        filename: 'venice_sunset_1k.hdr',
      },
      'Overpass': { 
        filename: 'pedestrian_overpass_1k.hdr',
      }
    };
    this.params = {
      environment: Object.keys(this.environments)[0]
    };
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.z = 6;

    // light
    const hemisphere = new THREE.HemisphereLight(0x443333, 0x222233, 4);
    this.scene.add(hemisphere);

    this.initMaterial();

    {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loadModel().then(() => {
        toast.close();
      }).catch(() => { toast.close(); });
    }

    {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loadEnvironment(this.params.environment).then(() => {
        toast.close();
      }).catch(() => { toast.close(); });
    }

    // 渲染器
    this.createRenderer();

    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'environment', Object.keys(this.environments)).onChange((value: string) => {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loadEnvironment(value).then(() => {
        toast.close();
      }).catch(() => { toast.close(); });

    });
  }

  private async loadEnvironment(name: string) {
    // @ts-ignore
    if (this.environments[name].texture) {
      // @ts-ignore
      this.scene.background = this.environments[name].texture;
      // @ts-ignore
      this.scene.environment = this.environments[name].texture;
      return;
    }

    // @ts-ignore
    const filename = this.environments[name].filename as string;
    const loader = new RGBELoader().setPath('/examples/textures/equirectangular/');
    const hdrEquirect = await loader.loadAsync(filename);

    const hdrCubeRenderTarget = this.pmremGenerator?.fromEquirectangular(hdrEquirect) as THREE.WebGLRenderTarget;
    hdrEquirect.dispose();

    this.scene.background = hdrCubeRenderTarget.texture;
    this.scene.environment = hdrCubeRenderTarget.texture;
    // @ts-ignore
    this.environments[name].texture = hdrCubeRenderTarget.texture;
  }

  private async loadModel() {
    const material = new MeshCustomNodeMaterial();
    const objLoader = new OBJLoader();
    const url = "/examples/models/obj/cerberus/Cerberus.obj";

    const group = await objLoader.loadAsync(url);
    const loaderManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loaderManager).setPath('/examples/models/obj/cerberus/');

    const diffuseMap = await loader.loadAsync('Cerberus_A.jpg');
    diffuseMap.wrapS = THREE.RepeatWrapping;
    diffuseMap.encoding = THREE.sRGBEncoding;

    const rmMap = await loader.loadAsync('Cerberus_RM.jpg');
    rmMap.wrapS = THREE.RepeatWrapping;

    const normalMap = await loader.loadAsync('Cerberus_N.jpg');
    normalMap.wrapS = THREE.RepeatWrapping;

    const mpMapNode = new Nodes.TextureNode(rmMap);

    // @ts-ignore
    material.colorNode = new Nodes.OperatorNode('*', new Nodes.TextureNode(diffuseMap), new Nodes.UniformNode(material.color));
    material.roughnessNode = new Nodes.SplitNode(mpMapNode, 'g');
    material.metalnessNode = new Nodes.SplitNode(mpMapNode, 'b');
    material.normalNode = new Nodes.NormalMapNode(new Nodes.TextureNode(normalMap));

    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) { mesh.material = material; }
    });
    group.position.x = -0.45;
    group.rotation.y = -Math.PI / 2;

    const groupJSON = JSON.stringify(group.toJSON());
    const objectLoader = new Nodes.NodeObjectLoader();

    objectLoader.parse(JSON.parse(groupJSON), (newGroup) => {
      newGroup.position.copy(group.position);
      newGroup.rotation.copy(group.rotation);
      this.scene.add(newGroup);
    });
  }

  private initMaterial() {
    // @ts-ignore
    const superCreateMaterialFromType = THREE.MaterialLoader.createMaterialFromType;
    // @ts-ignore
    THREE.MaterialLoader.createMaterialFromType = function (type: string) {
      const materialLib: {[key: string]: MeshCustomNodeMaterial} = {
        // @ts-ignore
        MeshCustomNodeMaterial
      };

      if (materialLib[type]) {
        // @ts-ignore
        return new materialLib[type]();
      }
      return superCreateMaterialFromType.call(this, type);
    };
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 3;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
		this.pmremGenerator.compileEquirectangularShader();
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

    nodeFrame.update();
    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
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

