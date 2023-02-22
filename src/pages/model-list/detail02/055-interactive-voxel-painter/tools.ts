import * as THREE from 'three';
import { showSuccessToast, showFailToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private plane: THREE.Mesh
  private rollOverMesh: THREE.Mesh
  private rollOverMaterial: THREE.MeshBasicMaterial
  private cubeGeo: THREE.BoxGeometry
  private cubeMaterial: THREE.MeshLambertMaterial
  private objects: THREE.Mesh[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.plane = new THREE.Mesh();
    this.rollOverMesh = new THREE.Mesh();
    this.rollOverMaterial = new THREE.MeshBasicMaterial();
    this.cubeGeo = new THREE.BoxGeometry();
    this.cubeMaterial = new THREE.MeshLambertMaterial();
    this.objects = [];
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 10000);
    this.camera.position.set(500, 800, 1300);
    this.camera.lookAt(0, 0, 0);

    // 创建光照
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 0.75, 0.5).normalize();
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x606060));

    // 创建gridhelper
    const gridHelper = new THREE.GridHelper(1000, 20);
    this.scene.add(gridHelper);

    // 创建箱子
    this.createCubes();

    // 创建plane geometry 
    this.createPlane();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

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

  // 删除事件
  deleteHandle() {
    if (this.objects.length === 0) {
      showFailToast({
        message: "已经全部删除"
      });
      return false;
    }

    const arr = this.objects.filter((box) => {
      return !box.userData.ignore;
    }).reverse();
    const box = arr.shift() as THREE.Mesh;

    this.scene.remove(box);
    this.objects = arr;

    showSuccessToast({
      message: "删除成功"
    });
  }

  // 全部删除
  clearHandle() {
    if (this.objects.length === 0) {
      showFailToast({
        message: "已经全部删除"
      });
      return false;
    }

    this.objects.filter((box) => {
      return !box.userData.ignore;
    }).forEach((box) => {
      this.scene.remove(box as THREE.Mesh);
      this.objects.splice(this.objects.indexOf(box), 1);
    });

    showSuccessToast({
      message: "全部删除成功"
    });
  }

  // roll-over helpers and cubes
  private createCubes() {
    const rollOverGeo = new THREE.BoxGeometry(50, 50, 50);

    this.rollOverMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      opacity: 0.5, 
      transparent: true 
    });
    this.rollOverMesh = new THREE.Mesh(rollOverGeo, this.rollOverMaterial);
    this.scene.add(this.rollOverMesh);

    this.cubeGeo = new THREE.BoxGeometry(50, 50, 50);
    // Lambert网格材质(MeshLambertMaterial)
    // 一种非光泽表面的材质，没有镜面高光
    this.cubeMaterial = new THREE.MeshLambertMaterial({
      color: 0xfeb74c,
      map: new THREE.TextureLoader().load('/examples/textures/square-outline-textured.png') 
    });
  }

  // 创建 plane集合
  private createPlane() {
    const geometry = new THREE.PlaneGeometry(1000, 1000);

    geometry.rotateX(-Math.PI / 2);

    this.plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({visible: false}));
    this.plane.userData = {ignore: true};

    this.scene.add(this.plane);
    this.objects.push(this.plane);
  }

  // 移动事件
  private moveHandle(e: PointerEvent | Touch) {
    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY - 45) / this.height) * 2 + 1;

    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, this.camera as THREE.PerspectiveCamera);

    const intersects = this.raycaster.intersectObjects(this.objects, false);
    if (intersects.length > 0) {
      const intersect = intersects[0];

      // .add ( v : Vector3 ) : this
      // 将传入的向量v和这个向量相加
      this.rollOverMesh.position.copy(intersect.point).add(intersect.face?.normal as THREE.Vector3);
      // .divideScalar ( s : Float ) : this
      // 将该向量除以标量s

      // .floor () : this
      // 向量的分量向下取整为最接近的整数值

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘

      // .addScalar ( s : Float ) : this
      // 将传入的标量s和这个向量的x值、y值以及z值相加
      this.rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
    }
  }

  // 添加事件
  private addHandle(e: PointerEvent | MouseEvent) {
    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY - 45) / this.height) * 2 + 1;

    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, this.camera as THREE.PerspectiveCamera);

    const intersects = this.raycaster.intersectObjects(this.objects, false);
    if (intersects.length > 0) {
      const intersect = intersects[0];

      const box = new THREE.Mesh(this.cubeGeo, this.cubeMaterial);
      // .add ( v : Vector3 ) : this
      // 将传入的向量v和这个向量相加
      box.position.copy(intersect.point).add(intersect.face?.normal as THREE.Vector3);
      // .divideScalar ( s : Float ) : this
      // 将该向量除以标量s

      // .floor () : this
      // 向量的分量向下取整为最接近的整数值

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘

      // .addScalar ( s : Float ) : this
      // 将传入的标量s和这个向量的x值、y值以及z值相加
      box.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

      this.scene.add(box);
      this.objects.push(box);
    }
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.onpointerdown = null;

      this.container.ontouchmove = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const e = event.touches[0];
        this.moveHandle(e);
      };
      this.container.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.addHandle(e);
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onclick = null;

      this.container.onpointermove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.moveHandle(e);
      };
      this.container.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.addHandle(e);
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
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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
      // 绑定事件
      this.bind();

      if (this.camera) {
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

