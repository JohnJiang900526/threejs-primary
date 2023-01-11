import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private labeldata: {size: number, scale: number, label: string}[]
  private zoompos: number
  private zoomspeed: number
  private minzoomspeed: number
  private mouse: number[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.labeldata = [
      {size: .01, scale: 0.1, label: 'minuscule (1mm)'},
      {size: .01, scale: 1.0, label: 'tiny (1cm)'},
      {size: 1, scale: 1.0, label: 'child-sized (1m)'},
      {size: 10, scale: 1.0, label: 'tree-sized (10m)'},
      {size: 100, scale: 1.0, label: 'building-sized (100m)'},
      {size: 1000, scale: 1.0, label: 'medium (1km)'},
      {size: 10000, scale: 1.0, label: 'city-sized (10km)'},
      {size: 3400000, scale: 1.0, label: 'moon-sized (3,400 Km)'},
      {size: 12000000, scale: 1.0, label: 'planet-sized (12,000 km)'},
      {size: 1400000000, scale: 1.0, label: 'sun-sized (1,400,000 km)'},
      {size: 7.47e12, scale: 1.0, label: 'solar system-sized (50Au)'},
      {size: 9.4605284e15, scale: 1.0, label: 'gargantuan (1 light year)'},
      {size: 3.08567758e16, scale: 1.0, label: 'ludicrous (1 parsec)'},
      {size: 1e19, scale: 1.0, label: 'mind boggling (1000 light years)'}
    ];
    // 缩放位置
    this.zoompos = -100;
    // 缩放速度
    this.zoomspeed = 0.015;
    // 最小缩放速度
    this.minzoomspeed = 0.015;
    // 鼠标的位置 默认中心位置
    this.mouse = [0.5, 0.5];
  }

  init() {
    // 实例化一个相机
    // PerspectiveCamera( fov : Number, aspect : Number, near : Number, far : Number )
    // fov: 相机是视锥体垂直视野角度
    // aspect: 相机视锥体长宽比
    // near: 相机视锥体近端面
    // far: 相机视锥体远端面
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1e-6, 1e27);

    // 字体加载器
    const loader = new FontLoader();
    loader.load("/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      // 实例化场景
      this.scene = this.initScene(font);
      // 向场景中添加相机
      this.scene.add(this.camera as THREE.PerspectiveCamera);

      // 创建渲染器
      // antialias - 是否执行抗锯齿。默认为false
      // logarithmicDepthBuffer - 是否使用对数深度缓存。如果要在单个场景中处理巨大的比例差异，就有必要使用
      this.renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
      // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
      this.renderer.setPixelRatio(window.devicePixelRatio);
      // 将输出canvas的大小调整为(width, height)并考虑设备像素比，
      // 且将视口从(0, 0)开始调整到适合大小 将updateStyle设置为false以阻止对canvas的样式做任何改变
      this.renderer.setSize(this.width, this.height);
      this.container.appendChild(this.renderer.domElement);

      this.animate();
      this.resize();
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% 进度加载');
    }, (e) => {
      console.error(e);
    });

    // 滚轮事件
    window.onwheel = (e) => {
      const amount = e.deltaY;
      const dir = amount / Math.abs(amount);
      
      if (amount === 0) {  return false; }
      this.zoomspeed = dir / 10;
      this.minzoomspeed = 0.001;
    };

    // 鼠标移动事件
    window.onmousemove = (e) => {
      this.mouse[0] = e.clientX / window.innerWidth;
			this.mouse[1] = e.clientY / window.innerHeight;
    };

    // 屏幕触摸事件
    window.ontouchmove = (e) => {
      if (e.touches.length === 0) { return false; }
      this.mouse[0] = e.touches[0].clientX / window.innerWidth;
			this.mouse[1] = e.touches[0].clientY / window.innerHeight;
    };

    // 初始化性能统计
    this.initStats();

    // 动画执行
    this.animate();
  }

  // 初始化场景
  initScene(font: Font) {
    // 实例化一个场景
    // 场景能够让你在什么地方、摆放什么东西来交给three.js来渲染，这是你放置物体、灯光和摄像机的地方
    const scene = new THREE.Scene();
    // 添加环境光
    // 环境光会均匀的照亮场景中的所有物体
    // 环境光不能用来投射阴影，因为它没有方向
    // AmbientLight( color : Integer, intensity : Float )
    // color: (参数可选）颜色的rgb数值。缺省值为 0xffffff
    // intensity: (参数可选)光照的强度。缺省值为 1
    scene.add(new THREE.AmbientLight(0x222222));

    // 创建一个平行光 平行光（DirectionalLight）
    // 平行光是沿着特定方向发射的光。这种光的表现像是无限远,从它发出的光线都是平行的
    // 常常用平行光来模拟太阳光 的效果; 太阳足够远，因此我们可以认为太阳的位置是无限远
    // 所以我们认为从太阳发出的光线也都是平行的
    // DirectionalLight( color : Integer, intensity : Float )
    // color: (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)
    // intensity: (可选参数) 光照的强度。缺省值为1
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 100, 100);
    scene.add(light);

    // 材质参数
    const materialargs: THREE.MeshPhongMaterialParameters = {color: 0xffffff, specular: 0x050505, shininess: 50, emissive: 0x000000};
    // 创建几何体 球缓冲几何体（SphereGeometry）
    // 
    const geometry = new THREE.SphereGeometry(0.5, 24, 12);

    this.labeldata.forEach((item) => {
      const scale = item.scale || 1;
      // 文本缓冲几何体（TextGeometry）
      const labelgeo = new TextGeometry(item.label, { font, size: item.size, height: (item.size / 2) });
      // 计算当前几何体的的边界球形，该操作会更新已有 [param:.boundingSphere]
      // 边界球形不会默认计算，需要调用该接口指定计算边界球形，否则保持默认值 null
      labelgeo.computeBoundingSphere();

      const radius: number = labelgeo.boundingSphere?.radius || 0;
      // 移动几何体。该操作一般在一次处理中完成，不会循环处理
      labelgeo.translate(-radius as number, 0, 0);
      // .setHSL ( h : Float, s : Float, l : Float, colorSpace : string = LinearSRGBColorSpace )
      // h 色相值处于0到1之间
      // s 饱和度值处于0到1之间
      // l 亮度值处于0到1之间
      materialargs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);

      // Phong网格材质(MeshPhongMaterial)
      // 一种用于具有镜面高光的光泽表面的材质
      const material = new THREE.MeshPhongMaterial(materialargs);

      // 创建一个分组
      const group = new THREE.Group();
      group.position.z = (-item.size * scale);
      scene.add(group);

      // 创建字体网格
      const textmesh = new THREE.Mesh(labelgeo, material);
      textmesh.scale.set(scale, scale, scale);
      textmesh.position.z = (-item.size * scale);
      textmesh.position.y = (item.size / 4 * scale);
      group.add(textmesh);

      // 创建点网格
      const dotmeth = new THREE.Mesh(geometry, material);
      dotmeth.position.y = (item.size / 4 * scale);
      // 将该向量与所传入的标量s进行相乘
      dotmeth.scale.multiplyScalar(item.size * scale);
      group.add(dotmeth);
    });

    return scene;
  }

  // 性能统计
  initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });
    
    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.renderer && this.scene && this.camera) {
      const minzoom = this.labeldata[0].size * this.labeldata[0].scale * 1;
      const maxzoom = this.labeldata[this.labeldata.length - 1].size * this.labeldata[ this.labeldata.length - 1 ].scale * 100;
      // 阻尼
      let damping = (Math.abs(this.zoomspeed) > this.minzoomspeed ? 0.95 : 1.0 );
      // clamp ( value : Float, min : Float, max : Float ) : Float
      // 限制数值value处于最小值min和最大值max之间
      const zoom = THREE.MathUtils.clamp(Math.pow(Math.E, this.zoompos), minzoom, maxzoom);
      this.zoompos = Math.log(zoom);

      const isDamping = ((zoom == minzoom && this.zoomspeed < 0) || (zoom == maxzoom && this.zoomspeed > 0));
      if (isDamping) { damping = 0.85; }

      this.zoompos += this.zoomspeed;
      this.zoomspeed *= damping;

      this.camera.position.x = Math.sin(0.50 * Math.PI * ( this.mouse[0] - 0.5)) * zoom;
      this.camera.position.y = Math.sin(0.25 * Math.PI * ( this.mouse[1] - 0.5)) * zoom;
      this.camera.position.z = Math.cos(0.50 * Math.PI * ( this.mouse[0] - 0.5)) * zoom;
      this.camera.lookAt(this.scene.position);
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width/this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
        this.camera.setViewOffset(this.width, this.height, this.width, 0, this.width, this.height);
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

