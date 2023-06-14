import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  computeBoundsTree, disposeBoundsTree, 
  acceleratedRaycast, MeshBVHVisualizer, MeshBVH,
} from 'three-mesh-bvh';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';

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
  private mesh: THREE.Mesh | null;
  private helper: MeshBVHVisualizer | null;
  private bvh: MeshBVH | undefined
  private sphereInstance: THREE.InstancedMesh | null
  private lineSegments: THREE.LineSegments
  private raycaster: THREE.Raycaster
  private position: THREE.Vector3
  private quaternion: THREE.Quaternion
  private scale: THREE.Vector3
  private matrix: THREE.Matrix4
  private axis: THREE.Vector3
  private MAX_RAYS: number
  private RAY_COLOR: number
  private params: {
    count: number,
    firstHitOnly: boolean,
    useBVH: boolean,

    displayHelper: boolean,
    helperDepth: number,
  }
  private gui: GUI
  constructor(container: HTMLDivElement) {
    
    THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
    THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;

    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.controls = null;
    this.mesh = null;
    this.helper = null;
    this.bvh = undefined;
    this.sphereInstance = null;
    this.lineSegments = new THREE.LineSegments();
    this.raycaster = new THREE.Raycaster();
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.scale = new THREE.Vector3(1, 1, 1);
    this.matrix = new THREE.Matrix4();
    this.axis = new THREE.Vector3();
    this.MAX_RAYS = 3000;
    this.RAY_COLOR = 0x444444;
    this.params = {
      count: 150,
      firstHitOnly: true,
      useBVH: true,
      displayHelper: false,
      helperDepth: 10,
    };
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    // light
    const light = new THREE.HemisphereLight(0xffffff, 0x999999);
    this.scene.add(light);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 100);
    this.camera.position.z = 10;

    // line
    this.generateLine();
    // model
    this.loadModel();
    // rays
    this.initRays();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 75;
    this.controls.update();

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    const rayFolder = this.gui.addFolder('光线投射');
    rayFolder.add(this.params, 'count', 1, this.MAX_RAYS, 1);
    rayFolder.add(this.params, 'firstHitOnly');
    rayFolder.add(this.params, 'useBVH').onChange((v: number) => {
      if (this.mesh) {
        this.mesh.geometry.boundsTree = v ? this.bvh : undefined;
      }
    });

    const helperFolder = this.gui.addFolder('BVH Helper');
    helperFolder.add(this.params, 'displayHelper');
    helperFolder.add(this.params, 'helperDepth', 1, 20, 1).onChange((v: number) => {
      if (this.helper) {
        this.helper.depth = v;
        this.helper.update();
      }
    });
  }

  private initRays() {
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < this.MAX_RAYS * 2; i ++) {
      position.randomDirection().multiplyScalar(3.75);
      matrix.compose(position, quaternion, scale);
      this.sphereInstance?.setMatrixAt(i, matrix);
    }
  }

  private loadModel() {
    const loader = new FBXLoader();
    const url = "/examples/models/fbx/stanford-bunny.fbx";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (object) => {
      toast.close();
      this.mesh = object.children[0] as THREE.Mesh;

      const geometry  =this.mesh.geometry;
      geometry.translate(0, 0.5 / 0.0075, 0);
      geometry.computeBoundsTree();
      this.bvh = geometry.boundsTree;

      if (!this.params.useBVH) {
        geometry.boundsTree = undefined;
      }

      this.scene.add(this.mesh);
      this.mesh.scale.setScalar(0.0075);

      this.helper = new MeshBVHVisualizer(this.mesh);
      this.helper.color.set(0xE91E63);
      this.scene.add(this.helper);
    }, undefined, () => { toast.close(); });    
  }

  private generateLine() {
    const position = new THREE.BufferAttribute(new Float32Array(this.MAX_RAYS * 2 * 3), 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', position);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: this.RAY_COLOR,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    this.lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);

    this.sphereInstance = new THREE.InstancedMesh(
      new THREE.SphereGeometry(),
      new THREE.MeshBasicMaterial({ color: this.RAY_COLOR }),
      2 * this.MAX_RAYS
    );
    this.sphereInstance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sphereInstance.count = 0;
    this.scene.add(this.sphereInstance, this.lineSegments);
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

  private updateRays() {
    if (!this.mesh) { return; }

    this.raycaster.firstHitOnly = this.params.firstHitOnly;
    const rayCount = this.params.count;

    let lineNum = 0;
    for (let i = 0; i < rayCount; i++) {
      // get the current ray origin
      this.sphereInstance?.getMatrixAt(i * 2, this.matrix);
      // .decompose ( position : Vector3, quaternion : Quaternion, scale : Vector3 ) : this
      // 将矩阵分解到给定的平移position ,旋转 quaternion，缩放scale分量中。
      // 注意：并非所有矩阵都可以通过这种方式分解。 
      // 例如，如果一个对象有一个非均匀缩放的父对象，
      // 那么该对象的世界矩阵可能是不可分解的，这种方法可能不合适。
      this.matrix.decompose(this.position, this.quaternion, this.scale);

      // rotate it about the origin
      const offset = 1e-4 * window.performance.now();
      // 将该向量转换为单位向量（unit vector）， 
      // 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1。
      this.axis.set(
        Math.sin(i * 100 + offset),
        Math.cos(-i * 10 + offset),
        Math.sin(i * 1 + offset),
      ).normalize();
      // .applyAxisAngle ( axis : Vector3, angle : Float ) : this
      // axis - 一个被归一化的Vector3。
      // angle - 以弧度表示的角度。
      // 将轴和角度所指定的旋转应用到该向量上。
      this.position.applyAxisAngle(this.axis, 0.001);

      // update the position
      this.scale.setScalar(0.02);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.sphereInstance?.setMatrixAt(i * 2, this.matrix);

      // raycast
      this.raycaster.ray.origin.copy(this.position);
      this.raycaster.ray.direction.copy(this.position).multiplyScalar(-1).normalize();

      let hits: THREE.Intersection[] = [];
      try {
        hits = this.raycaster.intersectObject(this.mesh);
      } catch (e) {
        hits = [];
      }
      
      const position = this.lineSegments.geometry.attributes.position as THREE.BufferAttribute;
      if (hits.length !== 0) {
        const hit = hits[0];
        const point = hit.point;
        this.scale.setScalar(0.01);
        this.matrix.compose(point, this.quaternion, this.scale);

        this.sphereInstance?.setMatrixAt(i * 2 + 1, this.matrix);
        position.setXYZ(lineNum ++, this.position.x, this.position.y, this.position.z);
        position.setXYZ(lineNum ++, point.x, point.y, point.z);
      } else {
        this.sphereInstance?.setMatrixAt(i * 2 + 1, this.matrix);
        position.setXYZ(lineNum ++, this.position.x, this.position.y, this.position.z);
        position.setXYZ(lineNum ++, 0, 0, 0);
      }
    }

    if (this.sphereInstance && this.lineSegments) {
      this.sphereInstance.count = rayCount * 2;
      this.sphereInstance.instanceMatrix.needsUpdate = true;
  
      this.lineSegments.geometry.setDrawRange(0, lineNum);
      this.lineSegments.geometry.attributes.position.needsUpdate = true;
    }
  }

  private render() {
    if (this.helper) {
      this.helper.visible = this.params.displayHelper;
    }

    if (this.mesh) {
      this.mesh.rotation.y += 0.002;
      this.mesh.updateMatrixWorld();
      this.updateRays();
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

