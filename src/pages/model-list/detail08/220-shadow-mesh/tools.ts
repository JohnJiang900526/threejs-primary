import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { ShadowMesh } from 'three/examples/jsm/objects/ShadowMesh';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

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
  private gui: GUI;
  private clock: THREE.Clock;
  private sunLight: THREE.DirectionalLight;
  private useDirectionalLight: boolean;
  private arrowHelper1: null | THREE.ArrowHelper;
  private arrowHelper2: null | THREE.ArrowHelper;
  private arrowHelper3: null | THREE.ArrowHelper;
  private arrowDirection: THREE.Vector3;
  private arrowPosition1: THREE.Vector3;
  private arrowPosition2: THREE.Vector3;
  private arrowPosition3: THREE.Vector3;
  private groundMesh: THREE.Mesh;
  private lightSphere: THREE.Mesh;
  private lightHolder: THREE.Mesh;
  private pyramid: THREE.Mesh;
  private pyramidShadow: null | ShadowMesh;
  private sphere: THREE.Mesh;
  private sphereShadow: null | ShadowMesh;
  private cube: THREE.Mesh;
  private cubeShadow: null | ShadowMesh;
  private cylinder: THREE.Mesh;
  private cylinderShadow: null | ShadowMesh;
  private torus: THREE.Mesh;
  private torusShadow: null | ShadowMesh;
  private normalVector: THREE.Vector3;
  private planeConstant: number;
  private groundPlane: THREE.Plane;
  private lightPosition4D: THREE.Vector4;
  private verticalAngle: number;
  private horizontalAngle: number;
  private frameTime: number;
  private TWO_PI: number;
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
      autoPlace: false,
      title: "控制面板"
    });
    this.clock = new THREE.Clock();
    this.sunLight = new THREE.DirectionalLight('rgb(255,255,255)', 1);
    this.useDirectionalLight = true;
    this.arrowHelper1 = null;
    this.arrowHelper2 = null;
    this.arrowHelper3 = null;
    this.arrowDirection = new THREE.Vector3();
    this.arrowPosition1 = new THREE.Vector3();
    this.arrowPosition2 = new THREE.Vector3();
    this.arrowPosition3 = new THREE.Vector3();
    this.groundMesh = new THREE.Mesh();
    this.lightSphere = new THREE.Mesh();
    this.lightHolder = new THREE.Mesh();
    this.pyramid = new THREE.Mesh();
    this.pyramidShadow = null;
    this.sphere = new THREE.Mesh();
    this.sphereShadow = null;
    this.cube = new THREE.Mesh();
    this.cubeShadow = null;
    this.cylinder = new THREE.Mesh();
    this.cylinderShadow = null;
    this.torus = new THREE.Mesh();
    this.torusShadow = null;
    this.normalVector = new THREE.Vector3(0, 1, 0);
    this.planeConstant = 0.01;
    this.groundPlane = new THREE.Plane(this.normalVector, this.planeConstant);
    this.lightPosition4D = new THREE.Vector4();
    this.verticalAngle = 0;
    this.horizontalAngle = 0;
    this.frameTime = 0;
    this.TWO_PI = Math.PI * 2;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0096ff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(55, this.aspect, 1, 3000);
    this.camera.position.set(0, 2.5, 20);
    this.scene.add(this.camera);

    this.createLight();
    this.createGround();
    this.createMesh();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    const obj = {
      useDirectionalLight: true
    };

    this.gui.add(obj, "useDirectionalLight").name("直线光").onChange(() => {
      this.useDirectionalLight = obj.useDirectionalLight;
      this.lightHandler();
    });
  }

  private lightHandler() {
    if (this.useDirectionalLight) {
      (this.scene.background as THREE.Color).setHex(0x0096ff);
      // @ts-ignore
      this.groundMesh.material.color.setHex(0x008200);
      this.sunLight.position.set(5, 7, -1);
      this.sunLight.lookAt(this.scene.position);

      this.lightPosition4D.x = this.sunLight.position.x;
      this.lightPosition4D.y = this.sunLight.position.y;
      this.lightPosition4D.z = this.sunLight.position.z;
      this.lightPosition4D.w = 0.001;

      if (this.arrowHelper1 && this.arrowHelper2 && this.arrowHelper3) {
        this.arrowHelper1.visible = true;
        this.arrowHelper2.visible = true;
        this.arrowHelper3.visible = true;
      }

      this.lightSphere.visible = false;
      this.lightHolder.visible = false;
    } else {
      (this.scene.background as THREE.Color).setHex(0x000000);
      // @ts-ignore
      this.groundMesh.material.color.setHex(0x969696);

      this.sunLight.position.set(0, 6, - 2);
      this.sunLight.lookAt(this.scene.position);
      this.lightSphere.position.copy(this.sunLight.position);
      this.lightHolder.position.copy(this.lightSphere.position);
      this.lightHolder.position.y += 0.12;

      this.lightPosition4D.x = this.sunLight.position.x;
      this.lightPosition4D.y = this.sunLight.position.y;
      this.lightPosition4D.z = this.sunLight.position.z;
      this.lightPosition4D.w = 0.9;

      if (this.arrowHelper1 && this.arrowHelper2 && this.arrowHelper3) {
        this.arrowHelper1.visible = false;
        this.arrowHelper2.visible = false;
        this.arrowHelper3.visible = false;
      }

      this.lightSphere.visible = true;
      this.lightHolder.visible = true;
    }
  }

  private createLight() {
    this.sunLight.position.set(5, 7, -1);
    this.sunLight.lookAt(this.scene.position);
    this.scene.add(this.sunLight );

    this.lightPosition4D.x = this.sunLight.position.x;
    this.lightPosition4D.y = this.sunLight.position.y;
    this.lightPosition4D.z = this.sunLight.position.z;
    this.lightPosition4D.w = 0.001; 

    // 黄色的箭头
    {
      this.arrowDirection.subVectors(this.scene.position, this.sunLight.position).normalize();
      this.arrowPosition1.copy(this.sunLight.position);
      this.arrowHelper1 = new THREE.ArrowHelper(this.arrowDirection, this.arrowPosition1, 0.9, 0xffff00, 0.25, 0.08);
      
      this.arrowPosition2.copy(this.sunLight.position).add(new THREE.Vector3(0, 0.2, 0));
      this.arrowHelper2 = new THREE.ArrowHelper(this.arrowDirection, this.arrowPosition2, 0.9, 0xffff00, 0.25, 0.08);

      this.arrowPosition3.copy(this.sunLight.position).add(new THREE.Vector3(0, -0.2, 0));
      this.arrowHelper3 = new THREE.ArrowHelper(this.arrowDirection, this.arrowPosition3, 0.9, 0xffff00, 0.25, 0.08);
      this.scene.add(this.arrowHelper1, this.arrowHelper2, this.arrowHelper3);
    }

    // 黑暗中的亮点
    const lightSphereGeometry = new THREE.SphereGeometry(0.09);
    const lightSphereMaterial = new THREE.MeshBasicMaterial({ color: 'rgb(255,255,255)' });
    this.lightSphere = new THREE.Mesh(lightSphereGeometry, lightSphereMaterial);
    this.lightSphere.visible = false;
    this.scene.add(this.lightSphere);

    const lightHolderGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.13);
    const lightHolderMaterial = new THREE.MeshBasicMaterial({ color: 'rgb(75,75,75)' });
    this.lightHolder = new THREE.Mesh(lightHolderGeometry, lightHolderMaterial);
    this.lightHolder.visible = false;
    this.scene.add(this.lightHolder);
  }

  private createGround() {
    const geometry = new THREE.BoxGeometry(40, 0.01, 40);
    const material = new THREE.MeshLambertMaterial({ color: 'rgb(0,130,0)' });
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.position.y = 0.0;
    this.scene.add(this.groundMesh);
  }

  // 创建核心
  private createMesh() {
    {
      // cube
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshLambertMaterial({ 
        color: 'rgb(255,0,0)', 
        emissive: 0x200000 
      });
      this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      this.cube.position.z = -1;
      this.scene.add(this.cube);

      this.cubeShadow = new ShadowMesh(this.cube);
      this.scene.add(this.cubeShadow);
    }

    {
      // 圆柱
      const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
      const cylinderMaterial = new THREE.MeshPhongMaterial({ 
        color: 'rgb(0,0,255)', 
        emissive: 0x000020 
      });
      this.cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      this.cylinder.position.z = -2.5;
      this.scene.add(this.cylinder);

      this.cylinderShadow = new ShadowMesh(this.cylinder);
      this.scene.add(this.cylinderShadow);
    }

    {
      // 圆环
      const torusGeometry = new THREE.TorusGeometry(1, 0.2, 10, 16, this.TWO_PI);
      const torusMaterial = new THREE.MeshPhongMaterial({ 
        color: 'rgb(255,0,255)', 
        emissive: 0x200020 
      });
      this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
      this.torus.position.z = -6;
      this.scene.add(this.torus);

      this.torusShadow = new ShadowMesh(this.torus);
      this.scene.add(this.torusShadow);
    }

    {
      // 球
      const sphereGeometry = new THREE.SphereGeometry(0.5, 20, 10);
      const sphereMaterial = new THREE.MeshPhongMaterial({ 
        color: 'rgb(255,255,255)', 
        emissive: 0x222222 
      });
      this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      this.sphere.position.set(4, 0.5, 2);
      this.scene.add(this.sphere);

      this.sphereShadow = new ShadowMesh(this.sphere);
      this.scene.add(this.sphereShadow);
    }

    {
      // 圆柱
      const pyramidGeometry = new THREE.CylinderGeometry(0, 0.5, 2, 4);
      const pyramidMaterial = new THREE.MeshPhongMaterial({ 
        color: 'rgb(255,255,0)', 
        emissive: 0x440000, 
        flatShading: true, 
        shininess: 0 
      });
      this.pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
      this.pyramid.position.set(-4, 1, 2);
      this.scene.add(this.pyramid);

      this.pyramidShadow = new ShadowMesh(this.pyramid);
      this.scene.add(this.pyramidShadow);
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

  // 核心控制
  private render() {
    this.frameTime = this.clock.getDelta();

    this.cube.rotation.x += 1.0 * this.frameTime;
    this.cube.rotation.y += 1.0 * this.frameTime;

    this.cylinder.rotation.y += 1.0 * this.frameTime;
    this.cylinder.rotation.z -= 1.0 * this.frameTime;

    this.torus.rotation.x -= 1.0 * this.frameTime;
    this.torus.rotation.y -= 1.0 * this.frameTime;

    this.pyramid.rotation.y += 0.5 * this.frameTime;

    this.horizontalAngle += 0.5 * this.frameTime;
    if (this.horizontalAngle > this.TWO_PI) {
      this.horizontalAngle -= this.TWO_PI;
    }
    this.cube.position.x = Math.sin(this.horizontalAngle) * 4;
    this.cylinder.position.x = Math.sin(this.horizontalAngle) * -4;
    this.torus.position.x = Math.cos(this.horizontalAngle) * 4;

    this.verticalAngle += 1.5 * this.frameTime;
    if (this.verticalAngle > this.TWO_PI) {
      this.verticalAngle -= this.TWO_PI;
    }
    this.cube.position.y = Math.sin(this.verticalAngle) * 2 + 2.9;
    this.cylinder.position.y = Math.sin(this.verticalAngle) * 2 + 3.1;
    this.torus.position.y = Math.cos(this.verticalAngle) * 2 + 3.3;

    this.cubeShadow?.update(this.groundPlane, this.lightPosition4D);
    this.cylinderShadow?.update(this.groundPlane, this.lightPosition4D);
    this.torusShadow?.update(this.groundPlane, this.lightPosition4D);
    this.sphereShadow?.update(this.groundPlane, this.lightPosition4D);
    this.pyramidShadow?.update(this.groundPlane, this.lightPosition4D);
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
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

