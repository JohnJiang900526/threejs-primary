import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

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
  private object: THREE.Points;
  private vertices1: number;
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
    this.object = new THREE.Points();
    this.vertices1 = 0;
    this.vertexShader = `
      attribute float size;
      attribute vec4 ca;

      varying vec4 vColor;
      void main() {
        vColor = ca;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 150.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;

      varying vec4 vColor;
      void main() {
        vec4 outColor = texture2D( pointTexture, gl_PointCoord );
        if ( outColor.a < 0.5 ) discard;

        gl_FragColor = outColor * vec4( color * vColor.xyz, 1.0 );

        float depth = gl_FragCoord.z / gl_FragCoord.w;
        const vec3 fogColor = vec3( 0.0 );

        float fogFactor = smoothstep( 200.0, 600.0, depth );
        gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 10000);
    this.camera.position.z = 500;

    // 创建模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
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

  // 创建模型 核心逻辑 难以理解
  private generateModel() {
    let radius = 100;
    const inner = 0.6 * radius;
    // 顶点
    const vertex = new THREE.Vector3();
    const vertices: number[] = [];

    for (let i = 0; i < 100000; i++) {
      vertex.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      );
      vertex.multiplyScalar(radius);

      const outX = (vertex.x > inner || vertex.x < -inner);
      const outY = (vertex.y > inner || vertex.y < -inner);
      const outZ = (vertex.z > inner || vertex.z < -inner);

      const out = (outX || outY || outZ);
      if (out) {
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    this.vertices1 = vertices.length / 3;
    radius = 200;
    
    let box1: IBoxType = new THREE.BoxGeometry(radius, 0.1 * radius, 0.1 * radius, 50, 5, 5);
    // 如果没有删除法线和uv属性，则mergeVertices()不能合并具有不同法线/uv数据的相同顶点
    box1.deleteAttribute('normal');
    box1.deleteAttribute('uv');
    box1 = BufferGeometryUtils.mergeVertices(box1);
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    
    function addGeo(geometry: IBoxType, x: number, y: number, z: number, ry: number) {
      position.set(x, y, z);
      rotation.set(0, ry, 0);

      // .compose ( position : Vector3, quaternion : Quaternion, scale : Vector3 ) : this
      // 设置将该对象位置 position，四元数quaternion 和 缩放scale 组合变换的矩阵
      matrix.compose(position, quaternion.setFromEuler(rotation), scale);
      const positionAtt = geometry.getAttribute('position') as THREE.BufferAttribute;
      for (var i = 0; i < positionAtt.count; i++) {
        // .fromBufferAttribute ( attribute : BufferAttribute, index : Integer ) : this
        // attribute - 来源的attribute。
        // index - 在attribute中的索引。
        // 从attribute中设置向量的x值、y值和z值。
        vertex.fromBufferAttribute(positionAtt, i);
        // .applyMatrix4 ( m : Matrix4 ) : this
        // 将该向量乘以四阶矩阵m（第四个维度隐式地为1），并按角度进行划分。
        vertex.applyMatrix4(matrix);
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    // 边1
    addGeo(box1, 0, 110, 110, 0);
    addGeo(box1, 0, 110, -110, 0);
    addGeo(box1, 0, -110, 110, 0);
    addGeo(box1, 0, -110, -110, 0);

    //边 2
    addGeo(box1, 110, 110, 0, Math.PI / 2);
    addGeo(box1, 110, -110, 0, Math.PI / 2);
    addGeo(box1, -110, 110, 0, Math.PI / 2);
    addGeo(box1, -110, -110, 0, Math.PI / 2);

    // 角边
    let box2: IBoxType = new THREE.BoxGeometry(0.1 * radius, radius * 1.2, 0.1 * radius, 5, 60, 5);
    box2.deleteAttribute('normal');
    box2.deleteAttribute('uv');
    box2 = BufferGeometryUtils.mergeVertices(box2);

    addGeo(box2, 110, 0, 110, 0);
    addGeo(box2, 110, 0, -110, 0);
    addGeo(box2, -110, 0, 110, 0);
    addGeo(box2, -110, 0, -110, 0);

    const positionAttr = new THREE.Float32BufferAttribute(vertices, 3);
    const colors: number[] = [];
    const sizes: number[] = [];
    const color = new THREE.Color();

    for (let i = 0; i < positionAttr.count; i++) {
      if (i < this.vertices1) {
        color.setHSL(0.5 + 0.2 * (i / this.vertices1), 1, 0.5);
      } else {
        color.setHSL(0.1, 1, 0.5);
      }

      color.toArray(colors, i * 3);
      sizes[i] = i < this.vertices1 ? 10 : 40;
    }

    const geometry = new THREE.BufferGeometry();
    // 位置
    geometry.setAttribute('position', positionAttr);

    // 颜色
    const caAttr = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setAttribute('ca', caAttr);

    // 大小
    const sizeAttr = new THREE.Float32BufferAttribute(sizes, 1);
    geometry.setAttribute('size', sizeAttr);

    // 纹理
    const texture = new THREE.TextureLoader().load('/examples/textures/sprites/ball.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // 材质
    const material = new THREE.ShaderMaterial({
      uniforms: {
        amplitude: { value: 1.0 },
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: texture }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    this.object = new THREE.Points(geometry, material);
    this.scene.add(this.object);
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
      const timer = Date.now() * 0.01;
      // 控制旋转
      this.object.rotation.y = 0.02 * timer;
      this.object.rotation.z = 0.02 * timer;

      // 控制size改变
      const geometry = this.object.geometry;
      const attributes = geometry.attributes;
      const size = attributes.size as THREE.BufferAttribute;
      const array = size.array as Float32Array;
      for (let i = 0; i < array.length; i++) {
        if (i < this.vertices1) {
          array[i] = Math.max(0, 26 + 32 * Math.sin(0.1 * i + 0.6 * timer));
        }
      }
      attributes.size.needsUpdate = true;
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

