import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { CinematicCamera } from 'three/examples/jsm/cameras/CinematicCamera.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | CinematicCamera
  private stats: null | Stats
  private theta: number
  private aspect: number
  private raycaster: null | THREE.Raycaster
  private radius: number
  private mouse: THREE.Vector2
  private INTERSECTED: null | THREE.Object3D
  private effectController: {[key: string]: any}
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.theta = 0;
    this.aspect = this.width/this.height;
    this.mesh = null;
    this.raycaster = null;
    this.radius = 100;
    this.mouse = new THREE.Vector2();
    this.INTERSECTED = null;
    this.effectController = {
      focalLength: 15,
      // jsDepthCalculation: true,
      // shaderFocus: false,
      //
      fstop: 2.8,
      // maxblur: 1.0,
      //
      showFocus: false,
      focalDepth: 3,
      // manualdof: false,
      // vignetting: false,
      // depthblur: false,
      //
      // threshold: 0.5,
      // gain: 2.0,
      // bias: 0.5,
      // fringe: 0.7,
      //
      // focalLength: 35,
      // noise: true,
      // pentagon: false,
      //
      // dithering: 0.0001
    };
  }

  init() {
    // 性能统计信息
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);

    // 创建相机
    this.camera = new CinematicCamera(60, this.width/this.height, 1, 1000);
    for ( const e in this.effectController ) {
      if ( e in this.camera.postprocessing.bokeh_uniforms ) {
        // @ts-ignore
        this.camera.postprocessing.bokeh_uniforms[e].value = this.effectController[e];
      }
    }

    this.camera.postprocessing.bokeh_uniforms['znear'].value = this.camera.near;
    this.camera.postprocessing.bokeh_uniforms['zfar'].value = this.camera.far;
    // @ts-ignore
    this.camera.setLens(15, this.camera.frameHeight, 28, this.camera.coc);
    this.camera.position.set(5, 1, 500);

    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    // 给场景添加一个漫散射光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // 给场景添加一个直线光
    const light = new THREE.DirectionalLight(0xffffff, 0.35);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    // 创建n个几个体
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    for (let i = 0; i < 1500; i++) {
      const obj = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff}));
      obj.position.x = Math.random() * 800 - 400;
      obj.position.y = Math.random() * 800 - 400;
      obj.position.z = Math.random() * 800 - 400;
      this.scene.add(obj);
    }
    this.raycaster = new THREE.Raycaster();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.animate();
    this.resize();

    // 添加鼠标事件
    window.onmousemove = (e) => {
      e.preventDefault();
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
  }

  render() {
    this.theta += 0.1;

    if (this.camera && this.scene) {
      this.camera.position.x = this.radius * Math.sin( THREE.MathUtils.degToRad( this.theta ) );
      this.camera.position.y = this.radius * Math.sin( THREE.MathUtils.degToRad( this.theta ) );
      this.camera.position.z = this.radius * Math.cos( THREE.MathUtils.degToRad( this.theta ) );
      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();
    }

    if (this.raycaster && this.scene && this.camera) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene?.children, false);
      if (intersects.length > 0) {
        const targetDistance = intersects[0].distance;
        this.camera.focusAt(targetDistance);

        if (this.INTERSECTED !== intersects[0].object) {
          if (this.INTERSECTED) {
            // @ts-ignore
            this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
          }
          this.INTERSECTED = intersects[0].object;
          // @ts-ignore
          this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
          // @ts-ignore
          this.INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
      } else {
        if ( this.INTERSECTED ) {
          // @ts-ignore
          this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex )
        }
				this.INTERSECTED = null;
      }
    }

    if (this.scene && this.camera && this.renderer) {
      if (this.camera.postprocessing.enabled) {
        this.camera.renderCinematic(this.scene, this.renderer);
      } else {
        this.scene.overrideMaterial = null;
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    this.render();
    
    // 统计信息更新
    if (this.stats) {
      this.stats.update();
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

