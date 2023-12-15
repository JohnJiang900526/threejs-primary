import * as THREE from 'three';
import GUI from 'lil-gui';
import { showFailToast, showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { NRRDLoader } from 'three/examples/jsm/loaders/NRRDLoader';
import { VolumeRenderShader1 } from 'three/examples/jsm/shaders/VolumeShader';
import WebGL from 'three/examples/jsm/capabilities/WebGL';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private material: THREE.ShaderMaterial;
  private volconfig: {
    clim1: number;
    clim2: number;
    renderstyle: string;
    isothreshold: number;
    colormap: string;
  }
  private cmtextures: {
    viridis: THREE.Texture;
    gray: THREE.Texture;
  }
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
    this.material = new THREE.ShaderMaterial();
    this.volconfig = {
      clim1: 0, 
      clim2: 1, 
      renderstyle: 'iso', 
      isothreshold: 0.15, 
      colormap: 'viridis',
    };
    this.cmtextures = {
      viridis: new THREE.Texture(),
      gray: new THREE.Texture()
    };
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    const h = 512;
    const left = -h * this.aspect / 2;
    const right = h * this.aspect / 2;
    const top = h / 2;
    const bottom = -h / 2;
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, 1, 1000);
    this.camera.position.set(- 64, - 64, 128);
    this.camera.up.set(0, 0, 1);

    // 加载模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(64, 64, 128);
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 4;
    this.controls.enableDamping = true;
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    if (this.gui) {
      this.gui.destroy();
    }

    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });

    this.gui.add(this.volconfig, 'clim1', 0, 1, 0.01).onChange(() => {
      this.updateUniforms();
    });
    this.gui.add(this.volconfig, 'clim2', 0, 1, 0.01).onChange(() => {
      this.updateUniforms();
    });
    this.gui.add(this.volconfig, 'colormap', { gray: 'gray', viridis: 'viridis' }).onChange(() => {
      this.updateUniforms();
    });
    this.gui.add(this.volconfig, 'renderstyle', { mip: 'mip', iso: 'iso' }).onChange(() => {
      this.updateUniforms();
    });
    this.gui.add(this.volconfig, 'isothreshold', 0, 1, 0.01).onChange(() => {
      this.updateUniforms();
    });

    this.gui.add(this, "restore").name("还原");
  }

  // 参数还原
  restore() {
    this.volconfig = {
      clim1: 0, 
      clim2: 1, 
      renderstyle: 'iso', 
      isothreshold: 0.15, 
      colormap: 'viridis',
    };
    this.updateUniforms();
    this.setGUI();
  }

  private loadModel() {
    const url = "models/nrrd/stent.nrrd";
    const loader = new NRRDLoader();
    loader.setPath("/examples/");

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, async (volume) => {
      toast.close();

      const data = volume.data as Float32Array;
      const width = volume.xLength;
      const height = volume.yLength;
      const depth = volume.zLength;

      const texture = new THREE.Data3DTexture(data, width, height, depth);
      texture.format = THREE.RedFormat;
      texture.type = THREE.FloatType;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.unpackAlignment = 1;
      texture.needsUpdate = true;

      const l = new THREE.TextureLoader();
      l.setPath('/examples/');
      this.cmtextures = {
        viridis: l.load('textures/cm_viridis.png'),
        gray: l.load('textures/cm_gray.png'),
      };

      const shader = VolumeRenderShader1;
      const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

      uniforms['u_data'].value = texture;
      uniforms['u_size'].value.set(volume.xLength, volume.yLength, volume.zLength);
      uniforms['u_clim'].value.set(this.volconfig.clim1, this.volconfig.clim2);
      // 0: MIP, 1: ISO
      uniforms['u_renderstyle'].value = (this.volconfig.renderstyle == 'mip' ? 0 : 1);
      // For ISO renderstyle
      uniforms['u_renderthreshold'].value = this.volconfig.isothreshold;
      // @ts-ignore
      uniforms['u_cmdata'].value = this.cmtextures[this.volconfig.colormap];

      this.material.dispose();
      this.material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
        side: THREE.BackSide,
      });

      const geometry = new THREE.BoxGeometry(volume.xLength, volume.yLength, volume.zLength);
      geometry.translate(
        volume.xLength / 2 - 0.5, 
        volume.yLength / 2 - 0.5, 
        volume.zLength / 2 - 0.5,
      );

      const mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(mesh);

      this.animate();
    }, undefined, () => {
      toast.close();
    });
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

  private updateUniforms() {
    this.material.uniforms['u_clim'].value.set(this.volconfig.clim1, this.volconfig.clim2);
    this.material.uniforms['u_renderstyle'].value = this.volconfig.renderstyle == 'mip' ? 0 : 1;
    this.material.uniforms['u_renderthreshold'].value = this.volconfig.isothreshold;
    // @ts-ignore
    this.material.uniforms['u_cmdata'].value = this.cmtextures[this.volconfig.colormap];
  }

  private render() {
    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();
    this.render();
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

      const frustHeight = this.camera!.top - this.camera!.bottom;
			this.camera!.left = -frustHeight * this.aspect / 2;
			this.camera!.right = frustHeight * this.aspect / 2;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

