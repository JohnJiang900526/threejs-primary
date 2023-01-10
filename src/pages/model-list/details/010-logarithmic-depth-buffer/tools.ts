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
    this.zoompos = -100;
    this.zoomspeed = 0.015;
    this.minzoomspeed = 0.015;
    this.mouse = [.5, .5]
  }

  init() {
    // 实例化一个相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1e-6, 1e27);

    // 字体加载器
    const loader = new FontLoader();
    loader.load("/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      // 实例化场景
      this.scene = this.initScene(font);
      this.scene.add(this.camera as THREE.PerspectiveCamera);

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(this.width, this.height);
      this.container.appendChild(this.renderer.domElement);

      this.animate();
      this.resize();
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
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0x222222));

    // 创建一个平行光
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(100, 100, 100);
    scene.add(light);

    // 材质参数
    const materialargs: THREE.MeshPhongMaterialParameters = {color: 0xffffff, specular: 0x050505, shininess: 50, emissive: 0x000000};
    // 创建几何体
    const geometry = new THREE.SphereGeometry(0.5, 24, 12);

    this.labeldata.forEach((item) => {
      const scale = item.scale || 1;
      const labelgeo = new TextGeometry(item.label, { font, size: item.size, height: (item.size / 2) });

      labelgeo.computeBoundingSphere();

      const radius: number = labelgeo.boundingSphere?.radius || 0;
      labelgeo.translate(-radius as number, 0, 0);
      materialargs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);

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
    if (this.stats) {
      this.stats.update();
    }

    if (this.renderer && this.scene && this.camera) {
      const minzoom = this.labeldata[0].size * this.labeldata[0].scale * 1;
      const maxzoom = this.labeldata[this.labeldata.length - 1].size * this.labeldata[ this.labeldata.length - 1 ].scale * 100;
      let damping = ( Math.abs(this.zoomspeed ) > this.minzoomspeed ? 0.95 : 1.0 );
      const zoom = THREE.MathUtils.clamp( Math.pow( Math.E, this.zoompos ), minzoom, maxzoom );
      this.zoompos = Math.log(zoom);

      if (( zoom == minzoom && this.zoomspeed < 0 ) || ( zoom == maxzoom && this.zoomspeed > 0 )) {
        damping = 0.85;
      }
      this.zoompos += this.zoomspeed;
      this.zoomspeed *= damping;

      this.camera.position.x = Math.sin( .5 * Math.PI * ( this.mouse[ 0 ] - .5 ) ) * zoom;
      this.camera.position.y = Math.sin( .25 * Math.PI * ( this.mouse[ 1 ] - .5 ) ) * zoom;
      this.camera.position.z = Math.cos( .5 * Math.PI * ( this.mouse[ 0 ] - .5 ) ) * zoom;

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
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

