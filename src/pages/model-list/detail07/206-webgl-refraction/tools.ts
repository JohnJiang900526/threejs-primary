import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Refractor } from 'three/examples/jsm/objects/Refractor';
import { WaterRefractionShader } from 'three/examples/jsm/shaders/WaterRefractionShader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private clock: THREE.Clock;
  private refractor: null | Refractor;
  private smallSphere: THREE.Mesh;
  constructor(container: HTMLDivElement, getRPG?: (r: number, b: number, g: number) => void) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.controls = null;
    this.clock = new THREE.Clock();
    this.refractor = null;
    this.smallSphere = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 500);
    this.camera.position.set(0, 75, 260);

    // 渲染器
    this.createRenderer();
    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement );
    this.controls.target.set(0, 40, 0);
    this.controls.maxDistance = 400;
    this.controls.minDistance = 10;
    this.controls.update();

    this.generateLight();
    this.createRefractor();
    this.loadDudvMap();
    this.createSphereAndWalls();

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateLight() {
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
    mainLight.position.y = 60;
    this.scene.add(mainLight);

    const greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
    greenLight.position.set(550, 50, 0);
    this.scene.add(greenLight);

    const redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
    redLight.position.set(-550, 50, 0);
    this.scene.add(redLight);

    const blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
    blueLight.position.set(0, 50, 550);
    this.scene.add(blueLight);
  }

  private createSphereAndWalls() {
    {
      const geometry = new THREE.IcosahedronGeometry(5, 0);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0x333333, 
        flatShading: true,
      });
      this.smallSphere = new THREE.Mesh(geometry, material);
      this.scene.add(this.smallSphere);
    }

    const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);
    {
      const planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      planeTop.position.y = 100;
      planeTop.rotateX(Math.PI / 2);
      this.scene.add(planeTop);

      const planeBottom = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      planeBottom.rotateX(-Math.PI / 2);
      this.scene.add(planeBottom);

      const planeBack = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial({ color: 0x7f7fff }));
      planeBack.position.z = -50;
      planeBack.position.y = 50;
      this.scene.add(planeBack);

      const planeRight = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
      planeRight.position.x = 50;
      planeRight.position.y = 50;
      planeRight.rotateY(-Math.PI / 2);
      this.scene.add(planeRight);

      const planeLeft = new THREE.Mesh( planeGeo, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
      planeLeft.position.x = -50;
      planeLeft.position.y = 50;
      planeLeft.rotateY(Math.PI / 2);
      this.scene.add(planeLeft);
    }
  }

  private loadDudvMap() {
    const url = "/examples/textures/waterdudv.jpg";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const dudvMap = new THREE.TextureLoader().load(url, () => {
      toast.close();
      this.animate();
    }, undefined, () => { toast.close(); });

    dudvMap.wrapS = THREE.RepeatWrapping;
    dudvMap.wrapT = THREE.RepeatWrapping;
    if (this.refractor) {
      const material = this.refractor.material as THREE.ShaderMaterial;
      material.uniforms.tDudv.value = dudvMap;
      this.refractor.material = material;
    }
  }

  // Refractor
  private createRefractor() {
    const refractorGeometry = new THREE.PlaneGeometry(90, 90);

    this.refractor = new Refractor(refractorGeometry, {
      color: 0x999999,
      textureWidth: 1024,
      textureHeight: 1024,
      shader: WaterRefractionShader
    });
    this.refractor.position.set(0, 50, 0);
    this.scene.add(this.refractor);
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

    // 动画
    const time = this.clock.getElapsedTime();
    if(this.refractor) {
      (this.refractor.material as THREE.ShaderMaterial).uniforms.time.value = time;

      const x = Math.cos(time) * 30;
      const y = Math.abs(Math.cos(time * 2)) * 20 + 5;
      const z = Math.sin(time) * 30;

      this.smallSphere.position.set(x, y, z);
      this.smallSphere.rotation.y = (Math.PI / 2) - time;
      this.smallSphere.rotation.z = time * 8;
    }

    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
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
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

