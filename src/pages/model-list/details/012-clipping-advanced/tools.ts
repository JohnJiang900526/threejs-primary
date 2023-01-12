import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private clipMaterial: null | THREE.MeshPhongMaterial
  private startTime: number
  private object: null | THREE.Group
  private Planes: THREE.Plane[]
  private Vertices: THREE.Vector3[]
  private Indices: number[]
  private PlaneMatrices: THREE.Matrix4[]
  private GlobalClippingPlanes: THREE.Plane[]
  private globalClippingPlanes: THREE.Plane[]
  private volumeVisualization: null | THREE.Group
  private Empty: any[]
  private transform: THREE.Matrix4
  private tmpMatrix: THREE.Matrix4
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.startTime = 0;
    this.clipMaterial = null;
    this.object = null;
    this.Planes = [];
    this.Vertices = [
      new THREE.Vector3( + 1, 0, + Math.SQRT1_2 ),
      new THREE.Vector3( - 1, 0, + Math.SQRT1_2 ),
      new THREE.Vector3( 0, + 1, - Math.SQRT1_2 ),
      new THREE.Vector3( 0, - 1, - Math.SQRT1_2 )
    ];
    this.Indices = [0, 1, 2,	0, 2, 3,	0, 3, 1,	1, 3, 2];
    this.PlaneMatrices = [];
    this.GlobalClippingPlanes = [];
    this.globalClippingPlanes = [];
    this.volumeVisualization = null;
    this.Empty = [];
    this.transform = new THREE.Matrix4();
    this.tmpMatrix = new THREE.Matrix4();
  }

  // 初始化方法入口
  init() {
    this.Planes = this.planesFromMesh(this.Vertices, this.Indices);
    this.PlaneMatrices = this.Planes.map(this.planeToMatrix);
    this.GlobalClippingPlanes = this.cylindricalPlanes(5, 2.5);

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.25, 16);
    this.camera.position.set(0, 1.5, 3);

    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // 创建一个聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.angle = (Math.PI / 5);
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    // 创建一束直线光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 2, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.camera.left = -1;
    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.top = 1;
    dirLight.shadow.camera.bottom = -1;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // 创建材质
    this.clipMaterial = new THREE.MeshPhongMaterial({
      color: 0xee0a10,
      shininess: 100,
      side: THREE.DoubleSide,
      clippingPlanes: this.createPlanes(this.Planes.length),
      clipShadows: true
    });
    this.object = new THREE.Group();

    const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let z = -2; z <= 2; z++) {
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          const mesh = new THREE.Mesh(geometry, this.clipMaterial);
          mesh.position.set(x / 5, y / 5, z / 5);
          mesh.castShadow = true;
          this.object.add(mesh);
        }
      }
    }
    this.scene.add(this.object);

    const planeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1);
    const color = new THREE.Color();

    this.volumeVisualization = new THREE.Group();
    this.volumeVisualization.visible = false;

    for (let i = 0; i < this.Planes.length; i++) {
      const clippingPlanes: THREE.Plane[] = this.clipMaterial.clippingPlanes;

      const material = new THREE.MeshBasicMaterial({
        color: color.setHSL( i / this.Planes.length, 0.5, 0.5 ).getHex(),
        side: THREE.DoubleSide,
        opacity: 0.2,
        transparent: true,
        clippingPlanes: clippingPlanes.filter((item, j: number) => {
          return j !== i;
        })
      });
      const mesh = new THREE.Mesh(planeGeometry, material);
      mesh.matrixAutoUpdate = false;
      this.volumeVisualization.add(mesh);
    }
    this.scene.add(this.volumeVisualization);

    // 创建地板
    const ground = new THREE.Mesh(
      planeGeometry,
      new THREE.MeshPhongMaterial({color: 0xa0adaf, shininess: 10})
    );
    ground.rotation.x = - Math.PI / 2;
    ground.scale.multiplyScalar(3);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.globalClippingPlanes = this.createPlanes(this.GlobalClippingPlanes.length);
		this.renderer.clippingPlanes = this.Empty;
		this.renderer.localClippingEnabled = true;
    this.startTime = Date.now();

    // 控制器
    const controls = new OrbitControls( this.camera, this.renderer.domElement );
    controls.minDistance = 1;
    controls.maxDistance = 8;
    controls.target.set(0, 1, 0);
    controls.update();
    
    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 设置enabled
  setEnabled(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
          if (!enabled && this.volumeVisualization) {
            this.volumeVisualization.visible = false;
          }
        }
        break;
      case "global":
        if (this.renderer) {
          this.renderer.clippingPlanes = (enabled ? this.globalClippingPlanes : this.Empty);
        }
        break;
      default:
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
          if (!enabled && this.volumeVisualization) {
            this.volumeVisualization.visible = false;
          }
        }
    }
  }

  // 设置Shadows
  setShadows(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.clipMaterial) {
          this.clipMaterial.clipShadows = enabled;
        }
        break;
      default:
        if (this.clipMaterial) {
          this.clipMaterial.clipShadows = enabled;
        }
    }
  }

  // 设置Visualize
  setVisualize(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.renderer && this.volumeVisualization) {
          if (this.renderer.localClippingEnabled) {
            this.volumeVisualization.visible = enabled;
          }
        }
        break;
      default:
        if (this.renderer && this.volumeVisualization) {
          if (this.renderer.localClippingEnabled) {
            this.volumeVisualization.visible = enabled;
          }
        }
    }
  }

  // 圆柱面
  private cylindricalPlanes(n: number, innerRadius: number) {
    const arr = this.createPlanes(n);

    for (let i = 0; i < n; i++) {
      const plane = arr[i];
			const angle = (i * Math.PI * 2 / n);

      plane.normal.set(
        Math.cos(angle), 0, Math.sin(angle)
      );
      plane.constant = innerRadius;
    }
    return arr;
  }

  // 平面的材质
  private planeToMatrix(plane: THREE.Plane) {
    const xAxis = new THREE.Vector3();
		const yAxis = new THREE.Vector3();
		const trans = new THREE.Vector3();

    const zAxis = plane.normal;
		const matrix = new THREE.Matrix4();

    if (Math.abs(zAxis.x) > Math.abs(zAxis.z)) {
      yAxis.set(-zAxis.y, zAxis.x, 0);
    } else {
      yAxis.set(0, -zAxis.z, zAxis.y);
    }

    xAxis.crossVectors(yAxis.normalize(), zAxis);
    plane.coplanarPoint(trans);

    return matrix.set(
      xAxis.x, yAxis.x, zAxis.x, trans.x,
      xAxis.y, yAxis.y, zAxis.y, trans.y,
      xAxis.z, yAxis.z, zAxis.z, trans.z,
      0, 0, 0, 1
    );
  }

  // 网格的平面
  private planesFromMesh(vertices: THREE.Vector3[], indices: number[]) {
    const n = (indices.length / 3);
    const arr: THREE.Plane[] = [];

    for (let i = 0, j = 0; i < n; i++, j += 3) {
      const a = vertices[indices[j]];
      const b = vertices[indices[j + 1]];
      const c = vertices[indices[j + 2]];
      arr.push(new THREE.Plane().setFromCoplanarPoints(a, b, c));
    }
    return arr;
  }

  // 创建平面
  private createPlanes(n: number) {
    const arr:THREE.Plane[] = [];

    for (let i = 0; i < n; i++) {
      arr.push(new THREE.Plane());
    }
    return arr;
  }

  // 指定变换平面
  private assignTransformedPlanes(planesOut: THREE.Plane[], planesIn: THREE.Plane[], matrix: THREE.Matrix4) {
    for (let i = 0; i < planesIn.length; i++) {
      planesOut[i].copy(planesIn[i]).applyMatrix4(matrix);
    }
  }

  // 设置 集合对象世界矩阵
  private setObjectWorldMatrix(object: THREE.Object3D, matrix: THREE.Matrix4) {
    const parent: THREE.Object3D = object.parent as THREE.Object3D;
    (this.scene as THREE.Scene).updateMatrixWorld();
    object.matrix.copy(parent.matrixWorld).invert();
    object.applyMatrix4(matrix);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    const currentTime = Date.now();
		const time = ( currentTime - this.startTime ) / 1000;

    if (this.object) {
      this.object.position.y = 1;
      this.object.rotation.x = time * 0.5;
      this.object.rotation.y = time * 0.2;
      this.object.updateMatrix();
      this.transform.copy(this.object.matrix);
    }

    const bouncy = Math.cos(time * 0.5) * 0.5 + 0.7;
    const clippingPlanes: THREE.Plane[] = (this.clipMaterial as THREE.MeshPhongMaterial).clippingPlanes;
    
    this.transform.multiply(this.tmpMatrix.makeScale(bouncy, bouncy, bouncy));
    this.assignTransformedPlanes( clippingPlanes, this.Planes, this.transform);
    const planeMeshes = (this.volumeVisualization as THREE.Group).children;

    for ( let i = 0; i < planeMeshes.length; i++) {
      this.tmpMatrix.multiplyMatrices(this.transform, this.PlaneMatrices[i] );
      this.setObjectWorldMatrix( planeMeshes[i], this.tmpMatrix);
    }
    this.transform.makeRotationY(time * 0.1);
    this.assignTransformedPlanes(this.globalClippingPlanes, this.GlobalClippingPlanes, this.transform);

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
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

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width/this.height;
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

