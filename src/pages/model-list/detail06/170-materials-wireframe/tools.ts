import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private gui: GUI
  private vertexShader: string
  private fragmentShader: string
  private params: { thickness: number }
  private mesh1: THREE.Mesh
  private mesh2: THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.vertexShader = `
      attribute vec3 center;
			varying vec3 vCenter;
			void main() {
				vCenter = center;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}
    `;
    this.fragmentShader = `
      uniform float thickness;
			varying vec3 vCenter;
			void main() {
				vec3 afwidth = fwidth( vCenter.xyz );
				vec3 edge3 = smoothstep( ( thickness - 1.0 ) * afwidth, thickness * afwidth, vCenter.xyz );
				float edge = 1.0 - min( min( edge3.x, edge3.y ), edge3.z );
				gl_FragColor.rgb = gl_FrontFacing ? vec3( 0.9, 0.9, 1.0 ) : vec3( 0.4, 0.4, 0.5 );
        // 设置颜色
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
				gl_FragColor.a = edge;
			}
    `;
    this.params = {
      thickness: 1
    };
    this.mesh1 = new THREE.Mesh();
    this.mesh2 = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 500);
    this.camera.position.z = 200;

    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.update();

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, "thickness", 0.5, 10).name("粗细").onChange(() => {
      const material = this.mesh1.material as THREE.ShaderMaterial;
      
      material.uniforms.thickness.value = this.params.thickness;
      this.mesh1.material = material;
    });
  }

  private loadModel() {
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/WaltHeadLo_buffergeometry.json";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (geometry) => {
      toast.close();

      geometry.deleteAttribute("normal");
      geometry.deleteAttribute("uv");
      this.setupAttributes(geometry);

      {
        const material = new THREE.ShaderMaterial({
          uniforms: { 'thickness': { value: this.params.thickness } },
          vertexShader: this.vertexShader,
          fragmentShader: this.fragmentShader,
          side: THREE.DoubleSide,
          // 启用alpha to coverage. 只能在开启了MSAA的渲染环境中使用 
          // (当渲染器创建的时候antialias 属性要true才能使用). 默认为 false
          alphaToCoverage: true,
        });
        material.extensions.derivatives = true;
        this.mesh1 = new THREE.Mesh(geometry, material);
        this.mesh1.position.set(0, 25, 0);
        this.mesh1.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.mesh1);
      }

      {
        const material = new THREE.MeshBasicMaterial({
          color: 0xe0e0ff,
          wireframe: true,
          side: THREE.DoubleSide,
        });

        this.mesh2 = new THREE.Mesh(geometry, material);
        this.mesh2.position.set(0, -25, 0);
        this.mesh2.scale.set(0.5, 0.5, 0.5);
        this.scene.add(this.mesh2);
      }

    }, undefined, () => { toast.close(); });
  }

  private setupAttributes(geometry: THREE.BufferGeometry) {
    const vectors = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1)
    ];
    const position = geometry.attributes.position;
    const count = position.count;
    const centers = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      vectors[i % 3].toArray(centers, i * 3);
    }

    geometry.setAttribute('center', new THREE.BufferAttribute(centers, 3));
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.mesh1.rotation.y += 0.005;
    this.mesh2.rotation.y -= 0.005;
    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
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

