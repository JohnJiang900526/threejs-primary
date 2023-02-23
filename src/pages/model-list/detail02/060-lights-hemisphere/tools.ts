import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private mixers: THREE.AnimationMixer[];
  private clock: THREE.Clock;
  private stats: null | Stats;
  private hemiLight: null | THREE.HemisphereLight
  private hemiLightHelper: null | THREE.HemisphereLightHelper
  private dirLight: null | THREE.DirectionalLight
  private dirLightHelper: null | THREE.DirectionalLightHelper
  private vertexShader: string
  private fragmentShader: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.mixers = [];
    this.clock = new THREE.Clock();
    this.stats = null;
    this.hemiLight = null;
    this.hemiLightHelper = null;
    this.dirLight = null;
    this.dirLightHelper = null;
    this.vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;
    this.fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;

      varying vec3 vWorldPosition;
      void main() {
        float h = normalize( vWorldPosition + offset ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
      }
    `;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    this.scene.fog = new THREE.Fog(this.scene.background, 1, 5000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 5000);
    this.camera.position.set(0, 0, 250);

    // 创建光线
    this.createLight();
    // 地面
    this.createGround();
    // 天空
    this.createSky();
    // 加载模型
    this.loadModel();

    // 创建渲染器
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

  allLightToggle() {
    this.hemisphereToggle();  
    this.directionalToggle();  
  }

  hemisphereToggle() {
    if (this.hemiLight && this.hemiLightHelper) {
      this.hemiLight.visible = !this.hemiLight.visible;
      this.hemiLightHelper.visible = !this.hemiLightHelper.visible;
    }
  }
  directionalToggle() {
    if (this.dirLight && this.dirLightHelper) {
      this.dirLight.visible = !this.dirLight.visible;
      this.dirLightHelper.visible = !this.dirLightHelper.visible;
    }
  }

  // 创建光线
  private createLight() {
    // 创建半球光
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    this.hemiLight.color.setHSL(0.6, 1, 0.6);
    this.hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.hemiLightHelper = new THREE.HemisphereLightHelper(this.hemiLight, 10);
    this.scene.add(this.hemiLightHelper);

    // 创建直线光
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
    this.dirLight.color.setHSL(0.1, 1, 0.95);

    this.dirLight.position.set(-1, 1.75, 1);
    this.dirLight.position.multiplyScalar(30);

    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;

    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.camera.far = 3500;
    
    this.dirLight.shadow.bias = -0.0001;
    this.scene.add(this.dirLight);

    this.dirLightHelper = new THREE.DirectionalLightHelper(this.dirLight, 10);
    this.scene.add(this.dirLightHelper);
  }

  // 创建天空
  private createSky() {
    const uniforms = {
      'topColor': { value: new THREE.Color(0x0077ff) },
      'bottomColor': { value: new THREE.Color(0xffffff) },
      'offset': { value: 33 },
      'exponent': { value: 0.6 }
    };

    uniforms['topColor'].value.copy((this.hemiLight as THREE.HemisphereLight).color);
    (this.scene.fog as THREE.Fog).color.copy(uniforms['bottomColor'].value);

    const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }

  // 创建地面
  private createGround() {
    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    const groundMat = new THREE.MeshLambertMaterial({color: 0xffffff});

    groundMat.color.setHSL(0.095, 1, 0.75);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -33;
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 加载模型
  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/Flamingo.glb";

    loader.load(url, (gltf) => {
      const mesh = gltf.scene.children[0];

      mesh.scale.set(0.35, 0.35, 0.35);
      mesh.position.y = 15;
      mesh.rotation.y = -1;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const mixer = new THREE.AnimationMixer(mesh);
      mixer.clipAction(gltf.animations[0]).setDuration(1).play();
      this.mixers.push(mixer);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
		this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
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

      const delta = this.clock.getDelta();
      this.mixers.forEach((mixer) => {
        mixer.update(delta);
      });
  
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

