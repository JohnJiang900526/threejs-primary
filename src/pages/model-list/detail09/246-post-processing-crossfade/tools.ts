import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import TWEEN from '@tweenjs/tween.js';
import GUI from 'lil-gui';

interface ITransitionParamsOption {
  sceneA: FXScene, 
  sceneB: FXScene,
  container: HTMLDivElement,
  renderer: THREE.WebGLRenderer,
  transitionParams: {
    'useTexture': boolean,
    'transition': number,
    'texture': number,
    'cycle': boolean,
    'animate': boolean,
    'threshold': number
  };
}

interface IFXSceneParamsOption {
  container: HTMLDivElement,
  renderer: THREE.WebGLRenderer,
  geometry: THREE.BoxGeometry | THREE.IcosahedronGeometry,
  rotationSpeed: THREE.Vector3,
  clearColor: number,
}


class Transition {
  private sceneA: FXScene; 
  private sceneB: FXScene;
  private container: HTMLDivElement;
  private width: number;
  private height: number;
  private renderer: THREE.WebGLRenderer
  private camera: THREE.OrthographicCamera;
  private scene: THREE.Scene;
  private textures: THREE.Texture[];
  private vertexShader: string;
  private fragmentShader: string;
  private loader: THREE.TextureLoader;
  private material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh;
  private needsTextureChange: boolean;
  private transitionParams: {
    'useTexture': boolean,
    'transition': number,
    'texture': number,
    'cycle': boolean,
    'animate': boolean,
    'threshold': number,
  }
  constructor(params: ITransitionParamsOption) {
    const { sceneA, sceneB, container, renderer, transitionParams }= params;

    this.sceneA = sceneA;
    this.sceneB = sceneB;
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = renderer;
    this.transitionParams = transitionParams;

    this.textures = [];
    this.loader = new THREE.TextureLoader();
    this.material = new THREE.ShaderMaterial();
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      this.width / -2, this.width / 2, 
      this.height / 2, this.height / -2, 
      -10, 10
    );
    this.vertexShader = [
      'varying vec2 vUv;',
      'void main() {',
      'vUv = vec2( uv.x, uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n');

    this.fragmentShader = [
      'uniform float mixRatio;',
      'uniform sampler2D tDiffuse1;',
      'uniform sampler2D tDiffuse2;',
      'uniform sampler2D tMixTexture;',
      'uniform int useTexture;',
      'uniform float threshold;',
      'varying vec2 vUv;',
      'void main() {',
      '	vec4 texel1 = texture2D( tDiffuse1, vUv );',
      '	vec4 texel2 = texture2D( tDiffuse2, vUv );',
      '	if (useTexture==1) {',
      '		vec4 transitionTexel = texture2D( tMixTexture, vUv );',
      '		float r = mixRatio * (1.0 + threshold * 2.0) - threshold;',
      '		float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);',
      '		gl_FragColor = mix( texel1, texel2, mixf );',
      '	} else {',
      '		gl_FragColor = mix( texel2, texel1, mixRatio );',
      '	}',
      '}'
    ].join('\n');
    this.mesh = new THREE.Mesh();
    this.needsTextureChange = false;

    this.getTextures();
    this.createMesh();
  }

  private getTextures() {
    for (let i = 0; i < 6; i++) {
      const url = `/examples/textures/transition/transition${(i + 1)}.png`;
      this.textures[ i ] = this.loader.load(url);
    }
  }

  private createMesh() {
    if (this.material) { this.material.dispose(); }
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse1: {
          value: null
        },
        tDiffuse2: {
          value: null
        },
        mixRatio: {
          value: 0.0
        },
        threshold: {
          value: 0.1
        },
        useTexture: {
          value: 1
        },
        tMixTexture: {
          value: this.textures[0]
        }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });

    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.material.uniforms.tDiffuse1.value = this.sceneA.fbo.texture;
    this.material.uniforms.tDiffuse2.value = this.sceneB.fbo.texture;

    new TWEEN.Tween(this.transitionParams).to({
      transition: 1 
    }, 1500).repeat(Infinity).delay(2000).yoyo(true).start();
  }

  setTextureThreshold(value: number) {
    this.material.uniforms.threshold.value = value;
  }
  useTexture(value: boolean) {
    this.material.uniforms.useTexture.value = value ? 1 : 0;
  }
  setTexture(i: number) {
    this.material.uniforms.tMixTexture.value = this.textures[i];
  }
  resize() {
    this.sceneA.resize();
    this.sceneB.resize();
  }
  render(delta: number) {
    if (this.transitionParams.animate) {
      TWEEN.update();

      if (this.transitionParams.cycle) {
        if (this.transitionParams.transition == 0 || this.transitionParams.transition == 1) {
          if ( this.needsTextureChange ) {
            this.transitionParams.texture = (this.transitionParams.texture + 1) % this.textures.length;
            this.material.uniforms.tMixTexture.value = this.textures[this.transitionParams.texture];
            this.needsTextureChange = false;
          }
        } else {
          this.needsTextureChange = true;
        }
      } else {
        this.needsTextureChange = true;
      }
    }

    this.material.uniforms.mixRatio.value = this.transitionParams.transition;

    if (this.transitionParams.transition == 0) {
      this.sceneB.render(delta, false);
    } else if (this.transitionParams.transition === 1) {
      this.sceneA.render(delta, false);
    } else {
      this.sceneA.render(delta, true);
      this.sceneB.render(delta, true);

      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }
}

class FXScene {
  private container: HTMLDivElement;
  private width: number;
  private height: number;
  private aspect: number;
  private renderer: THREE.WebGLRenderer
  private rotationSpeed: THREE.Vector3;
  private clearColor: number;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private mesh: THREE.Mesh;
  fbo: THREE.WebGLRenderTarget
  constructor(params: IFXSceneParamsOption) {
    const { container, renderer, rotationSpeed, clearColor, geometry } = params;
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    
    this.rotationSpeed = rotationSpeed;
    this.clearColor = clearColor;
    this.container = container;

    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 2000;

    this.mesh = new THREE.Mesh();

    this.createLight();
    this.createMesh(geometry);

    this.fbo = new THREE.WebGLRenderTarget(this.width, this.height);
  }

  private generateInstancedMesh(geometry: THREE.BoxGeometry | THREE.IcosahedronGeometry, material: THREE.MeshPhongMaterial, count: number) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        Math.random() * 10000 - 5000,
        Math.random() * 6000 - 3000,
        Math.random() * 8000 - 4000,
      );

      dummy.rotation.set(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
      );

      {
        dummy.scale.x = Math.random() * 200 + 100;
        if (geometry.type === 'BoxGeometry') {
          dummy.scale.y = Math.random() * 200 + 100;
          dummy.scale.z = Math.random() * 200 + 100;
        } else {
          dummy.scale.y = dummy.scale.x;
          dummy.scale.z = dummy.scale.x;
        }
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setScalar( 0.1 + 0.9 * Math.random()));
    }
    return mesh;
  }

  private createMesh(geometry: THREE.BoxGeometry | THREE.IcosahedronGeometry) {
    const color = geometry.type === 'BoxGeometry' ? 0x0000ff : 0xff0000;
    const material = new THREE.MeshPhongMaterial({ 
      color: color, 
      flatShading: true 
    });
    this.mesh = this.generateInstancedMesh(geometry, material, 500);
    this.scene.add(this.mesh);
  }

  private createLight() {
    const ambient = new THREE.AmbientLight(0x555555);

    const light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    
    this.scene.add(ambient, light);
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;

    this.camera.aspect = this.aspect;
    // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(this.width, this.height);
  }

  render(delta: number, rtt: boolean) {
    this.mesh.rotation.x += delta * this.rotationSpeed.x;
    this.mesh.rotation.y += delta * this.rotationSpeed.y;
    this.mesh.rotation.z += delta * this.rotationSpeed.z;

    this.renderer.setClearColor(this.clearColor);

    if ( rtt ) {
      this.renderer.setRenderTarget(this.fbo);
      this.renderer.clear();
    } else {
      this.renderer.setRenderTarget(null);
    }
    this.renderer.render(this.scene, this.camera);
  }
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private renderer: null | THREE.WebGLRenderer;
  private stats: null | Stats;
  private animateNumber: number;

  private transition: null | Transition;
  private transitionParams: {
    'useTexture': boolean,
    'transition': number,
    'texture': number,
    'cycle': boolean,
    'animate': boolean,
    'threshold': number
  };
  private clock: THREE.Clock;
  private gui: GUI;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.renderer = null;
    this.stats = null;
    this.animateNumber = 0;

    this.transition = null;
    this.transitionParams = {
      'useTexture': true,
      'transition': 0,
      'texture': 5,
      'cycle': true,
      'animate': true,
      'threshold': 0.3,
    };
    this.clock = new THREE.Clock();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 渲染器
    this.createRenderer();

    const geometryA = new THREE.BoxGeometry( 2, 2, 2 );
    const geometryB = new THREE.IcosahedronGeometry( 1, 1 );
    const sceneA = new FXScene({
      container: this.container,
      renderer: this.renderer as THREE.WebGLRenderer,
      geometry: geometryA,
      clearColor: 0xffffff,
      rotationSpeed: new THREE.Vector3(0, - 0.4, 0), 
    });

    const sceneB = new FXScene({
      container: this.container,
      renderer: this.renderer as THREE.WebGLRenderer,
      geometry: geometryB,
      clearColor: 0x000000,
      rotationSpeed: new THREE.Vector3(0, 0.2, 0.1),
    });

    this.transition = new Transition({
      sceneA, 
      sceneB,
      container: this.container,
      renderer: this.renderer as THREE.WebGLRenderer,
      transitionParams: this.transitionParams
    });

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.transitionParams, 'animate');
    this.gui.add(this.transitionParams, 'transition', 0, 1, 0.01).listen();

    this.gui.add(this.transitionParams, 'useTexture').onChange((value: boolean) => {
      this.transition?.useTexture(value);
    });

    const textures = { Perlin: 0, Squares: 1, Cells: 2, Distort: 3, Gradient: 4, Radial: 5 };
    this.gui.add(this.transitionParams, 'texture', textures).onChange((value: number) => {
      this.transition?.setTexture(value);
    } ).listen();

    this.gui.add(this.transitionParams, 'cycle');

    this.gui.add(this.transitionParams, 'threshold', 0, 1, 0.01).onChange((value: number) => {
      this.transition?.setTextureThreshold(value);
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

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    // 执行渲染
    this.transition?.render(this.clock.getDelta());
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
      this.transition?.resize();
    };
  }
}

export default THREE;

