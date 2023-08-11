import GUI from 'lil-gui';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { BokehShader, BokehDepthShader, type BokehShaderUniforms } from 'three/examples/jsm/shaders/BokehShader2';
import { showLoadingToast } from 'vant';

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

  private materialDepth: THREE.ShaderMaterial;
  private half: THREE.Vector2;
  private distance: number;
  private effectController: {
    enabled: boolean,
    jsDepthCalculation: boolean,
    shaderFocus: boolean,
    fstop: number,
    maxblur: number,
    showFocus: boolean,
    focalDepth: number,
    manualdof: boolean,
    vignetting: boolean,
    depthblur: boolean,
    threshold: number,
    gain: number,
    bias: number,
    fringe: number,
    focalLength: number,
    noise: boolean,
    pentagon: boolean,
    dithering: number,
  }
  private postprocessing: {
    enabled: boolean,
    scene?: THREE.Scene,
    camera?: THREE.OrthographicCamera,
    rtTextureDepth?: THREE.WebGLRenderTarget,
    rtTextureColor?: THREE.WebGLRenderTarget,
    bokeh_uniforms?: BokehShaderUniforms,
    materialBokeh?: THREE.ShaderMaterial,
    quad?: THREE.Mesh,
  }
  private shaderSettings: {
    rings: number,
		samples: number,
  }
  private mouse: THREE.Vector2;
  private raycaster: THREE.Raycaster;
  private target: THREE.Vector3;
  private planes: THREE.Mesh[];
  private leaves: number;
  private textureCube: THREE.CubeTexture;
  private gui: GUI;
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

    this.materialDepth = new THREE.ShaderMaterial();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.distance = 100;
    this.effectController = {
      enabled: true,
      jsDepthCalculation: true,
      shaderFocus: false,

      fstop: 2.2,
      maxblur: 1.0,

      showFocus: false,
      focalDepth: 2.8,
      manualdof: false,
      vignetting: false,
      depthblur: false,

      threshold: 0.5,
      gain: 2.0,
      bias: 0.5,
      fringe: 0.7,

      focalLength: 35,
      noise: true,
      pentagon: false,

      dithering: 0.0001
    };
    this.postprocessing = {
      enabled: true
    };
    this.shaderSettings = {
      rings: 1,
      samples: 4
    };
    this.mouse = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.target = new THREE.Vector3(0, 20, -50);
    this.planes = [];
    this.leaves = 100;
    this.textureCube = new THREE.CubeTexture();
    this.gui = new GUI({
      title: "控制面板",
      container: this.container,
      autoPlace: false,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 3000);
    this.camera.position.y = 150;
    this.camera.position.z = 450;
    this.scene.add(this.camera);

    // 渲染器
    this.createRenderer();

    // materialDepth
    {
      const depthShader = BokehDepthShader;
      this.materialDepth.uniforms = depthShader.uniforms;
      this.materialDepth.vertexShader = depthShader.vertexShader;
      this.materialDepth.fragmentShader = depthShader.fragmentShader;
      this.materialDepth.uniforms['mNear'].value = this.camera.near;
      this.materialDepth.uniforms['mFar'].value = this.camera.far;
    }

    this.createSkybox();
    this.createPlane();
    this.addingMonkeys();
    this.addBalls();
    this.generateLights();
    this.initPostprocessing();
    this.matChanger();

    this.bind();
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
    this.gui.close();
    this.gui.add(this.effectController, 'enabled' ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'jsDepthCalculation' ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'shaderFocus' ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'focalDepth', 0.0, 200.0 ).listen().onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'fstop', 0.1, 22, 0.001 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'maxblur', 0.0, 5.0, 0.025 ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'showFocus' ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'manualdof' ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'vignetting' ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'depthblur' ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'threshold', 0, 1, 0.001 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'gain', 0, 100, 0.001 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'bias', 0, 3, 0.001 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'fringe', 0, 5, 0.001 ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'focalLength', 16, 80, 0.001 ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'noise' ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'dithering', 0, 0.001, 0.0001 ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.effectController, 'pentagon' ).onChange(() => {
      this.matChanger();
    });

    this.gui.add(this.shaderSettings, 'rings', 1, 8 ).step( 1 ).onChange(() => {
      this.shaderUpdate();
    });
    this.gui.add(this.shaderSettings, 'samples', 1, 13 ).step( 1 ).onChange(() => {
      this.shaderUpdate();
    });
  }

  private matChanger() {
    for (const e in this.effectController) {
      if (this.postprocessing.bokeh_uniforms) {
        if (e in this.postprocessing.bokeh_uniforms) {
          // @ts-ignore
          this.postprocessing.bokeh_uniforms[e].value = this.effectController[e];
        }
      }
    }

    this.postprocessing.enabled = this.effectController.enabled;
    if (this.camera && this.postprocessing.bokeh_uniforms) {
      this.postprocessing.bokeh_uniforms['znear'].value = this.camera.near;
      this.postprocessing.bokeh_uniforms['zfar'].value = this.camera.far;
      this.camera.setFocalLength(this.effectController.focalLength);
    }
  }

  private shaderUpdate() {
    if (this.postprocessing.materialBokeh) {
      this.postprocessing.materialBokeh.defines.RINGS = this.shaderSettings.rings;
      this.postprocessing.materialBokeh.defines.SAMPLES = this.shaderSettings.samples;
      this.postprocessing.materialBokeh.needsUpdate = true;
    }
  }

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        event.stopPropagation();
        const e = event.touches[0];
        const x = (e.clientX - this.half.x)/this.half.x;
        const y = (e.clientY - 45 - this.half.y)/this.half.y;
        
        this.mouse.set(x, y);
        if (this.postprocessing.bokeh_uniforms) {
          this.postprocessing.bokeh_uniforms['focusCoords'].value.set( 
            e.clientX / this.width, 
            1 - ((e.clientY - 45) / this.height)
          );
        }
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        e.stopPropagation();
        const x = (e.clientX - this.half.x)/this.half.x;
        const y = (e.clientY - 45 - this.half.y)/this.half.y;
        
        this.mouse.set(x, y);
        if (this.postprocessing.bokeh_uniforms) {
          this.postprocessing.bokeh_uniforms['focusCoords'].value.set( 
            e.clientX / this.width, 
            1 - ((e.clientY - 45) / this.height)
          );
        }
      };
    }
  }

  private initPostprocessing() {
    this.postprocessing.scene = new THREE.Scene();
    this.postprocessing.camera = new THREE.OrthographicCamera(
      this.width/ - 2, this.width/ 2, 
      this.height/ 2, this.height/ -2, 
      -10000, 10000
    );
    this.postprocessing.camera.position.z = 100;

    this.postprocessing.scene.add(this.postprocessing.camera );
    this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(this.width, this.height);
    this.postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(this.width, this.height);

    const bokeh_shader = BokehShader;
    this.postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms) as BokehShaderUniforms;
    this.postprocessing.bokeh_uniforms['tColor'].value = this.postprocessing.rtTextureColor.texture;
    this.postprocessing.bokeh_uniforms['tDepth'].value = this.postprocessing.rtTextureDepth.texture;
    this.postprocessing.bokeh_uniforms['textureWidth'].value = this.width;
    this.postprocessing.bokeh_uniforms['textureHeight'].value = this.height;

    this.postprocessing.materialBokeh = new THREE.ShaderMaterial({
      // @ts-ignore
      uniforms: this.postprocessing.bokeh_uniforms as BokehShaderUniforms,
      vertexShader: bokeh_shader.vertexShader,
      fragmentShader: bokeh_shader.fragmentShader,
      defines: {
        RINGS: this.shaderSettings.rings,
        SAMPLES: this.shaderSettings.samples
      }
    });

    this.postprocessing.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height), 
      this.postprocessing.materialBokeh
    );
    this.postprocessing.quad.position.z = -500;
    this.postprocessing.scene.add(this.postprocessing.quad);
  }

  private generateLights() {
    const ambient = new THREE.AmbientLight(0x222222);
    this.scene.add(ambient);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight1.position.set(2, 1.2, 10).normalize();
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-2, 1.2, -10).normalize();
    this.scene.add(directionalLight2);
  }

  private addBalls() {
    const geometry = new THREE.SphereGeometry(1, 20, 20);
    for (let i = 0; i < 20; i++) {
      const ballmaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff * Math.random(),
        shininess: 0.5,
        specular: 0xffffff,
        envMap: this.textureCube 
      });

      const mesh = new THREE.Mesh(geometry, ballmaterial);
      mesh.position.x = (Math.random() - 0.5) * 200;
      mesh.position.y = Math.random() * 50;
      mesh.position.z = (Math.random() - 0.5) * 200;
      mesh.scale.multiplyScalar(10);
      this.scene.add(mesh);
    }
  }

  private addingMonkeys() {
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/suzanne_buffergeometry.json";
    const monkeys = 20;

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (geometry) => {
      toast.close();
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        specular: 0xffffff,
        envMap: this.textureCube,
        shininess: 50,
        reflectivity: 1.0,
        flatShading: true
      });

      for (let i = 0; i < monkeys; i++) {
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.z = Math.cos( i / monkeys * Math.PI * 2 ) * 200;
        mesh.position.y = Math.sin( i / monkeys * Math.PI * 3 ) * 20;
        mesh.position.x = Math.sin( i / monkeys * Math.PI * 2 ) * 200;

        mesh.rotation.y = i / monkeys * Math.PI * 2;
        mesh.scale.setScalar(30);
        this.scene.add(mesh);
      }
    }, undefined, () => {
      toast.close();
    });
  }

  private createPlane() {
    const planePiece = new THREE.PlaneGeometry(10, 10, 1, 1);
    const planeMat = new THREE.MeshPhongMaterial({
      color: 0xffffff * 0.4,
      shininess: 0.5,
      specular: 0xffffff,
      envMap: this.textureCube,
      side: THREE.DoubleSide,
    });
    const rand = Math.random;

    for ( let i = 0; i < this.leaves; i ++ ) {
      const plane = new THREE.Mesh(planePiece, planeMat);
      plane.rotation.set(rand(), rand(), rand());
      // @ts-ignore
      plane.rotation.dx = rand() * 0.1;
      // @ts-ignore
      plane.rotation.dy = rand() * 0.1;
      // @ts-ignore
      plane.rotation.dz = rand() * 0.1;

      plane.position.set(rand() * 150, 0 + rand() * 300, rand() * 150);
      // @ts-ignore
      plane.position.dx = (rand() - 0.5);
      // @ts-ignore
      plane.position.dz = (rand() - 0.5);
      this.scene.add(plane);
      this.planes.push(plane);
    }
  }

  private createSkybox() {
    const r = '/examples/textures/cube/Bridge2/';
    const urls = [ 
      `${r}posx.jpg`, `${r}negx.jpg`,
      `${r}posy.jpg`, `${r}negy.jpg`,
      `${r}posz.jpg`, `${r}negz.jpg`,
    ];
    this.textureCube = new THREE.CubeTextureLoader().load(urls);
    this.scene.background = this.textureCube;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    // @ts-ignore
    this.stats = new Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  private saturate(x: number) {
    return Math.max(0, Math.min(1, x));
  }

  private linearize(depth: number) {
    if (this.camera) {
      const zfar = this.camera.far;
      const znear = this.camera.near;
      return - zfar * znear / (depth * (zfar - znear) - zfar);
    } else {
      return 0;
    }
  }

  private smoothstep(near: number, far: number, depth: number) {
    const x = this.saturate((depth - near) / (far - near));
		return x * x * (3 - 2 * x);
  }

  private render() {
    const time = Date.now() * 0.00015;

    if (this.camera) {
      this.camera.position.x = Math.cos(time) * 400;
      this.camera.position.z = Math.sin(time) * 500;
      this.camera.position.y = Math.sin(time / 1.4) * 100;
      this.camera.lookAt(this.target);
      this.camera.updateMatrixWorld();

      if (this.effectController.jsDepthCalculation) {
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const targetDistance = (intersects.length > 0) ? intersects[0].distance : 1000;

        this.distance += (targetDistance - this.distance) * 0.03;

        const sdistance = this.smoothstep(this.camera.near, this.camera.far, this.distance);
        const ldistance = this.linearize(1 - sdistance);
        
        if (this.postprocessing.bokeh_uniforms) {
          this.postprocessing.bokeh_uniforms['focalDepth'].value = ldistance;
          this.effectController['focalDepth'] = ldistance;
        }
      }

      for (let i = 0; i < this.leaves; i++) {
        const plane = this.planes[i];
        // @ts-ignore
        plane.rotation.x += plane.rotation.dx;
        // @ts-ignore
        plane.rotation.y += plane.rotation.dy;
        // @ts-ignore
        plane.rotation.z += plane.rotation.dz;
        plane.position.y -= 2;
        // @ts-ignore
        plane.position.x += plane.position.dx;
        // @ts-ignore
        plane.position.z += plane.position.dz;

        if (plane.position.y < 0) {
          plane.position.y += 300
        }
      }

      if (this.postprocessing.enabled) {
        this.renderer?.clear();

        if (this.postprocessing.rtTextureColor) {
          this.renderer?.setRenderTarget(this.postprocessing.rtTextureColor);
          this.renderer?.clear();
          this.renderer?.render(this.scene, this.camera);
        }

        if (this.postprocessing.rtTextureDepth) {
          this.scene.overrideMaterial = this.materialDepth;
					this.renderer?.setRenderTarget(this.postprocessing.rtTextureDepth);
					this.renderer?.clear();
					this.renderer?.render(this.scene, this.camera);
					this.scene.overrideMaterial = null;
        }

        if (this.postprocessing.scene && this.postprocessing.camera) {
          this.renderer?.setRenderTarget(null);
					this.renderer?.render(this.postprocessing.scene, this.postprocessing.camera);
        }
      } else {
        this.scene.overrideMaterial = null;
        this.renderer?.setRenderTarget(null);
        this.renderer?.clear();
        this.renderer?.render(this.scene, this.camera);
      }
    }
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    // 执行渲染
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
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.postprocessing?.rtTextureDepth?.setSize(this.width, this.height);
      this.postprocessing?.rtTextureColor?.setSize(this.width, this.height);

      if (this.postprocessing.bokeh_uniforms) {
        this.postprocessing.bokeh_uniforms['textureWidth'].value = this.width;
        this.postprocessing.bokeh_uniforms['textureHeight'].value = this.height;
      }

      this.renderer?.setSize(this.width, this.height);
      this.bind();
    };
  }
}

export default THREE;

