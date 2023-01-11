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
  private material: null | THREE.MeshPhongMaterial
  private object: null | THREE.Mesh
  private localPlane: null | THREE.Plane
  private globalPlane: null | THREE.Plane
  private startTime: number
  private globalPlanes: THREE.Plane[]
  private Empty: any[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.material = null;
    this.object = null;
    this.localPlane = null;
    this.globalPlane = null;
    this.startTime = 0;
    this.globalPlanes = [];
    this.Empty = [];
  }

  // 初始化方法入口
  init() {
    // 实例化相机 透视相机（PerspectiveCamera）
    // 这一摄像机使用perspective projection（透视投影）来进行投影
    // 这一投影模式被用来模拟人眼所看到的景象，它是3D场景的渲染中使用得最普遍的投影模式
    // PerspectiveCamera( fov : Number, aspect : Number, near : Number, far : Number )
    // fov — 摄像机视锥体垂直视野角度
    // aspect — 摄像机视锥体长宽比
    // near — 摄像机视锥体近端面
    // far — 摄像机视锥体远端面
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.25, 16);
    this.camera.position.set(0, 1.5, 2.5);

    // 创建一个场景
    this.scene = new THREE.Scene();
    // 在场景中 添加漫散射光
    this.scene.add(new THREE.AmbientLight(0x505050));

    // 创建一个聚光灯（SpotLight）
    // 光线从一个点沿一个方向射出，随着光线照射的变远，光线圆锥体的尺寸也逐渐增大
    const spotLight = new THREE.SpotLight(0xffffff);
    // 从聚光灯的位置以弧度表示聚光灯的最大范围。应该不超过 Math.PI/2。默认值为 Math.PI/3
    spotLight.angle = Math.PI / 5;
    // 聚光锥的半影衰减百分比。在0和1之间的值。 默认值 — 0.0
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    // 此属性设置为 true 聚光灯将投射阴影
    // 警告: 这样做的代价比较高而且需要一直调整到阴影看起来正确
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    // 一个Vector2定义阴影贴图的宽度和高度
    // 较高的值会以计算时间为代价提供更好的阴影质量
    // 值必须是2的幂，直到给定设备的WebGLRenderer.capabilities.maxTextureSize
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    // 创建一个直线光
    const dirLight = new THREE.DirectionalLight(0x55505a, 1);
    dirLight.position.set(0, 3, 0);
    // 如果设置为 true 该平行光会产生动态阴影
    // 警告: 这样做的代价比较高而且需要一直调整到阴影看起来正确
    // 查看 DirectionalLightShadow 了解详细信息。该属性默认为 false
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -1;
    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.top	= 1;
    dirLight.shadow.camera.bottom = -1;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // 创建剪切物体 Plane( normal : Vector3, constant : Float )
    // 在三维空间中无限延伸的二维平面，平面方程用单位长度的法向量和常数表示为海塞法向量Hessian normal form形式
    // normal - (可选参数) 定义单位长度的平面法向量Vector3。默认值为 (1, 0, 0)
    // constant - (可选参数) 从原点到平面的有符号距离。 默认值为 0
    this.localPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.8);
    this.globalPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.1);

    // 创建Phong网格材质(MeshPhongMaterial)
    // 一种用于具有镜面高光的光泽表面的材质
    this.material = new THREE.MeshPhongMaterial({
      color: 0x80ee10,
      // .specular高亮的程度，越高的值越闪亮。默认值为 30
      shininess: 100,
      // 定义将要渲染哪一面 - 正面，背面或两者
      // 默认为THREE.FrontSide。其他选项有THREE.BackSide和THREE.DoubleSide。
      side: THREE.DoubleSide,
      // 用户定义的剪裁平面，在世界空间中指定为THREE.Plane对象
      // 这些平面适用于所有使用此材质的对象。空间中与平面的有符号距离为负的点被剪裁（未渲染）
      clippingPlanes: [this.localPlane],
      // 定义是否根据此材质上指定的剪裁平面剪切阴影。默认值为 false
      clipShadows: true
    });
    // 圆环缓冲扭结几何体
    // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
    // radius - 圆环的半径，默认值为1
    // tube — 管道的半径，默认值为0.4
    // tubularSegments — 管道的分段数量，默认值为64
    // radialSegments — 横截面分段数量，默认值为8
    // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2
    // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3
    const geometry = new THREE.TorusKnotGeometry(0.4, 0.08, 95, 20);

    // 创建物体网格
    this.object = new THREE.Mesh(geometry, this.material);
    this.object.castShadow = true;
    this.scene.add(this.object);

    // 创建地板
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.MeshPhongMaterial({color: 0xa0adaf, shininess: 150})
    );
    floor.rotation.x = -Math.PI / 2;
    // 材质是否接收阴影。默认值为false
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 默认参数设置
    this.startTime = Date.now();
    this.globalPlanes = [this.globalPlane];
    this.renderer.clippingPlanes = this.Empty;
    this.renderer.localClippingEnabled = true;

    // 创建控制器 轨道控制器（OrbitControls）
    const controls = new OrbitControls(this.camera, this.renderer.domElement );
    controls.target.set(0, 1, 0);
    controls.update();

    // 性能统计 方法调用
    this.initStats();
    // 启动动画
    this.animate();
    // 自适应窗口
    this.resize();
  }

  // 设置enabled
  setEnabled(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
        break;
      case "global":
        if (this.renderer) {
          this.renderer.clippingPlanes = (enabled ? this.globalPlanes : this.Empty);
        }
        break;
      default:
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
    }
  }

  // 设置Shadows
  setShadows(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.material) {
          this.material.clipShadows = enabled;
        }
        break;
      default:
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
    }
  }

  // 设置Plane
  setPlane(type: "local" | "global", val: number) {
    switch(type) {
      case "local":
        if (this.localPlane) {
          this.localPlane.constant = val;
        }
        break;
      case "global":
        if (this.globalPlane) {
          this.globalPlane.constant = val;
        }
        break;
      default:
        if (this.localPlane) {
          this.localPlane.constant = val;
        }
    }
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
		const time = (currentTime - this.startTime ) / 1000;
    
    if (this.object) {
      this.object.position.y = 0.8;
      this.object.rotation.x = time * 0.5;
      this.object.rotation.y = time * 0.2;
      this.object.scale.setScalar( Math.cos( time ) * 0.125 + 0.875 );
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

