import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private selection: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private line: null | THREE.Line
  private sprite: null | THREE.Sprite
  private texture: null | THREE.FramebufferTexture
  private cameraOrtho: null | THREE.OrthographicCamera
  private sceneOrtho: null | THREE.Scene
  private offset: number
  private dpr: number
  private textureSize: number
  private vector: THREE.Vector2
  private color: THREE.Color
  constructor(container: HTMLDivElement, selection: HTMLDivElement) {
    this.container = container;
    this.selection = selection;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.line = null;
    this.sprite = null;
    this.texture = null;
    this.cameraOrtho = null;
    this.sceneOrtho = null;
    this.offset = 0;
    this.dpr = window.devicePixelRatio;
    this.textureSize = 128 * this.dpr;
    this.vector = new THREE.Vector2();
    this.color = new THREE.Color();
  }

  // 初始化方法入口
  init() {
    // 创建相机 透视相机（PerspectiveCamera）
    // 这一摄像机使用perspective projection（透视投影）来进行投影。
    // 这一投影模式被用来模拟人眼所看到的景象，它是3D场景的渲染中使用得最普遍的投影模式。
    // PerspectiveCamera( fov : Number, aspect : Number, near : Number, far : Number )
    // fov — 摄像机视锥体垂直视野角度
    // aspect — 摄像机视锥体长宽比
    // near — 摄像机视锥体近端面
    // far — 摄像机视锥体远端面
    // 这些参数一起定义了摄像机的viewing frustum（视锥体）
    this.camera = new THREE.PerspectiveCamera(100, this.width / this.height, 1, 1000);
    this.camera.position.z = 20;

    // 创建正交相机 正交相机（OrthographicCamera）
    // 这一摄像机使用orthographic projection（正交投影）来进行投影
    // 在这种投影模式下，无论物体距离相机距离远或者近，在最终渲染的图片中物体的大小都保持不变。
    // 这对于渲染2D场景或者UI元素是非常有用的。
    // OrthographicCamera( left : Number, right : Number, top : Number, bottom : Number, near : Number, far : Number )
    // left — 摄像机视锥体左侧面
    // right — 摄像机视锥体右侧面
    // top — 摄像机视锥体上侧面
    // bottom — 摄像机视锥体下侧面
    // near — 摄像机视锥体近端面
    // far — 摄像机视锥体远端面
    // 这些参数一起定义了摄像机的viewing frustum（视锥体）
    this.cameraOrtho = new THREE.OrthographicCamera(
      -this.width/2, this.width/2, 
      this.height/2, -this.height/2, 
      1, 10
    );
    this.cameraOrtho.position.z = 10;

    // 创建场景
    this.scene = new THREE.Scene();
    this.sceneOrtho = new THREE.Scene();

    // 创建点 高斯帕曲线
    const points = GeometryUtils.gosper(8);
    const geometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.Float32BufferAttribute(points, 3);
    geometry.setAttribute('position', positionAttribute);
    geometry.center();

    const colorAttribute = new THREE.BufferAttribute(new Float32Array(positionAttribute.array.length), 3);
    colorAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colorAttribute);

    // 基础线条材质（LineBasicMaterial）
    // .vertexColors : Boolean
    // 是否使用顶点着色。默认值为false
    const material = new THREE.LineBasicMaterial({vertexColors: true});
    // 线（Line）Line( geometry : BufferGeometry, material : Material )
    // geometry —— 表示线段的顶点，默认值是一个新的BufferGeometry
    // material —— 线的材质，默认值是一个新的具有随机颜色的LineBasicMaterial
    this.line = new THREE.Line(geometry, material);
    // .scale : Vector3 物体的局部缩放。默认值是Vector3( 1, 1, 1 )。
    // .setScalar ( scalar : Float ) : this
    // 将该向量的x、y和z值同时设置为等于传入的scalar
    this.line.scale.setScalar(0.05);
    this.scene.add(this.line);
    this.updateColors(this.line.geometry.getAttribute("color") as THREE.BufferAttribute);

    // 创建纹理
    // FramebufferTexture This class can only be used in combination with WebGLRenderer.copyFramebufferToTexture().
    // FramebufferTexture( width : Number, height : Number, format : Constant )
    // width -- The width of the texture
    // height -- The height of the texture
    // format -- The format used in the texture. See format constants for other choices
    this.texture = new THREE.FramebufferTexture(this.textureSize, this.textureSize, THREE.RGBAFormat);
    // .minFilter : number
    // 当一个纹素覆盖小于一个像素时，贴图将如何采样。
    // 默认值为THREE.LinearMipmapLinearFilter， 它将使用mipmapping以及三次线性滤镜
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;

    // 创建材质 点精灵材质(SpriteMaterial)
    // .map : Texture
    // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
    const spriteMaterial = new THREE.SpriteMaterial({map: this.texture});
    // 精灵（Sprite）精灵是一个总是面朝着摄像机的平面，通常含有使用一个半透明的纹理
    // 精灵不会投射任何阴影，即使设置了
    this.sprite = new THREE.Sprite(spriteMaterial);
    this.sprite.scale.set(this.textureSize, this.textureSize, 1);
    this.sceneOrtho.add(this.sprite);
    this.updateSpritePosition();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(this.camera, this.selection);
		controls.enablePan = false;

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private updateColors(colorAttribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) {
    const length = colorAttribute.count;

    for (let i = 0; i < length; i ++) {
      const h = ((this.offset + i) % length) / length;
      this.color.setHSL(h, 1, 0.5);
      colorAttribute.setX(i, this.color.r);
      colorAttribute.setY(i, this.color.g);
      colorAttribute.setZ(i, this.color.b);
    }
    colorAttribute.needsUpdate = true;
    this.offset -= 25;
  }

  private updateSpritePosition() {
    const halfX = this.width / 2;
    const halfY = this.height / 2;

    const halfBoxX = this.textureSize / 2;
    const halfBoxY = this.textureSize / 2;

    if (this.sprite) {
      if (this.isMobile()) {
        this.sprite.scale.set(100, 100, 1);
        this.sprite.position.set(-halfX + 50 + 20, halfY - 50 - 20, 1);
      } else {
        this.sprite.position.set(-halfX + halfBoxX, halfY - halfBoxY, 1);
      }
    }
  }

  // 性能统计
  private initStats() {
    this.stats = new Stats();
    // @ts-ignore
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    dom.style.right = "0px";
    dom.style.left = "auto";
    this.container.appendChild(dom);
  }

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer && this.line && this.texture) {
      const colorAttribute = this.line.geometry.getAttribute('color') as THREE.BufferAttribute;
      this.updateColors(colorAttribute);

      // .clear ( color : Boolean, depth : Boolean, stencil : Boolean ) : undefined
      // 告诉渲染器清除颜色、深度或模板缓存. 此方法将颜色缓存初始化为当前颜色。参数们默认都是true
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);

      this.vector.x = (this.width * this.dpr/2) - (this.textureSize/2);
      this.vector.y = (this.height * this.dpr/2) - (this.textureSize/2);

      this.renderer.copyFramebufferToTexture(this.vector, this.texture);
      // .clearDepth ( ) : undefined
      // 清除深度缓存。相当于调用.clear( false, true, false )
      this.renderer.clearDepth();
      if (this.sceneOrtho && this.cameraOrtho) {
        this.renderer.render(this.sceneOrtho, this.cameraOrtho);
      }
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.dpr = window.devicePixelRatio;
      this.textureSize = 128 * this.dpr;
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.cameraOrtho) {
        this.cameraOrtho.left = -this.width / 2;
				this.cameraOrtho.right = this.width / 2;
				this.cameraOrtho.top = this.height / 2;
				this.cameraOrtho.bottom = -this.height / 2;
				this.cameraOrtho.updateProjectionMatrix();
      }

      this.updateSpritePosition();

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

