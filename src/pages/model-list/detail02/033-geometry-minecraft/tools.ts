import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | FirstPersonControls
  private worldWidth: number
  private worldDepth: number
  private worldHalfWidth: number
  private worldHalfDepth: number
  private stats: null | Stats
  private clock: THREE.Clock
  private data: number[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.worldWidth = 128;
    this.worldDepth = 128;
    this.worldHalfWidth = this.worldWidth/2;
    this.worldHalfDepth = this.worldDepth/2;
    this.stats = null;
    this.clock = new THREE.Clock();
    this.data = this.generateHeight(this.worldWidth, this.worldDepth);
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfd1e5);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1, 20000);
    this.camera.position.y = this.getY(this.worldHalfWidth, this.worldHalfDepth ) * 100 + 100;

    // 创建光源
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(1, 1, 0.5).normalize();
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xcccccc));

    // 创建几何体
    this.createGeometries();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器 第一人称控制器（FirstPersonControls）该类是 FlyControls 的另一个实现
    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    // 移动速度。默认为1
    this.controls.movementSpeed = 10;
    // 环视速度。默认为0.005
    this.controls.lookSpeed = 0.125;
    // 是否能够垂直环视。默认为true
    this.controls.lookVertical = true;
    // 摄像机是否自动向前移动。默认为false
    this.controls.autoForward = true;

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

  // 创建几何体 核心算法
  private createGeometries() {
    // 四维矩阵（Matrix4）表示为一个 4x4 matrix.
    // 在3D计算机图形学中，4x4矩阵最常用的用法是作为一个变换矩阵Transformation Matrix
    const matrix = new THREE.Matrix4();

    // 平面缓冲几何体（PlaneGeometry）一个用于生成平面几何体的类
    // PlaneGeometry(width : Float, height : Float, widthSegments : Integer, heightSegments : Integer)
    // width — 平面沿着X轴的宽度。默认值是1
    // height — 平面沿着Y轴的高度。默认值是1
    // widthSegments — （可选）平面的宽度分段数，默认值是1
    // heightSegments — （可选）平面的高度分段数，默认值是1
    const pxGeometry = new THREE.PlaneGeometry(100, 100);
    // @ts-ignore
    pxGeometry.attributes.uv.array[1] = 0.5;
    // @ts-ignore
    pxGeometry.attributes.uv.array[3] = 0.5;
    // .rotateY ( radians : Float ) : this
    // 在 Y 轴上旋转几何体。该操作一般在一次处理中完成，不会循环处理。
    // 典型的用法是通过调用 Object3D.rotation 实时旋转几何体
    pxGeometry.rotateY(Math.PI / 2);
    pxGeometry.translate(50, 0, 0);

    const nxGeometry = new THREE.PlaneGeometry(100, 100);
    // @ts-ignore
    nxGeometry.attributes.uv.array[1] = 0.5;
    // @ts-ignore
    nxGeometry.attributes.uv.array[3] = 0.5;
    nxGeometry.rotateY(-Math.PI / 2);
    nxGeometry.translate(-50, 0, 0);

    const pyGeometry = new THREE.PlaneGeometry(100, 100);
    // @ts-ignore
    pyGeometry.attributes.uv.array[5] = 0.5;
    // @ts-ignore
    pyGeometry.attributes.uv.array[7] = 0.5;
    pyGeometry.rotateX(-Math.PI / 2);
    pyGeometry.translate(0, 50, 0);

    const pzGeometry = new THREE.PlaneGeometry(100, 100);
    // @ts-ignore
    pzGeometry.attributes.uv.array[1] = 0.5;
    // @ts-ignore
    pzGeometry.attributes.uv.array[3] = 0.5;
    pzGeometry.translate(0, 0, 50);

    const nzGeometry = new THREE.PlaneGeometry(100, 100);
    // @ts-ignore
    nzGeometry.attributes.uv.array[1] = 0.5;
    // @ts-ignore
    nzGeometry.attributes.uv.array[3] = 0.5;
    nzGeometry.rotateY(Math.PI);
    nzGeometry.translate(0, 0, -50);

    const geometries: THREE.BufferGeometry[] = [];
    for (let z = 0; z < this.worldDepth; z++) {
      for (let x = 0; x < this.worldWidth; x++) {
        const h = this.getY(x, z);
        matrix.makeTranslation(
          x * 100 - this.worldHalfWidth * 100,
          h * 100,
          z * 100 - this.worldHalfDepth * 100
        );

        const px = this.getY(x + 1, z);
        const nx = this.getY(x - 1, z);
        const pz = this.getY(x, z + 1);
        const nz = this.getY(x, z - 1);

        geometries.push(pyGeometry.clone().applyMatrix4(matrix));
        if ((px !== h && px !== h + 1) || x === 0) {
          geometries.push(pxGeometry.clone().applyMatrix4(matrix));
        }
        if ((nx !== h && nx !== h + 1) || x === this.worldWidth - 1) {
          geometries.push(nxGeometry.clone().applyMatrix4(matrix));
        }
        if ((pz !== h && pz !== h + 1) || z === this.worldDepth - 1) {
          geometries.push(pzGeometry.clone().applyMatrix4(matrix));
        }
        if ((nz !== h && nz !== h + 1) || z === 0) {
          geometries.push(nzGeometry.clone().applyMatrix4(matrix));
        }
      }
    }

    // .mergeBufferGeometries ( geometries : Array, useGroups : Boolean ) : BufferGeometry
    // geometries -- 由 BufferGeometry 实例的数组
    // useGroups -- 是否要为了合并几何体而产生组
    // 将一组几何体合并到一个实例中。所有几何体都必须兼容该属性。 如果合并不成功，则该方法返回 null
    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    // .computeBoundingSphere () : undefined
    // 计算当前几何体的的边界球形，该操作会更新已有 [param:.boundingSphere]。
    // 边界球形不会默认计算，需要调用该接口指定计算边界球形，否则保持默认值 null
    geometry.computeBoundingSphere();

    const texture = new THREE.TextureLoader().load('/examples/textures/minecraft/atlas.png');
    // .magFilter : number
    // 当一个纹素覆盖大于一个像素时，贴图将如何采样
    // 默认值为THREE.LinearFilter， 它将获取四个最接近的纹素，并在他们之间进行双线性插值
    // 另一个选项是THREE.NearestFilter，它将使用最接近的纹素的值
    texture.magFilter = THREE.NearestFilter;
    const material = new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide});

    const mesh = new THREE.Mesh(geometry, material);
    (this.scene as THREE.Scene).add(mesh);
  }

  private getY(x: number, z: number) {
    return (this.data[x + z * this.worldWidth] * 0.15) | 0;
  }

  private generateHeight(width: number, height: number) {
    const data: number[] = [];
    // 柏林噪声算法
    const perlin = new ImprovedNoise();
    const size = width * height;
    const z = Math.random() * 100;
    let quality = 2;
    for (let j = 0; j < 4; j++) {
      if (j === 0) {
        for (let i = 0; i < size; i++) { data[i] = 0; }
      }

      for (let i = 0; i < size; i++) {
        const x = i % width;
        const y = (i / width) | 0;
        data[i] += perlin.noise(x / quality, y / quality, z) * quality;
      }
      quality *= 4;
    }
    return data;
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.controls) {
      this.controls.update(this.clock.getDelta());
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

      if (this.controls) { this.controls.handleResize(); }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

