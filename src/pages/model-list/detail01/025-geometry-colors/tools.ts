import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private mouseX: number;
  private mouseY: number;
  private halfX: number;
  private halfY: number;
  private shadowMesh: null | THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.halfX = this.width/2;
    this.halfY = this.height/2;
    this.shadowMesh = null;
  }

  // 初始化方法入口
  init() {
    // 创建一个相机
    this.camera = new THREE.PerspectiveCamera(75, this.width/this.height, 1, 10000);
    this.camera.position.z = 1800;

    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 创建一束光
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    this.scene.add(light);

    // 创建阴影
    this.createShadow();
    // 创建几何体
    this.createGeometries();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 添加全局事件
    // 鼠标移动事件
    window.onmousemove = (e) => {
      this.mouseX = e.clientX - this.halfX;
      this.mouseY = e.clientY - this.halfY;
    };
    // 移动端触摸事件
    window.ontouchmove = (event) => {
      const e = event.touches[0];
      this.mouseX = e.clientX - this.halfX;
      this.mouseY = e.clientY - this.halfY;
    };

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 创建阴影
  createShadow() {
    const canvas = document.createElement("canvas");
    const w = 128;
    const h = 128;
    canvas.width = w;
    canvas.height = h;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const gradient = context.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, w, h);

    // 创建纹理
    const shadowTexture = new THREE.CanvasTexture(canvas);
    // 创建材质
    const shadowMaterial = new THREE.MeshBasicMaterial({map: shadowTexture});
    // 创建几何体 平面缓冲几何体（PlaneGeometry）
    const shadowGeometry = new THREE.PlaneGeometry(300, 300, 1, 1);

    // 中间阴影 网格
    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.position.y = -250;
    this.shadowMesh.rotation.x = (-Math.PI/2);
    (this.scene as THREE.Scene).add(this.shadowMesh);

    // 左边阴影 网格
    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.position.x = -400;
    this.shadowMesh.position.y = -250;
    this.shadowMesh.rotation.x = (-Math.PI/2);
    (this.scene as THREE.Scene).add(this.shadowMesh);

    // 右边阴影 网格
    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.position.x = 400;
    this.shadowMesh.position.y = -250;
    this.shadowMesh.rotation.x = (-Math.PI/2);
    (this.scene as THREE.Scene).add(this.shadowMesh);
  }

  // 创建几何体
  createGeometries() {
    const radius = 200;
    // 二十面缓冲几何体（IcosahedronGeometry）一个用于生成二十面体的类
    const geometry1 = new THREE.IcosahedronGeometry(radius, 1);
    const count = geometry1.attributes.position.count;

    geometry1.setAttribute("color", new THREE.BufferAttribute(new Float32Array(radius * 3), 3));

    const geometry2 = geometry1.clone();
    const geometry3 = geometry1.clone();

    const color = new THREE.Color();
    const positions1 = geometry1.attributes.position;
    const positions2 = geometry2.attributes.position;
    const positions3 = geometry3.attributes.position;

    const color1 = geometry1.attributes.color;
    const color2 = geometry2.attributes.color;
    const color3 = geometry3.attributes.color;

    for (let i = 0; i < count; i++) {
      // .setHSL ( h : Float, s : Float, l : Float, colorSpace : string = LinearSRGBColorSpace )
      // h — 色相值处于0到1之间 s — 饱和度值处于0到1之间 l — 亮度值处于0到1之间
      // 采用HLS值设置此颜色
      color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
      // .setXYZ ( index : Integer, x : Float, y : Float, z : Float )
      // 设置给定索引的矢量的第一、二、三维数据（设置 X、Y 和 Z 值）
      color1.setXYZ(i, color.r, color.g, color.b);

      color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5);
			color2.setXYZ(i, color.r, color.g, color.b);

      // .setRGB ( r : Float, g : Float, b : Float, colorSpace : string = LinearSRGBColorSpace )
      // r — 红色通道的值在0到1之间 g — 绿色通道的值在0到1之间 b — 蓝色通道的值在0到1之间
      // 采用RGB值设置此颜色
			color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0);
			color3.setXYZ(i, color.r, color.g, color.b);
    }

    // Phong网格材质(MeshPhongMaterial) 一种用于具有镜面高光的光泽表面的材质
    // .flatShading 定义材质是否使用平面着色进行渲染。默认值为false
    // .vertexColors 是否使用顶点着色。默认值为false
    // .shininess .specular高亮的程度，越高的值越闪亮。默认值为 30
    const material = new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true, vertexColors: true, shininess: 0});
    // 基础网格材质(MeshBasicMaterial) 一个以简单着色（平面或线框）方式来绘制几何体的材质 这种材质不受光照的影响
    // .wireframe 将几何体渲染为线框。默认值为false（即渲染为平面多边形）
    // .transparent 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染
    // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
    const wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true});

    let mesh:THREE.Mesh<THREE.IcosahedronGeometry | THREE.BufferGeometry, THREE.MeshPhongMaterial> = new THREE.Mesh(geometry1, material);
    let wireframe: THREE.Mesh<THREE.IcosahedronGeometry | THREE.BufferGeometry, THREE.MeshBasicMaterial> = new THREE.Mesh(geometry1, wireframeMaterial);

    // 左边的几何体
    mesh.add(wireframe);
    mesh.position.x = -400;
    mesh.rotation.x = -1.87;
    (this.scene as THREE.Scene).add(mesh);

    // 右边的几何体
    mesh = new THREE.Mesh(geometry2, material);
    wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
    mesh.add(wireframe);
    mesh.position.x = 400;
    (this.scene as THREE.Scene).add(mesh);

    // 中间的几何体
    mesh = new THREE.Mesh(geometry3, material);
    wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
    mesh.add(wireframe);
    (this.scene as THREE.Scene).add(mesh);
  }


  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
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

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;

      this.camera.lookAt(this.scene.position);
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      this.halfX = this.width/2;
      this.halfY = this.height/2;

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

