import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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

  private clock: THREE.Clock;
  private uniforms: {
    'fogDensity': { value: number },
    'fogColor': { value: THREE.Vector3 },
    'time': { value: number },
    'uvScale': { value: THREE.Vector2 },
    'texture1': { value: THREE.Texture },
    'texture2': { value: THREE.Texture }
  }
  private materials: THREE.ShaderMaterial[]
  private fragmentShader: string
  private vertexShader: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.clock = new THREE.Clock();
    this.uniforms = {
      'fogDensity': { value: 0.001 },
      'fogColor': { value: new THREE.Vector3( 0, 0, 0 ) },
      'time': { value: 1.0 },
      'uvScale': { value: new THREE.Vector2( 3.0, 1.0 ) },
      'texture1': { value: new THREE.Texture()},
      'texture2': { value: new THREE.Texture()}
    };

    this.materials = [];
    this.fragmentShader = `
      uniform float time;
			uniform float fogDensity;
			uniform vec3 fogColor;
			uniform sampler2D texture1;
			uniform sampler2D texture2;
			varying vec2 vUv;

			void main( void ) {

				vec2 position = - 1.0 + 2.0 * vUv;

				vec4 noise = texture2D( texture1, vUv );
				vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
				vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;

				T1.x += noise.x * 2.0;
				T1.y += noise.y * 2.0;
				T2.x -= noise.y * 0.2;
				T2.y += noise.z * 0.2;

				float p = texture2D( texture1, T1 * 2.0 ).a;

				vec4 color = texture2D( texture2, T2 * 2.0 );
				vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

				if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
				if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
				if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

				gl_FragColor = temp;

				float depth = gl_FragCoord.z / gl_FragCoord.w;
				const float LOG2 = 1.442695;
				float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
				fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

				gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
			}
    `;
    this.vertexShader = `
      uniform vec2 uvScale;
      varying vec2 vUv;

      void main() {
        vUv = uvScale * uv;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 3000);
    this.camera.position.z = 7;

    this.uniformsHandle();
    // 创建模型
    this.addMeshes();

    // 渲染器
    this.createRenderer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async uniformsHandle() {
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const textureLoader = new THREE.TextureLoader();

    this.uniforms['texture1'].value = await textureLoader.loadAsync('/examples/textures/lava/cloud.png');
    this.uniforms['texture2'].value = await textureLoader.loadAsync('/examples/textures/lava/lavatile.jpg');

    this.uniforms['texture1'].value.wrapS = THREE.RepeatWrapping;
    this.uniforms['texture1'].value.wrapT = THREE.RepeatWrapping;

    this.uniforms['texture2'].value.wrapS = THREE.RepeatWrapping;
    this.uniforms['texture2'].value.wrapT = THREE.RepeatWrapping;

    toast.close();
  }

  private addMeshes() {
    this.removeAllMeshes();

    // .seededRandom ( seed : Integer ) : Float
    // 在区间 [0, 1] 中生成确定性的伪随机浮点数。 整数种子是可选的
    THREE.MathUtils.seededRandom(1);
    const projScreenMatrix = new THREE.Matrix4();
    // 视锥体（Frustum）
    // Frustums 用于确定相机视野内的东西。 它有助于加速渲染过程——位于摄像机视锥体外的物体可以安全地排除在渲染之外。
    // 该类主要用于渲染器内部计算 camera 或 shadowCamera的视锥体
    const frustum = new THREE.Frustum();
    const camera = this.camera as THREE.PerspectiveCamera;

    camera.updateMatrixWorld();
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    // .setFromProjectionMatrix ( matrix : Matrix4 ) : this
    // matrix - 投影矩阵 Matrix4 会被用来设置该视椎体的 planes
    // 根据投影矩阵 matrix 来设置当前视椎体的六个面
    frustum.setFromProjectionMatrix(projScreenMatrix);

    const size = 0.65;
    let count = 0;
    while(count < 2500) {

      const scale = THREE.MathUtils.seededRandom() * 0.2 + 0.1;
      const material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader
      });
  
      const geometry = new THREE.TorusGeometry(size, 0.3, 30, 30);
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.name = "shader-mesh";
      mesh.position.set(
        THREE.MathUtils.seededRandom() * 20 - 10,
        THREE.MathUtils.seededRandom() * 20 - 10,
        THREE.MathUtils.seededRandom() * 20 - 10,
      );
      mesh.rotation.x = THREE.MathUtils.seededRandom() * 2 * Math.PI;
      mesh.rotation.y = THREE.MathUtils.seededRandom() * 2 * Math.PI;
      mesh.scale.set(scale, scale, scale);
      mesh.updateMatrixWorld();
  
      if (frustum.intersectsObject(mesh)) {
        this.materials.push(material);
        this.scene.add(mesh);
        count++;
      }
    }
  }

  private removeAllMeshes() {
    this.scene.children.forEach((object) => {
      const obj = object as THREE.Mesh;

      if (obj.name === "shader-mesh") {
        const material = obj.material as THREE.ShaderMaterial;
        this.scene.remove(obj);
        obj.geometry.dispose();
        material.dispose();
      }
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    this.materials.forEach((material) => {
      material.needsUpdate = true;
    });

    const delta = 5 * this.clock.getDelta();
    this.uniforms['time'].value += 0.2 * delta;
    
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

      this.addMeshes();
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

