import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

type Iparams = [number, number, number];

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private radius: number
  private mouseY: number
  private halfY: number
  private isTest: boolean

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.radius = 450;
    this.mouseY = 0;
    this.halfY = this.height/2;
    this.isTest = false;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 3000);
    this.camera.position.z = 1000;

    // 创建渲染器
    this.createRenderer();

    // 创建模型
    this.createModel();

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

  // 创建集合
  private createGeometry() {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const vertex = new THREE.Vector3();

    for (let i = 0; i < 1500; i++) {
      vertex.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      );

      // 将该向量转换为单位向量（unit vector）， 也就是说，
      // 将该向量的方向设置为和原向量相同，但是其长度（length）为1。
      vertex.normalize();

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘
      vertex.multiplyScalar(this.radius);
      vertices.push(vertex.x, vertex.y, vertex.z);

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘
      vertex.multiplyScalar(Math.random() * 0.09 + 1);
      vertices.push(vertex.x, vertex.y, vertex.z);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geometry;
  }

  // 创建模型
  private createModel() {
    const params: Iparams[] = [
      [0.25, 0xff7700, 1],
      [0.5, 0xff9900, 1],
      [0.75, 0xffaa00, 0.75],
      [1, 0xffaa00, 0.5],
      [1.25, 0x000833, 0.8],
      [3.0, 0xaaaaaa, 0.75], 
      [3.5, 0xffffff, 0.5],
      [4.5, 0xffffff, 0.25], 
      [5.5, 0xffffff, 0.125]
    ];

    const geometry = this.createGeometry();
    params.forEach((item) => {
      const [scale = 0.25, color = 0xff7700, opacity = 1] = item;
      const material = new THREE.LineBasicMaterial({color, opacity});
      const line = new THREE.LineSegments(geometry, material);

      line.scale.set(scale, scale, scale);
      line.userData.originalScale = scale;
      line.rotation.y = Math.random() * Math.PI;
      // 更新局部变换
      line.updateMatrix();
      this.scene.add(line);
    });

    // 测试集合的交互性
    if (this.isTest) {
      this.testSwapability();
    }
  }

  // 交互性测试
  private testSwapability() {
    setInterval(() => {
      const geometry =  this.createGeometry();

      this.scene.traverse((object) => {
        const obj = object as THREE.LineSegments;
        if (obj.isLine) {
          // 从内存中销毁对象 如果在运行是需要从内存中删除 BufferGeometry，则需要调用该函数。
          obj.geometry.dispose();
          obj.geometry = geometry;
        }
      });
    }, 1000);
  }

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e  =event.touches[0];
        this.mouseY = e.clientY - 45 - this.halfY;
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        if (e.isPrimary) { return false; }
        this.mouseY = e.clientY - 45 - this.halfY;
      };
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 渲染
  private render() {
    if (this.camera) {
      this.camera.position.y += ( -this.mouseY + 200 - this.camera.position.y) * 0.05;
			this.camera.lookAt(this.scene.position);
      
      const time = Date.now() * 0.0001;
      this.scene.children.forEach((object, i) => {
        const obj = object as THREE.LineSegments;
        const { originalScale = 1 } = obj.userData;

        if (obj.isLine) {
          obj.rotation.y = time * (i < 4 ? (i + 1) : -(i + 1));

          if (i < 5) {
            const scale = originalScale * (i/5 + 1) * (1 + 0.5 * Math.sin(7 * time));
            obj.scale.set(scale, scale, scale);
          }
        }
      });
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.halfY = this.height/2;

      this.bind();
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

