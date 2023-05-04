import * as THREE from 'three';
import { OBB } from 'three/examples/jsm/math/OBB';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  private clock: THREE.Clock
  private raycaster: THREE.Raycaster
  private hitbox: THREE.Mesh
  private objects: THREE.Mesh[]
  private mouse: THREE.Vector2
  private size: THREE.Vector3
  private geometry: THREE.BoxGeometry
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
    this.raycaster = new THREE.Raycaster();
    this.hitbox = new THREE.Mesh();
    this.objects = [];
    this.mouse = new THREE.Vector2();
    this.size = new THREE.Vector3(10, 5, 6);
    this.geometry = new THREE.BoxGeometry(this.size.x, this.size.y, this.size.z);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 75);

    this.generateBox();
    this.generateLight();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;

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

  // 核心逻辑
  private generateBox() {
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000, 
      wireframe: true
    });
    this.hitbox = new THREE.Mesh(this.geometry, material);

    const obb = new OBB();
    obb.halfSize.copy(this.size).multiplyScalar(0.5);
    this.geometry.userData.obb = obb;

    for (let i = 0; i < 100; i++) {
      const lambertMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      const object = new THREE.Mesh(this.geometry,  lambertMaterial);
      object.matrixAutoUpdate = false;

      object.position.x = Math.random() * 80 - 40;
      object.position.y = Math.random() * 80 - 40;
      object.position.z = Math.random() * 80 - 40;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      object.userData.obb = new OBB();
      this.objects.push(object);
      this.scene.add(object);
    }
  }

  private generateLight() {
    const light = new THREE.HemisphereLight(0xffffff, 0x222222, 1.5);
    light.position.set(1, 1, 1);
    this.scene.add(light);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private bind() {
    document.onclick = (e) => {
      e.preventDefault();
      this.clickHandle(e);
    };
  }

  // 核心逻辑
  private clickHandle(e: MouseEvent) {
    const point = new THREE.Vector3();
    const intersections: { distance: number, object: THREE.Mesh }[] = [];

    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY - 45) / this.height) * 2 + 1;

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera as THREE.PerspectiveCamera);

    const ray = this.raycaster.ray;
    this.objects.forEach((object) => {
      const obb: OBB = object.userData.obb;

      if (obb.intersectRay(ray, point)) {
        intersections.push({ 
          object: object,
          distance: ray.origin.distanceTo(point), 
        });
      }
    });

    if (intersections.length > 0) {
      intersections.sort((a, b) => {
        return a.distance - b.distance;
      });
      // 先清除
      const parent = this.hitbox.parent;
      parent && parent.remove(this.hitbox);
      // 后加入
      intersections[0].object.add(this.hitbox);
    } else {
      // 执行清除
      const parent = this.hitbox.parent;
      parent && parent.remove(this.hitbox);
    }
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

  // 核心逻辑
  private render() {
    const delta = this.clock.getDelta();

    this.objects.forEach((object) => {
      object.rotation.x += delta * Math.PI * 0.20;
      object.rotation.y += delta * Math.PI * 0.1;

      object.updateMatrix();
      object.updateMatrixWorld();

      object.userData.obb.copy(object.geometry.userData.obb);
      object.userData.obb.applyMatrix4(object.matrixWorld);

      (object.material as THREE.MeshLambertMaterial).color.setHex(0x00ff00);
    });

    this.objects.forEach((object, i) => {
      const obb = object.userData.obb;

      for (let j = i + 1; j < this.objects.length; j++) {
        const objectToTest = this.objects[j];
        const obbToTest = objectToTest.userData.obb;

        if (obb.intersectsOBB(obbToTest)) {
          (object.material as THREE.MeshLambertMaterial).color.setHex(0xff0000);
          (objectToTest.material as THREE.MeshLambertMaterial).color.setHex(0xff0000);
        }
      }
    });
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

