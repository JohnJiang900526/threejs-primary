import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VOXLoader, VOXData3DTexture } from 'three/examples/jsm/loaders/VOXLoader';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { showFailToast, showLoadingToast } from 'vant';
import { vertexShader, fragmentShader } from "./vars";

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
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 1000);
    this.camera.position.z = 4;

    // 加载模型
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = -1.0;
    this.controls.enableDamping = true;
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

  private loadModel() {
    const loader = new VOXLoader();
    const url = "models/vox/menger.vox";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.setPath("/examples/");
    loader.load(url, (chunks) => {
      toast.close();

      chunks.forEach((chunk) => {
        const map = new VOXData3DTexture(chunk);
        const position = new THREE.Vector3();

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.RawShaderMaterial({
          uniforms: {
            map: { value: map },
            cameraPos: { value: position }
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: THREE.BackSide,
          glslVersion: THREE.GLSL3,
        });

        const mesh = new THREE.InstancedMesh(geometry, material, 50000);
        mesh.onBeforeRender = () => {
          material.uniforms.cameraPos.value.copy(this.camera!.position);
        }

        const transform = new THREE.Object3D();
        for (let i = 0; i < mesh.count; i++) {
          // .random () : this
          // 将该向量的每个分量(x、y、z)设置为介于 0 和 1 之间的伪随机数，不包括 1。
          transform.position.random().subScalar(0.5).multiplyScalar(150);

          transform.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          );
          transform.updateMatrix();
          mesh.setMatrixAt(i, transform.matrix);
        }
        this.scene.add(mesh);
      });
    }, undefined, () => {
      toast.close();
    });
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

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
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
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

