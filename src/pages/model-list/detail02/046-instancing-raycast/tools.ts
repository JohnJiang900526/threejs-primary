import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls;
  private stats: null | Stats;
  private amount: number;
  private count: number;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private color: THREE.Color;
  private white: THREE.Color;
  private mesh: null | THREE.InstancedMesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.amount = 10;
    this.count = Math.pow(this.amount, 3);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(1, 1);
    this.color = new THREE.Color();
    this.white = new THREE.Color().setHex(0xffffff);
    this.mesh = null
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width / this.height, 0.1, 100);
    this.camera.position.set(this.amount, this.amount, this.amount);

    // 创建光源
    const light = new THREE.HemisphereLight(0xffffff, 0x888888);
    light.position.set(0, 1, 0);
    this.scene.add(light);

    // 初始化网格
    this.initMesh();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;

    // 事件绑定
    this.bind();

    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置模型个数
  setCount(count: number) {
    this.count = count;

    // 初始化 Mesh
    this.initMesh();
  }

  private initMesh() {
    // 清除原生模型
    this.clean();

    const geometry = new THREE.IcosahedronGeometry(0.5, 3);
    const material = new THREE.MeshPhongMaterial({color: 0xffffff});

    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);

    let i = 0;
    const offset = (this.amount - 1) / 2;
    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.amount; x++) {
      for (let y = 0; y < this.amount; y++) {
        for (let z = 0; z < this.amount; z++) {
          matrix.setPosition(offset - x, offset - y, offset - z);
          this.mesh.setMatrixAt(i, matrix);
          this.mesh.setColorAt(i, this.color);
          i++;
        }
      }
    }

    this.scene.add(this.mesh);
  }

  // 清除模型中的网格对象
  private clean() {
    const meshes: THREE.Mesh[] = [];

    this.scene.traverse((item: THREE.Object3D | THREE.Mesh) => {
      if ((item as THREE.Mesh).isMesh) {
        meshes.push(item as THREE.Mesh);
      }
    });

    meshes.forEach((mesh) => {
      (mesh.material as THREE.Material).dispose();
      mesh.geometry.dispose();
      this.scene.remove(mesh);
    });

    this.color = new THREE.Color();
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      window.onmousemove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        this.mouse.x = (e.clientX / this.width) * 2 - 1;
				this.mouse.y = -((e.clientY - 45) / this.height) * 2 + 1;
      }
    } else {
      window.ontouchmove = null;
      window.onmousemove = (e) => {
        e.preventDefault();

				this.mouse.x = (e.clientX / this.width) * 2 - 1;
				this.mouse.y = -((e.clientY - 45) / this.height) * 2 + 1;
      };
    }
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器更新
    if (this.controls && this.camera && this.mesh) {
      this.controls.update();
      // .setFromCamera ( coords : Vector2, camera : Camera ) : undefined
      // coords —— 在标准化设备坐标中鼠标的二维坐标 —— X分量与Y分量应当在-1到1之间
      // camera —— 射线所来源的摄像机
      // 使用一个新的原点和方向来更新射线
      this.raycaster.setFromCamera(this.mouse, this.camera);
      // .intersectObject ( object : Object3D, recursive : Boolean, optionalTarget : Array ) : Array
      // object —— 检查与射线相交的物体
      // recursive —— 若为true，则同时也会检查所有的后代。否则将只会检查对象本身。默认值为true
      // optionalTarget — （可选）设置结果的目标数组。如果不设置这个值，则一个新的Array会被实例化；
      // 如果设置了这个值，则在每次调用之前必须清空这个数组（例如：array.length = 0;）
      // 检测所有在射线与物体之间，包括或不包括后代的相交部分。返回结果时，相交部分将按距离进行排序，最近的位于第一个
      // 该方法返回一个包含有交叉部分的数组
      const intersection = this.raycaster.intersectObject(this.mesh);
      if (intersection.length > 0) {
        const instanceId = intersection[0].instanceId as number;
        // .getColorAt ( index : Integer, color : Color ) : undefined
        // index -- 实例的索引。值必须在[0,count]范围内
        // color -- 此颜色对象将被设置为已定义实例的颜色
        // 获取已定义实例的颜色
        this.mesh.getColorAt(instanceId, this.color);
        if (this.color.equals(this.white)) {
          // .setColorAt ( index : Integer, color : Color ) : undefined
          // index: The index of an instance. Values have to be in the range [0, count].
          // color: The color of a single instance.
          // Sets the given color to the defined instance. 
          // Make sure you set .instanceColor.needsUpdate to true after updating all the colors.
          this.mesh.setColorAt(instanceId, this.color.setHex(Math.random() * 0xffffff));
          (this.mesh.instanceColor as THREE.InstancedBufferAttribute).needsUpdate = true;
        }
      }
    }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      // 事件绑定
      this.bind();

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

