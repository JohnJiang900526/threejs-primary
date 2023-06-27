import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ShadowMapViewer } from 'three/examples/jsm/utils/ShadowMapViewer';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private clock: THREE.Clock;
  private dirLight: THREE.DirectionalLight;
  private spotLight: THREE.SpotLight;
  private torusKnot: THREE.Mesh;
  private cube: THREE.Mesh;
  private dirLightShadowMapViewer: null | ShadowMapViewer;
  private spotLightShadowMapViewer: null | ShadowMapViewer;
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
    this.clock = new THREE.Clock();
    this.dirLight = new THREE.DirectionalLight();
    this.spotLight = new THREE.SpotLight();
    this.torusKnot = new THREE.Mesh();
    this.cube = new THREE.Mesh();
    this.dirLightShadowMapViewer = null;
    this.spotLightShadowMapViewer = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 1000);
    this.camera.position.set(0, 30, 100);

    // light
    this.generateLight();
    // mesh
    this.createMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 2, 0);
    this.controls.update();

    this.initShadowMapViewers();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initShadowMapViewers() {
    this.dirLightShadowMapViewer = new ShadowMapViewer(this.dirLight);
    this.spotLightShadowMapViewer = new ShadowMapViewer(this.spotLight);
    this.resizeShadowMapViewers();
  }

  private resizeShadowMapViewers() {
    const size = this.width * 0.15;
    const y = 100;

    if (this.dirLightShadowMapViewer) {
      this.dirLightShadowMapViewer.position.x = 30;
      this.dirLightShadowMapViewer.position.y = y;
      this.dirLightShadowMapViewer.size.set(size, size);
      //Required when setting position or size directly
      this.dirLightShadowMapViewer.update();
    }

    if (this.spotLightShadowMapViewer) {
      this.spotLightShadowMapViewer.size.set(size, size);
      // spotLightShadowMapViewer.update();	
      // NOT required because .set updates automatically
      this.spotLightShadowMapViewer.position.set(size + 100, y);
    }
  }

  private createMesh() {
    let geometry = new THREE.TorusKnotGeometry(25, 8, 75, 20);
    let material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      shininess: 150,
      specular: 0x222222
    });

    {
      // torusKnot
      const geometry = new THREE.TorusKnotGeometry(25, 8, 75, 20);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 150,
        specular: 0x222222
      });

      this.torusKnot = new THREE.Mesh(geometry, material);
      this.torusKnot.scale.multiplyScalar(1 / 18);
      this.torusKnot.position.y = 3;
      this.torusKnot.castShadow = true;
      this.torusKnot.receiveShadow = true;
      this.scene.add(this.torusKnot);
    }

    {
      // cube
      const geometry = new THREE.BoxGeometry(3, 3, 3);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        shininess: 150,
        specular: 0x222222
      });
      this.cube = new THREE.Mesh( geometry, material );
      this.cube.position.set( 8, 3, 8 );
      this.cube.castShadow = true;
      this.cube.receiveShadow = true;
      this.scene.add(this.cube);
    }

    {
      // ground
      const geometry = new THREE.BoxGeometry(10, 0.15, 10);
      const material = new THREE.MeshPhongMaterial({
        color: 0xa0adaf,
        shininess: 150,
        specular: 0x111111
      });

      const ground = new THREE.Mesh(geometry, material);
      ground.scale.multiplyScalar(3);
      ground.castShadow = false;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }
  }

  private generateLight() {
    {
      const ambient = new THREE.AmbientLight(0x404040);
      this.scene.add(ambient);
    }

    {
      this.spotLight = new THREE.SpotLight(0xffffff);
      this.spotLight.name = 'Spot Light';
      this.spotLight.angle = Math.PI / 5;
      this.spotLight.penumbra = 0.3;
      this.spotLight.position.set( 10, 10, 5 );
      this.spotLight.castShadow = true;
      this.spotLight.shadow.camera.near = 8;
      this.spotLight.shadow.camera.far = 30;
      this.spotLight.shadow.mapSize.width = 1024;
      this.spotLight.shadow.mapSize.height = 1024;
      this.scene.add(this.spotLight);
      this.scene.add(new THREE.CameraHelper(this.spotLight.shadow.camera));
    }

    {
      this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
      this.dirLight.name = 'Dir. Light';
      this.dirLight.position.set(0, 10, 0);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.camera.near = 1;
      this.dirLight.shadow.camera.far = 10;
      this.dirLight.shadow.camera.right = 15;
      this.dirLight.shadow.camera.left = -15;
      this.dirLight.shadow.camera.top	= 15;
      this.dirLight.shadow.camera.bottom = -15;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.scene.add(this.dirLight);
      this.scene.add(new THREE.CameraHelper(this.dirLight.shadow.camera));
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.BasicShadowMap;
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
    const delta = this.clock.getDelta();

    this.torusKnot.rotation.x += 0.25 * delta;
    this.torusKnot.rotation.y += 2 * delta;
    this.torusKnot.rotation.z += 1 * delta;

    this.cube.rotation.x += 0.25 * delta;
    this.cube.rotation.y += 2 * delta;
    this.cube.rotation.z += 1 * delta;

    if (this.renderer) {
      this.dirLightShadowMapViewer?.render(this.renderer);
      this.spotLightShadowMapViewer?.render(this.renderer);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.render();
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

      this.resizeShadowMapViewers();
      this.dirLightShadowMapViewer?.updateForWindowResize();
      this.spotLightShadowMapViewer?.updateForWindowResize();
    };
  }
}

export default THREE;

