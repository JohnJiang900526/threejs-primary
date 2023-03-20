import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import { GUI } from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader';
import { VTKLoader } from 'three/examples/jsm/loaders/VTKLoader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | TrackballControls
  private stats: null | Stats;
  private gui: GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 0.01, 1e10);
    this.camera.position.z = 400;
    this.scene.add(this.camera);

    this.loadModel();
    this.createLight();

    // 渲染器
    this.createRenderer();

    // 控制器 轨迹球控制器（TrackballControls）
    // TrackballControls 与 OrbitControls 相类似。然而，它不能恒定保持摄像机的up向量。 
    // 这意味着，如果摄像机绕过“北极”和“南极”，则不会翻转以保持“右侧朝上”
    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, -100, 0);
    this.controls.minDistance = 100;
    this.controls.maxDistance = 500;
    this.controls.rotateSpeed = 5.0;
    this.controls.zoomSpeed = 5.0;
    this.controls.panSpeed = 2.0;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建光源
  private createLight() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(200, 200, 200);

    this.scene.add(light1, light2);
  }

  // 加载模型
  private loadModel() {
    (() => {
      const loader = new NRRDLoader();
      const url = "/examples/models/nrrd/I.nrrd";
      const toast = showLoadingToast({
        duration: 10000,
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      loader.load(url, (volume) => {
        toast.close();

        const { xLength:x, yLength:y, zLength:z } = volume;
        const geometry = new THREE.BoxGeometry(x, y, z);
        // 基础网格材质(MeshBasicMaterial)
        // 一个以简单着色（平面或线框）方式来绘制几何体的材质。这种材质不受光照的影响
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x00ff00, visible: false
        });

        const cube = new THREE.Mesh(geometry, material);
        const box = new THREE.BoxHelper(cube);
        // @ts-ignore
        box.applyMatrix4(volume.matrix);
        this.scene.add(box);
        this.scene.add(cube);

        //x plane
        // @ts-ignore
        const sliceX = volume.extractSlice('x', Math.floor(volume.RASDimensions[0] / 2));
        this.scene.add(sliceX.mesh);

        //y plane
        // @ts-ignore
        const sliceY = volume.extractSlice('y', Math.floor(volume.RASDimensions[1] / 2));
        this.scene.add(sliceY.mesh);

        //z plane
        // @ts-ignore
        const sliceZ = volume.extractSlice('z', Math.floor(volume.RASDimensions[2] / 4));
        this.scene.add(sliceZ.mesh);

        // @ts-ignore
        this.gui.add(sliceX, 'index', 0, volume.RASDimensions[0], 1).name('indexX').onChange(() => {
          sliceX.repaint.call(sliceX);
        });
        // @ts-ignore
        this.gui.add(sliceY, 'index', 0, volume.RASDimensions[1], 1).name('indexY').onChange(() => {
          sliceY.repaint.call(sliceY);
        });
        // @ts-ignore
        this.gui.add(sliceZ, 'index', 0, volume.RASDimensions[2], 1).name('indexZ').onChange(() => {
          sliceZ.repaint.call(sliceZ);
        });

        // @ts-ignore
        this.gui.add(volume, 'lowerThreshold', volume.min, volume.max, 1).name('Lower阈值').onChange(() => {
          volume.repaintAllSlices();
        });
        // @ts-ignore
        this.gui.add(volume, 'upperThreshold', volume.min, volume.max, 1).name('Upper阈值').onChange(() => {
          volume.repaintAllSlices();
        });
        // @ts-ignore
        this.gui.add(volume, 'windowLow', volume.min, volume.max, 1).name('Win Low').onChange(() => {
          volume.repaintAllSlices();
        });
        // @ts-ignore
        this.gui.add(volume, 'windowHigh', volume.min, volume.max, 1).name('Win High').onChange(() => {
          volume.repaintAllSlices();
        });
      }, undefined, () => { toast.close(); });
    })();

    (() => {
      // Lambert网格材质(MeshLambertMaterial)
      // 一种非光泽表面的材质，没有镜面高光
      const material = new THREE.MeshLambertMaterial({ 
        wireframe: false, 
        color: 0xff0000,
        side: THREE.DoubleSide, 
      });
      const loader = new VTKLoader();
      const url = "/examples/models/vtk/liver.vtk";
      const toast = showLoadingToast({
        duration: 10000,
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      loader.load(url, (geometry) => {
        toast.close();
        geometry.computeVertexNormals();

        const control = { visible: true };
        const mesh = new THREE.Mesh(geometry, material);

        this.scene.add(mesh);
        this.gui.add(control, "visible").name("Model Visible").onChange(() => {
          mesh.visible = control.visible;
          if (this.renderer && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        });
      }, undefined, () => { toast.close(); });
    })();
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

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
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

