import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private cameraPerspective: null | THREE.PerspectiveCamera
  private cameraPerspectiveHelper: null | THREE.CameraHelper
  private cameraOrtho: null | THREE.OrthographicCamera
  private cameraOrthoHelper: null | THREE.CameraHelper
  private activeCamera: null | THREE.PerspectiveCamera | THREE.OrthographicCamera
  private activeHelper: null | THREE.CameraHelper
  private cameraRig: null | THREE.Group
  private mesh1: null | THREE.Mesh
  private mesh2: null | THREE.Mesh
  private mesh3: null | THREE.Mesh
  private stats: null | Stats
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.cameraPerspective = null;
    this.cameraPerspectiveHelper = null;
    this.cameraOrtho = null;
    this.cameraOrthoHelper = null;
    this.activeCamera = null;
    this.activeHelper = null;
    this.cameraRig = null;
    this.mesh1 = null;
    this.mesh2 = null;
    this.mesh3 = null;
    this.stats = null;
  }

  init() {
    const frustumSize = 600;
    const aspect = this.width/this.height;

    // 创建一个场景
    this.scene = new THREE.Scene();

    // 创建透视相机
    this.camera = new THREE.PerspectiveCamera(50, 0.5 * aspect, 1, 10000);
    this.camera.position.z = 2500;

    // 创建第二个透视相机
    this.cameraPerspective = new THREE.PerspectiveCamera(50, 0.5 * aspect, 150, 1000);
    this.cameraPerspectiveHelper = new THREE.CameraHelper(this.cameraPerspective);
    this.scene.add(this.cameraPerspectiveHelper);

    // 创建正交投影相机
    this.cameraOrtho = new THREE.OrthographicCamera(
      0.5 * frustumSize * aspect / - 2, 
      0.5 * frustumSize * aspect / 2, 
      frustumSize / 2, frustumSize / - 2, 
      150, 1000
    );
    this.cameraOrthoHelper = new THREE.CameraHelper(this.cameraOrtho);
    this.scene.add(this.cameraOrthoHelper);

    // 设置默认激活的相机
    this.activeCamera = this.cameraPerspective;
    this.activeHelper = this.cameraPerspectiveHelper;

    this.cameraOrtho.rotation.y = Math.PI;
    this.cameraPerspective.rotation.y = Math.PI;

    this.cameraRig = new THREE.Group();
    this.cameraRig.add(this.cameraOrtho);
    this.cameraRig.add(this.cameraPerspective);
    this.scene.add(this.cameraRig);

    this.mesh1 = new THREE.Mesh(
      new THREE.SphereGeometry(100, 16, 8),
      new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
    );
    this.scene.add(this.mesh1);

    this.mesh2 = new THREE.Mesh(
      new THREE.SphereGeometry(50, 16, 8),
      new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true})
    );
    this.mesh2.position.y = 150;
    this.mesh1.add(this.mesh2);

    this.mesh3 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 8),
      new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true})
    );
    this.mesh3.position.z = 150;
    this.cameraRig.add(this.mesh3);
    
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    for ( let i = 0; i < 10000; i ++ ) {
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
      vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    const particles = new THREE.Points( geometry, new THREE.PointsMaterial({color: 0x888888}));
    this.scene.add(particles);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.renderer.autoClear = false;

    // 性能统计信息
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);

    this.animate();
    this.resize();
  }

  private render() {
    const r = Date.now() * 0.0005;

    if (this.mesh1) {
      this.mesh1.position.x = 700 * Math.cos(r);
      this.mesh1.position.y = 700 * Math.sin(r);
      this.mesh1.position.z = 700 * Math.sin(r);

      this.mesh1.children[0].position.x = 70 * Math.cos(2 * r);
      this.mesh1.children[0].position.z = 70 * Math.sin(r);
    }

    if (this.activeCamera === this.cameraPerspective) {
      if (this.cameraPerspective && this.mesh1 && this.cameraPerspectiveHelper) {
        this.cameraPerspective.fov = 35 + 30 * Math.sin(0.5 * r);
        this.cameraPerspective.far = this.mesh1.position.length();
        this.cameraPerspective.updateProjectionMatrix();
        this.cameraPerspectiveHelper.update();
        this.cameraPerspectiveHelper.visible = true;
        if (this.cameraOrthoHelper) {
          this.cameraOrthoHelper.visible = false;
        }
      }
    } else {
      if (this.cameraOrtho && this.mesh1 && this.cameraOrthoHelper) {
        this.cameraOrtho.far = this.mesh1.position.length();
        this.cameraOrtho.updateProjectionMatrix();
        this.cameraOrthoHelper.update();
        this.cameraOrthoHelper.visible = true;
        if (this.cameraPerspectiveHelper) {
          this.cameraPerspectiveHelper.visible = false;
        }
      }
    }

    if (this.scene && this.renderer && this.activeHelper && this.cameraRig && this.mesh1) {
      this.cameraRig.lookAt(this.mesh1.position);
      this.renderer.clear();
      this.activeHelper.visible = false;

      this.renderer.setViewport(0, 0, this.width/2, this.height);
      if (this.activeCamera) {
        this.renderer.render(this.scene, this.activeCamera);
      }

      this.activeHelper.visible = true;

      this.renderer.setViewport(this.width/2, 0, this.width/2, this.height);
      if (this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
  
  // 切换激活的相机
  setActive(key: "orthographic" | "perspective") {
    switch(key) {
      case "perspective":
        this.activeCamera = this.cameraPerspective;
        this.activeHelper = this.cameraPerspectiveHelper;
        break;
      case "orthographic":
        this.activeCamera = this.cameraOrtho;
        this.activeHelper = this.cameraOrthoHelper;
        break;
      default:
        this.activeCamera = this.cameraPerspective;
        this.activeHelper = this.cameraPerspectiveHelper;
    }
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });
    
    // 统计信息更新
    if (this.stats) {
      this.stats.update();
    }

    // 渲染器同步渲染
    this.render();
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      const aspect = this.width/this.height;
      const frustumSize = 600;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = 0.5 * aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.cameraPerspective) {
        this.cameraPerspective.aspect = 0.5 * aspect;
        this.cameraPerspective.updateProjectionMatrix();
      }

      if (this.cameraOrtho) {
        this.cameraOrtho.left = -(0.5 * frustumSize * aspect / 2);
				this.cameraOrtho.right = (0.5 * frustumSize * aspect / 2);
				this.cameraOrtho.top = (frustumSize / 2);
				this.cameraOrtho.bottom = -(frustumSize / 2);
        this.cameraOrtho.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

