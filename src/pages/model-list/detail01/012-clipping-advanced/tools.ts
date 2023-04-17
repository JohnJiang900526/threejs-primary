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
      new THREE.Vector3(+1, 0, +Math.SQRT1_2),
      new THREE.Vector3(-1, 0, +Math.SQRT1_2),
      new THREE.Vector3(0, +1, -Math.SQRT1_2),
      new THREE.Vector3(0, -1, -Math.SQRT1_2)
    ];
    this.Indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2];
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
    // 初始化已知变量
    this.Planes = this.planesFromMesh(this.Vertices, this.Indices);
    this.PlaneMatrices = this.Planes.map(this.planeToMatrix);
    this.GlobalClippingPlanes = this.cylindricalPlanes(5, 2.5);

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.25, 16);
    this.camera.position.set(0, 1.5, 3);

    // 创建一个场景
    this.scene = new THREE.Scene();
    // 添加漫散射光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // 创建一个聚光灯
    // SpotLight( color : Integer, intensity : Float, distance : Float, angle : Radians, penumbra : Float, decay : Float )
    // color - (可选参数) 十六进制光照颜色。 缺省值 0xffffff (白色)
    // intensity - (可选参数) 光照强度。 缺省值 1
    // distance - 从光源发出光的最大距离，其强度根据光源的距离线性衰减
    // angle - 光线散射角度，最大为Math.PI/2
    // penumbra - 聚光锥的半影衰减百分比。在0和1之间的值。默认为0
    // decay - 沿着光照距离的衰减量
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.angle = (Math.PI / 5);
    // 聚光锥的半影衰减百分比。在0和1之间的值。默认为0
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    // 此属性设置为 true 聚光灯将投射阴影。警告: 这样做的代价比较高而且需要一直调整到阴影看起来正确
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    // 创建一束直线光
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 2, 0);
    // 此属性设置为 true 将投射阴影。警告: 这样做的代价比较高而且需要一直调整到阴影看起来正确
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

    // 创建箱子几何体
    const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.object = new THREE.Group();
    // 创建材质
    this.clipMaterial = new THREE.MeshPhongMaterial({
      color: 0xee0a10,
      // .specular高亮的程度，越高的值越闪亮。默认值为 30
      shininess: 100,
      // 定义将要渲染哪一面 - 正面，背面或两者
      // 默认为THREE.FrontSide。其他选项有THREE.BackSide和THREE.DoubleSide。
      side: THREE.DoubleSide,
      // 用户定义的剪裁平面，在世界空间中指定为THREE.Plane对象
      clippingPlanes: this.createPlanes(this.Planes.length),
      // 定义是否根据此材质上指定的剪裁平面剪切阴影。默认值为 false
      clipShadows: true
    });
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

    // 平面缓冲几何体（PlaneGeometry）
    const planeGeometry = new THREE.PlaneGeometry(3, 3, 1, 1);
    const color = new THREE.Color();
    this.volumeVisualization = new THREE.Group();
    this.volumeVisualization.visible = false;
    for (let i = 0; i < this.Planes.length; i++) {
      const clippingPlanes: THREE.Plane[] = this.clipMaterial.clippingPlanes;

      const material = new THREE.MeshBasicMaterial({
        color: color.setHSL(i / this.Planes.length, 0.5, 0.5).getHex(),
        side: THREE.DoubleSide,
        opacity: 0.2,
        transparent: true,
        clippingPlanes: clippingPlanes.filter((item, j: number) => j !== i)
      });
      const mesh = new THREE.Mesh(planeGeometry, material);
      // 当这个属性设置了之后，它将计算每一帧的位移、旋转（四元变换）和缩放矩阵，并重新计算matrixWorld属性
      mesh.matrixAutoUpdate = false;
      this.volumeVisualization.add(mesh);
    }
    this.scene.add(this.volumeVisualization);

    // 创建地板
    const ground = new THREE.Mesh(
      planeGeometry,
      new THREE.MeshPhongMaterial({color: 0xa0adaf, shininess: 10})
    );
    // 物体的局部旋转，以弧度来表示。（请参阅Euler angles-欧拉角）
    ground.rotation.x = (-Math.PI/2);
    // 将该向量与所传入的标量s进行相乘
    ground.scale.multiplyScalar(3);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 初始化之后 默认参数设置
    this.globalClippingPlanes = this.createPlanes(this.GlobalClippingPlanes.length);
    // 用户自定义的剪裁平面，在世界空间中被指定为THREE.Plane对象
    // 这些平面全局使用。空间中与该平面点积为负的点将被切掉。 默认值是[]
		this.renderer.clippingPlanes = this.Empty;
    // 定义渲染器是否考虑对象级剪切平面。 默认为false
		this.renderer.localClippingEnabled = true;
    this.startTime = Date.now();

    // 控制器 Orbit controls（轨道控制器）可以使得相机围绕目标进行轨道运动
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 你能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0
    controls.minDistance = 1;
    // 你能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity
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

      // normal - (可选参数) 定义单位长度的平面法向量Vector3。默认值为 (1, 0, 0)
      plane.normal.set( Math.cos(angle), 0, Math.sin(angle));
      // constant - (可选参数) 从原点到平面的有符号距离。 默认值为 0
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

    // crossVectors 将该向量设置为传入的a与b的叉积
    // normalize 将该向量转换为单位向量（unit vector）， 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1
    xAxis.crossVectors(yAxis.normalize(), zAxis);
    // target — 结果会拷贝到该向量中
    plane.coplanarPoint(trans);

    // 以行优先的格式将传入的数值设置给该矩阵中的元素elements
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
      // .setFromCoplanarPoints ( a : Vector3, b : Vector3, c : Vector3 )
      // a - 用于确定平面的第一个点
      // b - 用于确定平面的第二个点
      // c - 用于确定平面的第三个点
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
      // applyMatrix4 ( matrix : Matrix4, optionalNormalMatrix : Matrix3 )
      // matrix - 要应用的四位矩阵（Matrix4）
      // optionalNormalMatrix - (可选参数) 预先计算好的上述Matrix4参数的法线矩阵 Matrix3
      planesOut[i].copy(planesIn[i]).applyMatrix4(matrix);
    }
  }

  // 设置 集合对象世界矩阵
  private setObjectWorldMatrix(object: THREE.Object3D, matrix: THREE.Matrix4) {
    const parent: THREE.Object3D = object.parent as THREE.Object3D;
    (this.scene as THREE.Scene).updateMatrixWorld();
    // 将当前矩阵翻转为它的逆矩阵，使用 analytic method 解析方式
    // 你不能对行或列为 0 的矩阵进行翻转，如果你尝试这样做，该方法将生成一个零矩阵
    object.matrix.copy(parent.matrixWorld).invert();
    // 对当前物体应用这个变换矩阵，并更新物体的位置、旋转和缩放
    object.applyMatrix4(matrix);
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
    
    // 将当前矩阵乘以矩阵
    this.transform.multiply(this.tmpMatrix.makeScale(bouncy, bouncy, bouncy));
    this.assignTransformedPlanes( clippingPlanes, this.Planes, this.transform);
    const planeMeshes = (this.volumeVisualization as THREE.Group).children;

    for ( let i = 0; i < planeMeshes.length; i++) {
      // 设置当前矩阵为矩阵a x 矩阵b
      this.tmpMatrix.multiplyMatrices(this.transform, this.PlaneMatrices[i] );
      this.setObjectWorldMatrix(planeMeshes[i], this.tmpMatrix);
    }
    // 把该矩阵设置为绕Y轴旋转弧度theta (θ)大小的矩阵
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

