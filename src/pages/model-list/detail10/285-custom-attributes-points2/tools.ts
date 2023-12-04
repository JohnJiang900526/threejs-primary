import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

type ISphereType = THREE.BufferGeometry | THREE.SphereGeometry;
type IBoxType = THREE.BufferGeometry | THREE.BoxGeometry;

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private sphere: THREE.Points;
  private length: number;
  private vertexShader: string;
  private fragmentShader: string;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
    this.sphere = new THREE.Points();
    this.length = 0;
    this.vertexShader = `
      attribute float size;
      attribute vec3 ca;
      varying vec3 vColor;
      void main() {
        vColor = ca;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;

      varying vec3 vColor;
      void main() {
        vec4 color = vec4( color * vColor, 1.0 ) * texture2D( pointTexture, gl_PointCoord );
        gl_FragColor = color;
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 10000);
    this.camera.position.z = 400;

    // 模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建模型
  // 核心逻辑
  private generateModel() {
    const radius = 100, segments = 68, rings = 38;

    let sphereGeometry: ISphereType = new THREE.SphereGeometry(radius, segments, rings);
    let boxGeometry: IBoxType = new THREE.BoxGeometry(0.8 * radius, 0.8 * radius, 0.8 * radius, 10, 10, 10);

    // 如果没有删除法线和uv属性，则mergeVertices()不能将相同的顶点与不同的法线/uv数据合并
    sphereGeometry.deleteAttribute('normal');
    sphereGeometry.deleteAttribute('uv');

    boxGeometry.deleteAttribute('normal');
    boxGeometry.deleteAttribute('uv');

    sphereGeometry = BufferGeometryUtils.mergeVertices(sphereGeometry);
    boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

    const mergeGeometry = BufferGeometryUtils.mergeBufferGeometries([sphereGeometry, boxGeometry]);
    const positionAttr = mergeGeometry.getAttribute('position') as THREE.BufferAttribute;

    const colors: number[] = [];
    const sizes: number[] = [];

    const color = new THREE.Color();
    const vertex = new THREE.Vector3();

    this.length = sphereGeometry.getAttribute('position').count;

    for (let i = 0; i < positionAttr.count; i++) {
      // .fromBufferAttribute ( attribute : BufferAttribute, index : Integer ) : this
      // attribute - 来源的attribute。
      // index - 在attribute中的索引。
      // 从attribute中设置向量的x值、y值和z值
      vertex.fromBufferAttribute(positionAttr, i);
      if (i < this.length) {
        color.setHSL(
          0.01 + 0.1 * (i / this.length), 
          0.99, 
          (vertex.y + radius) / (4 * radius)
        );
      } else {
        color.setHSL(0.6, 0.75, 0.25 + vertex.y / (2 * radius));
      }

      color.toArray(colors, i * 3);
      sizes[i] = i < this.length ? 10 : 40;
    }

    // 位置
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positionAttr);

    // 大小
    const sizeAttr = new THREE.Float32BufferAttribute(sizes, 1);
    geometry.setAttribute('size', sizeAttr);

    // 颜色
    const caAttr = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setAttribute('ca', caAttr);

    // 纹理
    const texture = new THREE.TextureLoader().load('/examples/textures/sprites/disc.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: texture }
      },
      vertexShader: this.vertexShader,
      // 片段着色
      fragmentShader: this.fragmentShader,
    });

    // 点
    this.sphere = new THREE.Points(geometry, material);
    this.scene.add(this.sphere);
  }

  // 设置点
  // 核心逻辑
  private sortPoints() {
    const vector = new THREE.Vector3();

    const matrix = new THREE.Matrix4();
    // .projectionMatrix : Matrix4
    // 这是投影变换矩阵

    // .matrixWorldInverse : Matrix4
    // 这是matrixWorld矩阵的逆矩阵。 MatrixWorld包含了相机的世界变换矩阵
    
    // .multiplyMatrices ( a : Matrix4, b : Matrix4 ) : this
    // 设置当前矩阵为矩阵a x 矩阵b
    matrix.multiplyMatrices(this.camera!.projectionMatrix, this.camera!.matrixWorldInverse);
    // .multiply ( m : Matrix4 ) : this
    // 将当前矩阵乘以矩阵m。
    matrix.multiply(this.sphere.matrixWorld);

    const geometry = this.sphere.geometry;
    const positions = (geometry.getAttribute('position') as THREE.BufferAttribute).array;
    const length = positions.length / 3;

    // .getIndex () : BufferAttribute
    // 返回缓存相关的 .index
    let index = geometry.getIndex();
    if (index === null) {
      const array = new Uint16Array(length);
      for (let i = 0; i < length; i++) { array[i] = i; }

      index = new THREE.BufferAttribute(array, 1);
      // .setIndex ( index : BufferAttribute ) : this
      // 设置缓存相关的 .index
      geometry.setIndex(index);
    }

    const sortArray: number[][] = [];
    for (let i = 0; i < length; i++) {
      vector.fromArray(positions, i * 3);
      vector.applyMatrix4(matrix);
      sortArray.push([vector.z, i]);
    }
    sortArray.sort((a, b) => b[0] - a[0]);

    const indices = index.array as Uint16Array;
    for (let i = 0; i < length; i++) {
      indices[i] = sortArray[i][1];
    }
    geometry.index!.needsUpdate = true;
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
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.005;
      this.sphere.rotation.y = 0.02 * timer;
      this.sphere.rotation.z = 0.02 * timer;

      // size大小设置
      const geometry = this.sphere.geometry;
      const attributes = geometry.attributes;
      const size = attributes.size as THREE.BufferAttribute;
      const array = size.array as Float32Array;

      for (let i = 0; i < array.length; i++) {
        if (i < this.length) {
          array[i] = 16 + 12 * Math.sin(0.1 * i + timer);
        }
      }
      attributes.size.needsUpdate = true;
      this.sortPoints();
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

