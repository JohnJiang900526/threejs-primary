import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
  private light: THREE.DirectionalLight
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
    this.stats = null;

    this.controls = null;
    this.light = new THREE.DirectionalLight();
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
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdfe5ff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 10000);
    this.camera.position.set(700, 200, -500);

    this.generateLight();
    this.generateSkyModel();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxPolarAngle = 0.9 * Math.PI / 2;
    this.controls.enableZoom = false;

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
    this.light = new THREE.DirectionalLight(0xaabbff, 0.3);
    this.light.position.set(300, 250, -500);
    this.scene.add(this.light);
  }
  private generateSkyModel() {
    const uniforms = {
      topColor: { 
        value: new THREE.Color(0x0077ff) 
      },
      bottomColor: { 
        value: new THREE.Color(0xffffff)
      },
      offset: {
        value: 400 
      },
      exponent: { 
        value: 0.6
      },
    };
    uniforms.topColor.value.copy(this.light.color);

    const geometry = new THREE.SphereGeometry(4000, 32, 15);
    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      side: THREE.BackSide,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    const sky = new THREE.Mesh(geometry, material);
    this.scene.add(sky);
  }
  private async loadModel() {
    const loader = new THREE.ObjectLoader();
    const url = "/examples/models/json/lightmap/lightmap.json";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const obj = await loader.loadAsync(url);

    toast.close();
    this.scene.add(obj);
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

