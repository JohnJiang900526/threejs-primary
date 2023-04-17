import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | TrackballControls
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private pickingTexture: THREE.WebGLRenderTarget
  private pickingScene: THREE.Scene
  private highlightBox: THREE.Mesh
  private pickingData: {
    position: THREE.Vector3
    rotation: THREE.Euler
    scale: THREE.Vector3
  }[]
  private offset: THREE.Vector3
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
    this.pickingScene = new THREE.Scene();
    this.highlightBox = new THREE.Mesh();
    this.pickingData = [];
    this.offset = new THREE.Vector3(10, 10, 10);
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1, 10000);
    this.camera.position.z = 1000;

    // 创建光源
    const light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x555555));

    // 创建几何
    this.createGeometry();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器 轨迹球控制器（TrackballControls）
    // TrackballControls 与 OrbitControls 相类似。然而，它不能恒定保持摄像机的up向量。 
    // 这意味着，如果摄像机绕过“北极”和“南极”，则不会翻转以保持“右侧朝上”
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    // .rotateSpeed : Number 旋转的速度，其默认值为1.0
    this.controls.rotateSpeed = 1.0;
    // .zoomSpeed : Number 缩放的速度，其默认值为1.2
    this.controls.zoomSpeed = 1.2;
    // .panSpeed : Number 平移的速度，其默认值为0.3
    this.controls.panSpeed = 0.8;
    // .noZoom : Boolean 是否禁用缩放，默认为false
    this.controls.noZoom = false;
    // .noPan : Boolean 是否禁用平移，默认为false
    this.controls.noPan = false;
    // .staticMoving : Boolean 阻尼是否被禁用。默认为false
    this.controls.staticMoving = true;
    // .dynamicDampingFactor : Number 
    // 设置阻尼的强度。仅在staticMoving设为false时考虑。默认为0.2
    this.controls.dynamicDampingFactor = 0.3;

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

  // 创建几何
  private createGeometry() {
    // Phong网格材质(MeshPhongMaterial)
    // 一种用于具有镜面高光的光泽表面的材质
    const defaultMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      // 定义材质是否使用平面着色进行渲染。默认值为false
      flatShading: true, 
      // 是否使用顶点着色。默认值为false
      vertexColors: true, 
      // .specular高亮的程度，越高的值越闪亮。默认值为 30
      shininess: 0	
    });
    // 基础网格材质(MeshBasicMaterial)
    // 一个以简单着色（平面或线框）方式来绘制几何体的材质
    // 这种材质不受光照的影响
    const pickingMaterial = new THREE.MeshBasicMaterial({ 
      // 是否使用顶点着色。默认值为false
      vertexColors: true 
    });

    const geometriesDrawn: THREE.BoxGeometry[] = [];
    const geometriesPicking: THREE.BoxGeometry[] = [];

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const color = new THREE.Color();

    for (let i = 0; i < 5000; i++) {
      let geometry = new THREE.BoxGeometry();

      const position = new THREE.Vector3();
      position.x = Math.random() * 10000 - 5000;
      position.y = Math.random() * 6000 - 3000;
      position.z = Math.random() * 8000 - 4000;

      const rotation = new THREE.Euler();
      rotation.x = Math.random() * 2 * Math.PI;
      rotation.y = Math.random() * 2 * Math.PI;
      rotation.z = Math.random() * 2 * Math.PI;

      const scale = new THREE.Vector3();
      scale.x = Math.random() * 200 + 100;
      scale.y = Math.random() * 200 + 100;
      scale.z = Math.random() * 200 + 100;

      quaternion.setFromEuler(rotation);
      // 将该矩阵设置为由平移、旋转和缩放组成的变换
      matrix.compose(position, quaternion, scale);
      geometry.applyMatrix4(matrix);

      this.applyVertexColors(geometry, color.setHex(Math.random() * 0xffffff));
      geometriesDrawn.push(geometry);
      // @ts-ignore
      geometry = geometry.clone();

      this.applyVertexColors(geometry, color.setHex(i));
      geometriesPicking.push(geometry);
      this.pickingData[i] = {position, rotation, scale};
    }

    const objects = new THREE.Mesh(
      BufferGeometryUtils.mergeBufferGeometries(geometriesDrawn), 
      defaultMaterial
    );
    this.scene.add(objects);

    this.pickingScene.add(new THREE.Mesh(
      BufferGeometryUtils.mergeBufferGeometries(geometriesPicking), 
      pickingMaterial
    ));

    this.highlightBox = new THREE.Mesh(
      new THREE.BoxGeometry(),
      // Lambert网格材质(MeshLambertMaterial)
      // 一种非光泽表面的材质，没有镜面高光
      new THREE.MeshLambertMaterial({color: 0xffff00})
    );
    this.scene.add(this.highlightBox);
  }

  // 应用颜色
  private applyVertexColors(geometry: THREE.BoxGeometry, color: THREE.Color) {
    const position = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < position.count; i++) {
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointer.x = e.clientX;
				this.pointer.y = (e.clientY - 45);
      };
    } else {
      this.container.ontouchstart = null;
      this.container.onpointermove = (e) => {
        this.pointer.x = e.clientX;
				this.pointer.y = (e.clientY - 45);
      }
    }
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

    // 执行pick
    this.pick();

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
    }
  }

  private pick() {
    if (this.camera && this.renderer) {
      this.camera.setViewOffset(
        this.renderer.domElement.width, 
        this.renderer.domElement.height, 
        this.pointer.x * window.devicePixelRatio | 0, 
        this.pointer.y * window.devicePixelRatio | 0, 
        1, 1
      );
      this.renderer.setRenderTarget(this.pickingTexture);
      this.renderer.render(this.pickingScene, this.camera);
      this.camera.clearViewOffset();

      const pixelBuffer = new Uint8Array(4);
      // .readRenderTargetPixels (renderTarget : WebGLRenderTarget, x : Float, y : Float, width : Float, height : Float, buffer : TypedArray, activeCubeFaceIndex : Integer ) : undefined
      // 将renderTarget中的像素数据读取到传入的缓冲区中。这是WebGLRenderingContext.readPixels()的包装器
      this.renderer.readRenderTargetPixels(this.pickingTexture, 0, 0, 1, 1, pixelBuffer);
      const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
      const data = this.pickingData[id];

      if (data) {
        this.highlightBox.position.copy(data.position);
        this.highlightBox.rotation.copy(data.rotation);
        this.highlightBox.scale.copy(data.scale).add(this.offset);
        this.highlightBox.visible = true;
      } else {
        this.highlightBox.visible = false;
      }
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

