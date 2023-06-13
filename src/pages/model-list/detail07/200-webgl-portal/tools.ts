import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as CameraUtils from 'three/examples/jsm/utils/CameraUtils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls
  private smallSphereOne: THREE.Mesh
  private smallSphereTwo: THREE.Mesh
  private portalCamera: THREE.PerspectiveCamera
  private leftPortal: THREE.Mesh
  private rightPortal: THREE.Mesh
  private leftPortalTexture: THREE.WebGLRenderTarget
  private reflectedPosition: THREE.Vector3
  private rightPortalTexture: THREE.WebGLRenderTarget
  private bottomLeftCorner: THREE.Vector3
  private bottomRightCorner: THREE.Vector3
  private topLeftCorner: THREE.Vector3
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.controls = null;
    this.smallSphereOne = new THREE.Mesh();
    this.smallSphereTwo = new THREE.Mesh();
    this.portalCamera = new THREE.PerspectiveCamera();
    this.leftPortal = new THREE.Mesh();
    this.rightPortal = new THREE.Mesh();
    this.leftPortalTexture = new THREE.WebGLRenderTarget();
    this.reflectedPosition = new THREE.Vector3();
    this.rightPortalTexture = new THREE.WebGLRenderTarget();
    this.bottomLeftCorner = new THREE.Vector3();
    this.bottomRightCorner = new THREE.Vector3();
    this.topLeftCorner = new THREE.Vector3();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 5000);
    this.camera.position.set(0, 75, 160);

    // 光线
    this.generateLight();
    // 模型
    this.generateSphere();
    // 渲染器
    this.createRenderer();
    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 40, 0);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 400;
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

  // 球 核心
  private generateSphere() {
    const planeGeo = new THREE.PlaneGeometry( 100.1, 100.1 );

    // Sphere
    {
      const portalPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.0);
      const geometry = new THREE.IcosahedronGeometry(5, 0);
      const material = new THREE.MeshPhongMaterial({
        color: 0xffffff, 
        emissive: 0x333333, 
        flatShading: true,
        clippingPlanes: [portalPlane], 
        clipShadows: true 
      });
      this.smallSphereOne = new THREE.Mesh(geometry, material);
      this.smallSphereTwo = new THREE.Mesh(geometry, material);
      this.scene.add(this.smallSphereOne, this.smallSphereTwo);
    }

    // portals
    {
      this.portalCamera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 500.0);
      this.scene.add(this.portalCamera);

      this.bottomLeftCorner = new THREE.Vector3();
      this.bottomRightCorner = new THREE.Vector3();
      this.topLeftCorner = new THREE.Vector3();
      this.reflectedPosition = new THREE.Vector3();
    }

    // Portal
    {
      this.leftPortalTexture = new THREE.WebGLRenderTarget(256, 256);
      this.leftPortal = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ 
        map: this.leftPortalTexture.texture 
      }));
      this.leftPortal.position.x = - 30;
      this.leftPortal.position.y = 20;
      this.leftPortal.scale.set(0.35, 0.35, 0.35);
      this.scene.add(this.leftPortal);

      this.rightPortalTexture = new THREE.WebGLRenderTarget(256, 256);
      this.rightPortal = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ 
        map: this.rightPortalTexture.texture 
      }));
      this.rightPortal.position.x = 30;
      this.rightPortal.position.y = 20;
      this.rightPortal.scale.set(0.35, 0.35, 0.35);
      this.scene.add(this.rightPortal);
    }

    // walls
    {
      const planeTop = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      planeTop.position.y = 100;
      planeTop.rotateX(Math.PI / 2);

      const planeBottom = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }));
      planeBottom.rotateX(-Math.PI / 2);

      const planeFront = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x7f7fff }));
      planeFront.position.z = 50;
      planeFront.position.y = 50;
      planeFront.rotateY(Math.PI);

      const planeBack = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xff7fff }));
      planeBack.position.z = -50;
      planeBack.position.y = 50;

      const planeRight = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x00ff00 }));
      planeRight.position.x = 50;
      planeRight.position.y = 50;
      planeRight.rotateY(-Math.PI / 2);

      const planeLeft = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
      planeLeft.position.x = -50;
      planeLeft.position.y = 50;
      planeLeft.rotateY(Math.PI / 2);

      this.scene.add(planeTop, planeBottom, planeFront, planeBack, planeRight, planeLeft);
    }
  }

  // 光线
  private generateLight() {
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
    mainLight.position.y = 60;

    const greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
    greenLight.position.set(550, 50, 0);

    const redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
    redLight.position.set(-550, 50, 0);

    const blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
    blueLight.position.set(0, 50, 550);

    this.scene.add(mainLight, greenLight, redLight, blueLight);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // 定义渲染器是否考虑对象级剪切平面。 默认为false.
    this.renderer.localClippingEnabled = true;
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

  // 核心算法
  private renderPortal(thisPortalMesh: THREE.Mesh, otherPortalMesh: THREE.Mesh, thisPortalTexture: THREE.WebGLRenderTarget) {
    // .copy ( v : Vector3 ) : this
    // 将所传入Vector3的x、y和z属性复制给这一Vector3
    thisPortalMesh.worldToLocal(this.reflectedPosition.copy(this.camera.position));
    this.reflectedPosition.x *= -1.0; 
    this.reflectedPosition.z *= -1.0;
    // .localToWorld ( vector : Vector3 ) : Vector3
    // vector - 一个表示在该物体局部空间中位置的向量
    otherPortalMesh.localToWorld(this.reflectedPosition);
    this.portalCamera.position.copy(this.reflectedPosition);

    otherPortalMesh.localToWorld(this.bottomLeftCorner.set(50.05, -50.05, 0.0));
    otherPortalMesh.localToWorld(this.bottomRightCorner.set(-50.05, -50.05, 0.0));
    otherPortalMesh.localToWorld(this.topLeftCorner.set(50.05, 50.05, 0.0 ));
    CameraUtils.frameCorners(
      this.portalCamera, 
      this.bottomLeftCorner, 
      this.bottomRightCorner, 
      this.topLeftCorner,
    );

    if (this.renderer) {
      thisPortalTexture.texture.encoding = this.renderer.outputEncoding;
      this.renderer.setRenderTarget(thisPortalTexture);
      this.renderer.state.buffers.depth.setMask(true);
      if (this.renderer.autoClear === false) {
        this.renderer.clear();
      }
      thisPortalMesh.visible = false;
      this.renderer.render(this.scene, this.portalCamera);
      thisPortalMesh.visible = true;
    }
  }

  // 核心算法
  private render() {
    const timerOne = Date.now() * 0.01;
    const timerTwo = timerOne + Math.PI * 10.0;

    {
      // smallSphereOne
      this.smallSphereOne.position.set(
        Math.cos(timerOne * 0.1) * 30,
        Math.abs(Math.cos(timerOne * 0.2)) * 20 + 5,
        Math.sin(timerOne * 0.1) * 30
      );
      this.smallSphereOne.rotation.y = (Math.PI / 2) - timerOne * 0.1;
      this.smallSphereOne.rotation.z = timerOne * 0.8;
    }

    {
      // smallSphereTwo
      this.smallSphereTwo.position.set(
        Math.cos(timerTwo * 0.1) * 30,
        Math.abs(Math.cos(timerTwo * 0.2)) * 20 + 5,
        Math.sin(timerTwo * 0.1) * 30
      );
      this.smallSphereTwo.rotation.y = (Math.PI / 2) - timerTwo * 0.1;
      this.smallSphereTwo.rotation.z = timerTwo * 0.8;
    }

    if (this.renderer) {
      const currentRenderTarget = this.renderer.getRenderTarget();
      const currentXrEnabled = this.renderer.xr.enabled;
      const currentShadowAutoUpdate = this.renderer.shadowMap.autoUpdate;

      this.renderer.xr.enabled = false;
      this.renderer.shadowMap.autoUpdate = false;

      this.renderPortal(this.leftPortal, this.rightPortal, this.leftPortalTexture);
      this.renderPortal(this.rightPortal, this.leftPortal, this.rightPortalTexture);

      this.renderer.xr.enabled = currentXrEnabled;
      this.renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
      this.renderer.setRenderTarget(currentRenderTarget);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();
    this.stats?.update();
    this.controls?.update();
    
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

