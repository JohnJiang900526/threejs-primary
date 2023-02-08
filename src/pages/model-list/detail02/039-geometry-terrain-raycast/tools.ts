import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats
  private mesh: THREE.Mesh
  private texture: THREE.Texture
  private worldWidth: number
  private worldDepth: number
  private worldHalfWidth: number
  private worldHalfDepth: number
  private helper: THREE.Mesh
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.mesh = new THREE.Mesh();
    this.texture = new THREE.Texture();
    this.worldWidth = 256;
    this.worldDepth = 256;
    this.worldHalfWidth = this.worldWidth/2;
    this.worldHalfDepth = this.worldDepth/2;
    this.helper = new THREE.Mesh();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfd1e5);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 10, 20000);
    this.camera.position.set(2000, 2504, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 1000;
    this.controls.maxDistance = 10000;
    // .maxPolarAngle : Float 够垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI
    this.controls.maxPolarAngle = (Math.PI / 2);

    // 创建helper
    const geometryHelper = new THREE.ConeGeometry(100, 500, 3);
    // .translate ( x : Float, y : Float, z : Float ) : this
    // 移动几何体。该操作一般在一次处理中完成，不会循环处理。典型的用法是通过调用 Object3D.rotation 实时旋转几何体
    geometryHelper.translate(0, 50, 0);
    // .rotateX ( radians : Float ) : this
    // 在 X 轴上旋转几何体。该操作一般在一次处理中完成，不会循环处理。典型的用法是通过调用 Object3D.rotation 实时旋转几何体
    geometryHelper.rotateX(Math.PI / 2);
    this.helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
    this.scene.add(this.helper);

    // 创建几何
    this.createGeometry();
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

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (e) => {
        this.onPointerMove(e.touches[0]);
      }
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        this.onPointerMove(e);
      }
    }
  }

  // 创建几何
  private createGeometry() {
    const data = this.generateHeight(this.worldWidth, this.worldDepth);

    if (this.controls && this.camera) {
      this.controls.target.y = data[this.worldHalfWidth + this.worldHalfDepth * this.worldWidth] + 500;
      this.camera.position.y = this.controls.target.y + 2000;
      this.camera.position.x = 2000;
      this.controls.update();
    }

    const geometry = new THREE.PlaneGeometry(7500, 7500, this.worldWidth - 1, this.worldDepth - 1);
    geometry.rotateX(-Math.PI / 2);
    const vertices = geometry.attributes.position.array;
    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
      // @ts-ignore
      vertices[j + 1] = data[i] * 10;
    }

    this.texture = new THREE.CanvasTexture(this.generateTexture(data, this.worldWidth, this.worldDepth));
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: this.texture }));
    this.scene.add(this.mesh);
  }

  // 创建几何高度 核心算法
  private generateHeight(width: number, height: number) {
    const size = width * height;
    const data = new Uint8Array(size);
    const perlin = new ImprovedNoise();
    const z = Math.random() * 100;

    let quality = 1;
    for (let j = 0; j < 4; j ++) {
      for (let i = 0; i < size; i ++) {
        const x = i % width;
        const y = ~~(i / width);
        data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
      }
      quality *= 5;
    }

    return data;
  }

  // 创建材质信息 核心算法
  private generateTexture(data: Uint8Array, width: number, height: number) {
    let context: CanvasRenderingContext2D;
    let image: ImageData;
    let imageData: Uint8ClampedArray;
    let shade: number;

    const vector3 = new THREE.Vector3(0, 0, 0);
    const sun = new THREE.Vector3(1, 1, 1).normalize();

    const canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0; i < imageData.length; i += 4, j++) {
      vector3.x = data[j - 2] - data[j + 2];
      vector3.y = 2;
      vector3.z = data[j - width * 2] - data[j + width * 2];
      // 将该向量转换为单位向量（unit vector）， 
      // 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1
      vector3.normalize();
      // .dot ( v : Vector3 ) : Float 计算该vector和所传入v的点积
      shade = vector3.dot(sun);
      imageData[i] = (96 + shade * 128) * (0.5 + data[ j ] * 0.007);
      imageData[i + 1] = (32 + shade * 96) * (0.5 + data[ j ] * 0.007);
      imageData[i + 2] = (shade * 96) * (0.5 + data[ j ] * 0.007);
    }
    // putImageData() 方法将图像数据（从指定的 ImageData 对象）放回画布上
    context.putImageData(image, 0, 0);

    const canvasScaled = document.createElement( 'canvas' );
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext('2d') as CanvasRenderingContext2D;
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    for ( let i = 0; i < imageData.length; i += 4 ) {
      const v = ~~(Math.random() * 5);
      imageData[i] += v;
      imageData[i + 1] += v;
      imageData[i + 2] += v;
    }
    // putImageData() 方法将图像数据（从指定的 ImageData 对象）放回画布上
    context.putImageData(image, 0, 0);
    return canvasScaled;
  }

  // 移动事件 触摸事件&手指移动事件
  private onPointerMove(e: Touch | PointerEvent) {
    if (this.renderer && this.camera) {
      this.pointer.x = (e.clientX / this.width) * 2 - 1;
      this.pointer.y = (-((e.clientY - 45) / this.height) * 2 + 1);
      // .setFromCamera ( coords : Vector2, camera : Camera ) : undefined
      // coords —— 在标准化设备坐标中鼠标的二维坐标 —— X分量与Y分量应当在-1到1之间
      // camera —— 射线所来源的摄像机
      // 使用一个新的原点和方向来更新射线
      this.raycaster.setFromCamera(this.pointer, this.camera);
    }

    const intersects = this.raycaster.intersectObject(this.mesh);
    if (intersects.length > 0) {
      this.helper.position.set(0, 0, 0);
      if (intersects[0] && intersects[0].face) {
        this.helper.lookAt(intersects[0].face.normal );
        this.helper.position.copy(intersects[0].point);
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

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
      this.bind();

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.controls) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

