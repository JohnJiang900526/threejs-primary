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

    // 创建控制器
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
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
    const pickingMaterial = new THREE.MeshBasicMaterial({ 
      vertexColors: true 
    });
    const defaultMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, flatShading: true, 
      vertexColors: true, shininess: 0	
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
      matrix.compose(position, quaternion, scale);
      geometry.applyMatrix4(matrix);

      this.applyVertexColors(geometry, color.setHex(Math.random() * 0xffffff));
      geometriesDrawn.push(geometry);
      // @ts-ignore
      geometry = geometry.clone();

      this.applyVertexColors(geometry, color.setHex(i));
      geometriesPicking.push(geometry);
      this.pickingData[i] = { position, rotation, scale };
    }

    const objects = new THREE.Mesh(
      BufferGeometryUtils.mergeBufferGeometries(geometriesDrawn), 
      defaultMaterial
    );
    this.scene.add(objects);

    this.pickingScene.add(new THREE.Mesh(
      BufferGeometryUtils.mergeBufferGeometries(geometriesPicking ), 
      pickingMaterial
    ));

    this.highlightBox = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshLambertMaterial({color: 0xffff00})
    );
    this.scene.add( this.highlightBox );
  }

  // 应用颜色
  private applyVertexColors(geometry: THREE.BoxGeometry, color: THREE.Color) {
    const position = geometry.attributes.position;
    const colors = [];
    for ( let i = 0; i < position.count; i ++ ) {
      colors.push( color.r, color.g, color.b );
    }
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
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
      this.renderer.readRenderTargetPixels(this.pickingTexture, 0, 0, 1, 1, pixelBuffer);
      const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
      const data = this.pickingData[id];

      if (data) {
        if (data.position && data.rotation && data.scale) {
          this.highlightBox.position.copy(data.position);
          this.highlightBox.rotation.copy(data.rotation);
          this.highlightBox.scale.copy(data.scale).add(this.offset);
          this.highlightBox.visible = true;
        }
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

