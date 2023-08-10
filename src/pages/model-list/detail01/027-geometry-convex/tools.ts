import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private group: THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.group = new THREE.Group();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(new THREE.AmbientLight(0x222222));
    // AxesHelper 用于简单模拟3个坐标轴的对象
    // 红色代表 X 轴. 绿色代表 Y 轴. 蓝色代表 Z 轴
    this.scene.add(new THREE.AxesHelper(20));
    // 把分组添加到场景中 非常重要的一步否则不显示
    this.scene.add(this.group);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 1, 1000);
    this.camera.position.set(15, 20, 30);
    this.camera.add(new THREE.PointLight(0xffffff, 1));
    this.scene.add(this.camera);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.minDistance = 20;
    controls.maxDistance = 50;
    // .maxPolarAngle : Float 能够垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI
    controls.maxPolarAngle = Math.PI / 2;

    // 创建点和凸面
    this.createPointAndVertex();

    // 执行动画
    this.animate();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }

  // 创建点和凸面 核心
  private createPointAndVertex() {
    // 创建纹理
    const loader = new THREE.TextureLoader();
    const texture = loader.load('/examples/textures/sprites/disc.png');
    // 点材质(PointsMaterial) Points使用的默认材质
    // .color : Color 材质的颜色(Color)，默认值为白色 (0xffffff)
    // .map : Texture 使用来自Texture的数据设置点的颜色。可以选择包括一个alpha通道，通常与 .transparent或.alphaTest
    // .size : Number 设置点的大小。默认值为1.0
    // .alphaTest : Float 设置运行alphaTest时要使用的alpha值。如果不透明度低于此值，则不会渲染材质。默认值为0
    const pointsMaterial = new THREE.PointsMaterial({color: 0x0080ff, map: texture, size: 1,alphaTest: 0.5});

    // 创建点
    // 十二面缓冲几何体（DodecahedronGeometry）一个用于创建十二面几何体的类
    // DodecahedronGeometry(radius : Float, detail : Integer)
    // radius — 十二面体的半径，默认值为1
    // detail — 默认值为0。将这个值设为一个大于0的数将会为它增加一些顶点，使其不再是一个十二面体
    const baseDodecahedronGeometry = new THREE.DodecahedronGeometry(10);
    // 删除指定的属性值
    baseDodecahedronGeometry.deleteAttribute('normal');
    baseDodecahedronGeometry.deleteAttribute('uv');

    // .mergeVertices ( geometry : BufferGeometry, tolerance : Number ) : BufferGeometry
    // geometry -- 用于合并顶点的 BufferGeometry 实例
    // tolerance -- 要合并的顶点属性之间允许的最大差异。 默认为 1e-4
    // 返回一个新的 BufferGeometry ，其中包含将所有（在容差范围内的）具有相似属性的顶点合并而成的顶点
    const dodecahedronGeometry = BufferGeometryUtils.mergeVertices(baseDodecahedronGeometry);
    const vertices = [];
    const positionAttribute = dodecahedronGeometry.getAttribute('position') as THREE.BufferAttribute;
    for ( let i = 0; i < positionAttribute.count; i++) {
      const vertex = new THREE.Vector3();
      // .fromBufferAttribute ( attribute : BufferAttribute, index : Integer ) : this
      // attribute - 来源的attribute
      // index - 在attribute中的索引
      // 从attribute中设置向量的x值、y值和z值
      vertex.fromBufferAttribute(positionAttribute, i);
      vertices.push(vertex);
    }
    // .setFromPoints ( points : Array ) : this
    // 通过点队列设置该 BufferGeometry 的 attribute
    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.group.add(points);

    // 创建凸壳
    // Lambert网格材质(MeshLambertMaterial) 一种非光泽表面的材质，没有镜面高光
    // .transparent : Boolean 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染
    // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
    const meshMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, opacity: 0.5, transparent: true});
    // 凸包几何体（ConvexGeometry）
    // ConvexGeometry 可被用于为传入的一组点生成凸包。 该任务的平均时间复杂度被认为是O(nlog(n))
    const meshGeometry = new ConvexGeometry(vertices);

    // 背面
    const backMesh = new THREE.Mesh(meshGeometry, meshMaterial);
    backMesh.material.side = THREE.BackSide;
    backMesh.renderOrder = 0;
    this.group.add(backMesh);

    // 前面
    const frontMesh = new THREE.Mesh(meshGeometry, meshMaterial.clone());
    frontMesh.material.side = THREE.FrontSide; // front faces
    frontMesh.renderOrder = 1;
    this.group.add(frontMesh);
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 集合分组
    if (this.group) {
      this.group.rotation.y += 0.005;
    }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

