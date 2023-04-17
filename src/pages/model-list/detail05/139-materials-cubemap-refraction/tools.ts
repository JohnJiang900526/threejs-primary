import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private pointLight: THREE.PointLight
  private mouse: THREE.Vector2
  private half: THREE.Vector2
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.pointLight = new THREE.PointLight();
    this.mouse = new THREE.Vector2(0, 0);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = this.generateTexture();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 100000);
    this.camera.position.z = -4000;

    this.generateLight();
    // 加载模型
    this.loadModel();
    // 渲染器
    this.createRenderer();

    this.bind();
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
    const sphere = new THREE.SphereGeometry(100, 16, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(sphere, material);
    mesh.scale.set(0.1, 0.1, 0.1);

    const light = new THREE.AmbientLight(0xffffff);

    this.pointLight = new THREE.PointLight(0xffffff, 2);
    this.pointLight.add(mesh);
    this.scene.add(this.pointLight, light);
  }

  private generateTexture() {
    const r = '/examples/textures/cube/Park3Med/';
    const urls = [
      r + 'px.jpg', r + 'nx.jpg',
      r + 'py.jpg', r + 'ny.jpg',
      r + 'pz.jpg', r + 'nz.jpg'
    ];

    const texture = (new THREE.CubeTextureLoader()).load(urls);
    texture.mapping = THREE.CubeRefractionMapping;
    return texture;
  }

  private createScene(geometry: THREE.BufferGeometry, m1: THREE.MeshPhongMaterial, m2: THREE.MeshPhongMaterial, m3: THREE.MeshPhongMaterial) {
    geometry.computeVertexNormals();

    const s = 0.65;
    const mesh1 = new THREE.Mesh(geometry, m1);
    mesh1.scale.set(s, s, s);

    const mesh2 = new THREE.Mesh(geometry, m2);
    mesh2.position.y = -1000;
    mesh2.scale.set(s, s, s);

    const mesh3 = new THREE.Mesh(geometry, m3);
    mesh3.position.y = 1000;
    mesh3.scale.set(s, s, s);

    this.scene.add(mesh1, mesh2, mesh3);
  }

  private loadModel() {
    const envMap = this.scene.background as THREE.CubeTexture;

    const m1 = new THREE.MeshPhongMaterial({
      color: 0xffffff, 
      envMap,
      refractionRatio: 0.98 
    });
    const m2 = new THREE.MeshPhongMaterial({
      color: 0xccfffd, 
      envMap,
      refractionRatio: 0.985 
    });
    const m3 = new THREE.MeshPhongMaterial({
      color: 0xccddff, 
      envMap,
      refractionRatio: 0.98, reflectivity: 0.9 
    });


    const loader = new PLYLoader();
    const url = "/examples/models/ply/binary/Lucy100k.ply";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (geometry) => {
      toast.close();
      this.createScene(geometry, m1, m2, m3);
    }, undefined, () => { toast.close(); });
  }

  private bind() {
    if (this.isMobile()) {
      window.onmousemove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = (e.clientX - this.half.x) * 4;
				const y = (e.clientY - 45 - this.half.y) * 4;

        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onmousemove = (e) => {
        const x = (e.clientX - this.half.x) * 4;
        const y = (e.clientY - 45 - this.half.y) * 4;
        this.mouse.set(x, y);
      };
    }
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
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      const timer = -0.0002 * Date.now();
      const { x, y } = this.mouse;

      this.camera.position.x += (x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      this.pointLight.position.set(
        1000 * Math.cos(timer),
        this.pointLight.position.y,
        1000 * Math.cos(timer),
      );
    }

    this.stats?.update();

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
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
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

