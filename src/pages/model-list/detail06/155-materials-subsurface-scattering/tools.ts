import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { SubsurfaceScatteringShader } from 'three/examples/jsm/shaders/SubsurfaceScatteringShader';
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
  private gui: GUI
  private model: THREE.Mesh
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
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.model = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 5000);
    this.camera.position.set(0.0, 300, 400 * 4);

    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 500;
    this.controls.maxDistance = 3000;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateMaterial() {
    const loader = new THREE.TextureLoader();
    const imgTexture = loader.load("/examples/models/fbx/white.jpg");
    const thicknessTexture = loader.load("/examples/models/fbx/bunny_thickness.jpg");

    imgTexture.wrapS = THREE.RepeatWrapping;
    imgTexture.wrapT = THREE.RepeatWrapping;

    const shader = SubsurfaceScatteringShader;
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['map'].value = imgTexture;
    uniforms['diffuse'].value = new THREE.Vector3(1.0, 0.2, 0.2);
    uniforms['shininess'].value = 500;
    uniforms['thicknessMap'].value = thicknessTexture;
    uniforms['thicknessColor'].value = new THREE.Vector3(0.5, 0.3, 0.0);
    uniforms['thicknessDistortion'].value = 0.1;
    uniforms['thicknessAmbient'].value = 0.4;
    uniforms['thicknessAttenuation'].value = 0.8;
    uniforms['thicknessPower'].value = 2.0;
    uniforms['thicknessScale'].value = 16.0;

    const { vertexShader, fragmentShader } = shader;
    const material = new THREE.ShaderMaterial({
      uniforms,
      // 顶点着色器的GLSL代码。这是shader程序的实际代码
      vertexShader,
      // 片元着色器的GLSL代码。这是shader程序的实际代码
      fragmentShader,
      // 材质是否受到光照的影响。默认值为 false。
      // 如果传递与光照相关的uniform数据到这个材质，则为true。默认是false
      lights: true,
    });
    // 衍生品
    material.extensions.derivatives = true;
    return { material,  uniforms};
  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0x888888);
    this.scene.add(ambient);

    {
      const light = new THREE.DirectionalLight(0xffffff, 0.03);
      light.position.set(0.0, 0.5, 0.5).normalize();
      this.scene.add(light);
    }

    {
      const geometry = new THREE.SphereGeometry(4, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const light = new THREE.Mesh(geometry, material);
      light.position.set(0, -50, 350);
      light.add(new THREE.PointLight(0x888888, 7.0, 300));
      this.scene.add(light);
    }

    {
      const geometry = new THREE.SphereGeometry(4, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x888800 });
      const light = new THREE.Mesh(geometry, material);
      light.position.set(-100, 20, -260);
      light.add(new THREE.PointLight(0x888800, 1.0, 500));
      this.scene.add(light);
    }

  }

  private setUpGUI(uniforms: any) {
    const params = {
      distortion: uniforms['thicknessDistortion'].value,
      ambient: uniforms['thicknessAmbient'].value,
      attenuation: uniforms['thicknessAttenuation'].value,
      power: uniforms['thicknessPower'].value,
      scale: uniforms['thicknessScale'].value,
    };

    this.gui.add(params, "distortion", 0.01, 1, 0.01).onChange(() => {
      uniforms["thicknessDistortion"].value = params.distortion;
    });

    this.gui.add(params, "ambient", 0.01, 5.0, 0.01).onChange(() => {
      uniforms["thicknessAmbient"].value = params.ambient;
    });

    this.gui.add(params, "attenuation", 0.01, 5.0, 0.01).onChange(() => {
      uniforms["thicknessAttenuation"].value = params.attenuation;
    });

    this.gui.add(params, "power", 0.01, 16.0, 0.01).onChange(() => {
      uniforms["thicknessPower"].value = params.power;
    });

    this.gui.add(params, "scale", 0.01, 50.0, 0.01).onChange(() => {
      uniforms["thicknessScale"].value = params.scale;
    });
  }

  private loadModel() {
    const loader = new FBXLoader();
    const url = "/examples/models/fbx/stanford-bunny.fbx";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (object) => {
      toast.close();
      const { material, uniforms } = this.generateMaterial();

      const mesh = object.children[0] as THREE.Mesh;
      mesh.position.set(0, 0, 10);
      mesh.scale.setScalar(0.75);
      mesh.material = material;
      this.model = mesh;
      this.scene.add(this.model);
      this.setUpGUI(uniforms);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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

    // 控制旋转
    this.model.rotation.y = performance.now() / 5000;
    
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

