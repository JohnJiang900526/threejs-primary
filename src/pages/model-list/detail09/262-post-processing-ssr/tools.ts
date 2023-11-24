import { showLoadingToast } from 'vant';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

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
  private composer: null | EffectComposer;
  private ssrPass: null | SSRPass;
  private otherMeshes: THREE.Mesh[];
  private groundReflector: null | ReflectorForSSRPass;
  private selects: THREE.Mesh[];
  private params: {
    enableSSR: boolean,
    autoRotate: boolean,
    otherMeshes: boolean,
    groundReflector: boolean,
  }
  private gui: GUI;
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
    this.composer = null;
    this.ssrPass = null;
    this.otherMeshes = [];
    this.groundReflector = null;
    this.selects = [];
    this.params = {
      enableSSR: true,
			autoRotate: true,
			otherMeshes: true,
			groundReflector: true,
    };
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x443333);
		this.scene.fog = new THREE.Fog(0x443333, 1, 4);

    // 相机
    this.camera = new THREE.PerspectiveCamera(35, this.aspect, 0.1, 15);
    this.camera.position.set(0.13271600513224902, 0.3489546826045913, 0.43921296427927076);

    // 地板
    this.generateGround();
    // 灯光
    this.generateLight();
    // mesh
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer!.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.0635, 0);
    this.controls.enabled = this.params.autoRotate;
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.params, 'enableSSR').name('启用SSR');
    this.gui.add(this.params, 'groundReflector' ).onChange(() => {
      if (this.params.groundReflector) {
        this.ssrPass!.groundReflector = this.groundReflector,
        this.ssrPass!.selects = this.selects;
      } else {
        this.ssrPass!.groundReflector = null,
        this.ssrPass!.selects = null;
      }
    });
    this.ssrPass!.thickness = 0.018;
    this.gui.add(this.ssrPass!, 'thickness', 0, 1, 0.0001);
    // @ts-ignore
    this.ssrPass!.infiniteThick = false;
    this.gui.add(this.ssrPass!, 'infiniteThick');
    this.gui.add(this.params, 'autoRotate').onChange(() => {
      this.controls!.enabled = !this.params.autoRotate;
    });

    const folder = this.gui.addFolder('更多设置');
    folder.add(this.ssrPass!, 'fresnel').onChange(()=>{
      // @ts-ignore
      this.groundReflector!.fresnel = this.ssrPass!.fresnel;
    });
    folder.add(this.ssrPass!, 'distanceAttenuation').onChange(() => {
      this.groundReflector!.distanceAttenuation = this.ssrPass!.isDistanceAttenuation;
    });
    this.ssrPass!.maxDistance = 0.1;
    this.groundReflector!.maxDistance = this.ssrPass!.maxDistance;
    folder.add(this.ssrPass!, 'maxDistance', 0, 0.5, 0.001).onChange(() => {
      this.groundReflector!.maxDistance = this.ssrPass!.maxDistance;
    });
    folder.add(this.params, 'otherMeshes').onChange(() => {
      if (this.params.otherMeshes) {
        this.otherMeshes.forEach(mesh => mesh.visible = true);
      } else {
        this.otherMeshes.forEach(mesh => mesh.visible = false);
      }
    });
    folder.add(this.ssrPass!, 'bouncing');

    const values = {
      'Default': SSRPass.OUTPUT.Default,
      'SSR Only': SSRPass.OUTPUT.SSR,
      'Beauty': SSRPass.OUTPUT.Beauty,
      'Depth': SSRPass.OUTPUT.Depth,
      'Normal': SSRPass.OUTPUT.Normal,
      'Metalness': SSRPass.OUTPUT.Metalness,
    };
    folder.add(this.ssrPass!, 'output', values).onChange((value: string) => {
      this.ssrPass!.output = parseInt(value);
    });
    this.ssrPass!.opacity = 1;
    this.groundReflector!.opacity = this.ssrPass!.opacity;
    folder.add(this.ssrPass!, 'opacity', 0, 1).onChange( ()=>{
      this.groundReflector!.opacity = this.ssrPass!.opacity;
    });
    folder.add(this.ssrPass!, 'blur');
    folder.close();
  }

  private generateLight() {
    const light1 = new THREE.HemisphereLight(0x443333, 0x111122);

    const light2 = new THREE.SpotLight();
    light2.angle = Math.PI / 16;
    light2.penumbra = 0.5;
    light2.position.set(-1, 1, 1);

    this.scene.add(light1, light2);
  }

  private generateGround() {
    const geometry = new THREE.PlaneGeometry(8, 8);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x999999, 
      specular: 0x101010 
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.0001;

    this.scene.add(plane);
  }

  private generateMesh() {
    {
      // 兔子
      const loader = new DRACOLoader();
      loader.setDecoderPath('/examples/js/libs/draco/');
      loader.setDecoderConfig({ type: 'js'});
      const url = "/examples/models/draco/bunny.drc";
      const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      loader.load(url, (geometry) => {
        toast.close();
        // 通过面片法向量的平均值计算每个顶点的法向量
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = -0.0365;
        this.scene.add(mesh);
        this.selects.push(mesh);
        loader.dispose();
      }, undefined, () => { toast.close(); });
    }

    {
      // 绿色的箱子
      const geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
			const material = new THREE.MeshStandardMaterial({ color: 'green' });
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(-0.12, 0.025, 0.015);
			this.scene.add(mesh);
			this.otherMeshes.push(mesh);
			this.selects.push(mesh);
    }

    {
      // 圆形的球体
      // 二十面缓冲几何体（IcosahedronGeometry）
			const geometry = new THREE.IcosahedronGeometry(0.025, 4);
			const material = new THREE.MeshStandardMaterial({ color: 'cyan' });
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(-0.05, 0.025, 0.08);
			this.scene.add(mesh);
			this.otherMeshes.push(mesh);
			this.selects.push(mesh);
    }

    {
      // 黄色的圆锥
      // 圆锥缓冲几何体（ConeGeometry）
			const geometry = new THREE.ConeGeometry(0.025, 0.05, 64);
			const material = new THREE.MeshStandardMaterial({ color: 'yellow' });
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(-0.05, 0.025, -0.055);
			this.scene.add(mesh);
			this.otherMeshes.push(mesh);
			this.selects.push(mesh);
    }

    {
      const geometry = new THREE.PlaneGeometry(1, 1);
			this.groundReflector = new ReflectorForSSRPass(geometry, {
				clipBias: 0.0003,
				textureWidth: this.width,
				textureHeight: this.height,
				color: 0x888888,
				useDepthTexture: true,
			});
      // 渲染此材质是否对深度缓冲区有任何影响。默认为true。
			this.groundReflector.visible = false;
			this.groundReflector.rotation.x = -Math.PI / 2;
			this.groundReflector.material.depthWrite = false;
			this.scene.add(this.groundReflector);
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    const reflector = this.params.groundReflector ? this.groundReflector : null;
    const selects = this.params.groundReflector ? this.selects : null;
    this.ssrPass = new SSRPass({
      renderer: this.renderer!,
      scene: this.scene,
      camera: this.camera!,
      width: this.width,
      height: this.height,
      groundReflector: reflector,
      selects: selects,
    });
    this.composer.addPass(this.ssrPass);

    const shaderPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(shaderPass);
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

    const timer = Date.now() * 0.0003;
    if (this.params.autoRotate) {
      this.camera!.position.set(
        Math.sin(timer) * 0.5,
        0.2135,
        Math.cos(timer) * 0.5,
      );
      this.camera?.lookAt(0, 0.0635, 0);
    } else {
      this.controls?.update();
    }

    if (this.params.enableSSR) {
      this.composer?.render();
    } else {
      this.renderer?.render( this.scene, this.camera!);
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

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera?.updateProjectionMatrix();

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
      this.groundReflector!.getRenderTarget().setSize(this.width, this.height);
      // @ts-ignore
			this.groundReflector?.resolution?.set(this.width, this.height);
    };
  }
}

export default THREE;

