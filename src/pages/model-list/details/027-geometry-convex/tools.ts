import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private group: THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.group = new THREE.Group();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(new THREE.AmbientLight(0x222222));
    this.scene.add(new THREE.AxesHelper(20));
    this.scene.add(this.group);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 1, 1000);
    this.camera.position.set(15, 20, 30);
    this.scene.add(this.camera);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = 20;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2;

    // 创建光源
    const light = new THREE.PointLight(0xffffff, 1);
    this.camera.add(light);

    // 创建纹理
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/examples/textures/sprites/disc.png');
    const pointsMaterial = new THREE.PointsMaterial({color: 0x0080ff, map: texture, size: 1,alphaTest: 0.5});

    // 创建点
    const baseDodecahedronGeometry = new THREE.DodecahedronGeometry(10);
    baseDodecahedronGeometry.deleteAttribute('normal');
    baseDodecahedronGeometry.deleteAttribute('uv');

    const dodecahedronGeometry = BufferGeometryUtils.mergeVertices(baseDodecahedronGeometry);
    const vertices = [];
    const positionAttribute = dodecahedronGeometry.getAttribute('position');
    for ( let i = 0; i < positionAttribute.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positionAttribute, i);
      vertices.push(vertex);
    }
    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.group.add(points);

    // 创建凸壳
    const meshMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, opacity: 0.5, transparent: true});
    const meshGeometry = new ConvexGeometry(vertices);

    const backMesh = new THREE.Mesh(meshGeometry, meshMaterial);
    backMesh.material.side = THREE.BackSide; // back faces
    backMesh.renderOrder = 0;
    this.group.add(backMesh);

    const frontMesh = new THREE.Mesh(meshGeometry, meshMaterial.clone());
    frontMesh.material.side = THREE.FrontSide; // front faces
    frontMesh.renderOrder = 1;
    this.group.add(frontMesh);

    // 执行动画
    this.animate();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 集合分组
    if (this.group) {
      this.group.rotation.y += 0.005;
    }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }


  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
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

