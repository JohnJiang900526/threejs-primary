import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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
  private group: THREE.Group
  private selectedObject: null | THREE.Sprite
  private readonly raycaster: THREE.Raycaster
  private readonly pointer: THREE.Vector2
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
    this.group = new THREE.Group();
    this.selectedObject = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.set(15, 15, 15);
    this.camera.lookAt(this.scene.position);

    this.createSprites();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 15;
    this.controls.maxDistance = 250;
    this.controls.update();

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

  private bind() {
    window.onclick = (e) => {
      const x = e.clientX/this.width * 2 - 1;
      const y = -(e.clientY - 45)/this.height * 2 + 1;

      this.moveHandle(x, y);
    };
    
    if (this.isMobile()) {
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = e.clientX/this.width * 2 - 1;
        const y = -(e.clientY - 45)/this.height * 2 + 1;

        this.moveHandle(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onclick = null;
      window.onpointermove = (e) => {
        const x = e.clientX/this.width * 2 - 1;
        const y = -(e.clientY - 45)/this.height * 2 + 1;

        this.moveHandle(x, y);
      }
    }
  }

  private moveHandle(x: number, y: number) {
    this.pointer.set(x, y);

    if (this.selectedObject) {
      this.selectedObject.material.color.set('#69f');
      this.selectedObject = null;
    }

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObject(this.group, true);

    if (intersects.length > 0) {
      const intersect = intersects.filter((item) => {
        return item && item.object;
      })[0];

      if (intersect && intersect.object ) {
        this.selectedObject = intersect.object as THREE.Sprite;
        this.selectedObject.material.color.set('#f00');
      }
    }
  }

  private createSprites() {
    const sprite1 = new THREE.Sprite(new THREE.SpriteMaterial({ 
      color: '#69f',
    }));
    sprite1.position.set(6, 5, 5);
    sprite1.scale.set(2, 5, 1);
    
    const sprite2 = new THREE.Sprite(new THREE.SpriteMaterial({ 
      color: '#69f', 
      sizeAttenuation: false,
    }));
    sprite2.material.rotation = Math.PI / 3 * 4;
    sprite2.position.set(8, - 2, 2);
    sprite2.center.set(0.5, 0);
    sprite2.scale.set(.1, .5, .1);

    this.group.add(sprite1, sprite2);

    const group2 = new THREE.Object3D();
    group2.scale.set(1, 2, 1);
    group2.position.set(-5, 0, 0);
    group2.rotation.set(Math.PI / 2, 0, 0);
    this.group.add(group2);

    const sprite3 = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#69f' }));
    sprite3.position.set(0, 2, 5);
    sprite3.scale.set(10, 2, 3);
    sprite3.center.set(-0.1, 0);
    sprite3.material.rotation = Math.PI / 3;
    group2.add(sprite3);
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

      this.bind();
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

