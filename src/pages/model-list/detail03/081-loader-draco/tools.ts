import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
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
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x443333);
    this.scene.fog = new THREE.Fog(0x443333, 1, 4);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.1, 15);
    this.camera.position.set(3, 0.25, 3);
    this.camera.lookAt(0, 0, 0);

    this.loadModel();
    this.createLight();
    this.createFloor();

    // 渲染器
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

  private createFloor() {
    const geometry = new THREE.PlaneGeometry(8, 8);
    const material = new THREE.MeshPhongMaterial({ color: 0x999999, specular: 0x101010 });
    const plane = new THREE.Mesh(geometry, material);

    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.03;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  // 创建光源
  private createLight() {
    const hemisphere = new THREE.HemisphereLight(0x443333, 0x111122);
		this.scene.add(hemisphere);

    const spotLight = new THREE.SpotLight();
    spotLight.angle = Math.PI / 16;
    // penumbra - 聚光锥的半影衰减百分比。在0和1之间的值。默认为0
    spotLight.penumbra = 0.5;
    // 此属性设置为 true 聚光灯将投射阴影
    spotLight.castShadow = true;
    spotLight.position.set(-1, 1, 1);
    this.scene.add(spotLight);
  }

  // 加载模型
  private loadModel() {
    const loader = new DRACOLoader();
		loader.setDecoderPath('/examples/js/libs/draco/');
		loader.setDecoderConfig({ type: 'js' });

    const url = "/examples/models/draco/bunny.drc";
    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (geometry) => {
      toast.close();
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
      // 通过面片法向量的平均值计算每个顶点的法向量
      const mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }, undefined, () => {
      toast.close();
    });
  }


  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
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

    if (this.camera) {
      const timer = Date.now() * 0.0003;

			this.camera.position.x = Math.sin(timer) * 0.5;
			this.camera.position.z = Math.cos(timer) * 0.5;
			this.camera.lookAt(0, 0.1, 0);
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 执行渲染
    if (this.camera && this.renderer) {
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

