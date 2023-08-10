import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Lut } from 'three/examples/jsm/math/Lut';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private UIScene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private perpCamera: null | THREE.PerspectiveCamera;
  private orthoCamera: null | THREE.OrthographicCamera;
  private lut: null | Lut
  private mesh: null | THREE.Mesh
  private sprite: null | THREE.Sprite
  private params: {
    colorMap: 'rainbow'|'cooltowarm'|'blackbody'|'grayscale'
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.UIScene = null;
    this.renderer = null;
    this.perpCamera = null;
    this.orthoCamera = null;
    this.params = {colorMap: "rainbow"};
    this.lut = new Lut();
    this.mesh = null;
    this.sprite = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color();
    this.UIScene = new THREE.Scene();

    // 创建查询表
    this.lut = new Lut();

    // 创建相机
    // 创建透视相机
    this.perpCamera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 100);
    this.perpCamera.position.set(0, 0, 10);
    this.scene.add(this.perpCamera);
    // 创建正交相机 正交相机（OrthographicCamera）
    // 这一摄像机使用orthographic projection（正交投影）来进行投影
    // 在这种投影模式下，无论物体距离相机距离远或者近，在最终渲染的图片中物体的大小都保持不变
    // 这对于渲染2D场景或者UI元素是非常有用的
    // OrthographicCamera( left : Number, right : Number, top : Number, bottom : Number, near : Number, far : Number )
    // left — 摄像机视锥体左侧面
    // right — 摄像机视锥体右侧面
    // top — 摄像机视锥体上侧面
    // bottom — 摄像机视锥体下侧面
    // near — 摄像机视锥体近端面
    // far — 摄像机视锥体远端面
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2);
    this.orthoCamera.position.set(0.80, 0, 1);

    // 创建精灵 精灵（Sprite）
    // 精灵是一个总是面朝着摄像机的平面，通常含有使用一个半透明的纹理
    // 精灵不会投射任何阴影，即使设置了 castShadow = true 也将不会有任何效果
    // Sprite( material : Material )
    // material - （可选值）是SpriteMaterial的一个实例。 默认值是一个白色的SpriteMaterial
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(this.lut.createCanvas())
    }));
    this.sprite.scale.x = 0.125;
    this.UIScene.add(this.sprite);

    // 创建网格
    // Lambert网格材质(MeshLambertMaterial) 一种非光泽表面的材质，没有镜面高光
    this.mesh = new THREE.Mesh(undefined, new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
      color: 0xF5F5F5,
      // .vertexColors : Boolean 是否使用顶点着色。默认值为false
      vertexColors: true
    }));
    this.scene.add(this.mesh);
    
    // 加载模型
    this.loadModel();

    // 创建光源
    const pointLight = new THREE.PointLight(0xffffff, 1);
    this.perpCamera.add(pointLight);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(this.perpCamera, this.renderer?.domElement);
    controls.addEventListener("change", () => { this.render(); });

    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置颜色
  setColor(colorType: 'rainbow'|'cooltowarm'|'blackbody'|'grayscale') {
    this.params.colorMap = colorType;

    this.updateColors();
    this.render();
  }

  // 加载模型
  private loadModel() {
    const loader = new THREE.BufferGeometryLoader();
    loader.load("/examples/models/json/pressure.json", (geometry) => {
      // 根据边界矩形将几何体居中
      geometry.center();
      // 通过面片法向量的平均值计算每个顶点的法向量
      geometry.computeVertexNormals();

      const colors = [];
      // .count : Integer 保存 array 除以 itemSize 之后的大小
      const count = geometry.attributes.position.count;
      for (let i = 0; i < count; i++) {
        colors.push(1, 1, 1);
      }

      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      (this.mesh as THREE.Mesh).geometry = geometry;

      this.updateColors();
      this.render();
    });
  }

  // 更新颜色
  private updateColors() {
    if (this.lut && this.mesh && this.sprite) {
      this.lut.setColorMap(this.params.colorMap);
      this.lut.setMin(0);
      this.lut.setMax(2000);

      const geometry = this.mesh.geometry;
      const pressures = geometry.attributes.pressure as THREE.BufferAttribute;
      const colors = geometry.attributes.color as THREE.BufferAttribute;

      for ( let i = 0; i < pressures.array.length; i++ ) {
        const colorValue = pressures.array[i];
        const color = this.lut.getColor(colorValue);
        if (!color) {
          console.log('Unable to determine color for value:', colorValue);
        } else {
          colors.setXYZ(i, color.r, color.g, color.b);
        }
      }
      // 该标志位指明当前 attribute 已经被修改过，且需要再次送入 GPU 处理。
      // 当开发者改变了该队列的值，则标志位需要设置为 true
      colors.needsUpdate = true;

      const map = this.sprite.material.map;
      this.lut.updateCanvas((map as THREE.Texture).image);
      // 将其设置为true，以便在下次使用纹理时触发一次更新。 这对于设置包裹模式尤其重要
      (map as THREE.Texture).needsUpdate = true;
    }
  }

  // 渲染方法
  private render() {
    if(this.renderer && this.scene && this.UIScene && this.perpCamera && this.orthoCamera) {
      this.renderer.clear();
      this.renderer.render(this.scene, this.perpCamera);
      this.renderer.render(this.UIScene, this.orthoCamera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.perpCamera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.perpCamera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.perpCamera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }

      this.render();
    };
  }
}

export default THREE;

