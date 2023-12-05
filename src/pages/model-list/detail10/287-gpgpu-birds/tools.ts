import * as THREE from 'three';
import type { IUniform } from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

class BirdGeometry extends THREE.BufferGeometry {
  constructor(width: number, birds: number) {
    super();

    const trianglesPerBird = 3;
    const triangles = birds * trianglesPerBird;
    const points = triangles * 3;

    const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    this.setAttribute('position', vertices);

    const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3);
    this.setAttribute('birdColor', birdColors);

    const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2);
    this.setAttribute('reference', references);

    const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1);
    this.setAttribute('birdVertex', birdVertex);

    let v = 0;
    function verts_push(arr: number[]) {
      for (let i = 0; i < arr.length; i++) {
        (vertices.array as Float32Array)[v++] = arr[i];
      }
    }

    const wingsSpan = 20;
    for (let i = 0; i < birds; i++) {
      // 身体
      verts_push([0, -0, -20, 0, 4, -20, 0, 0, 30]);
      // 翅膀
      verts_push([0, 0, -15, -wingsSpan, 0, 0, 0, 0, 15]);
      // 另一个翅膀
      verts_push([0, 0, 15, wingsSpan, 0, 0, 0, 0, -15]);
    }

    for (let v = 0; v < triangles * 3; v++) {
      const index = (v / 3);
      const birdIndex = (index / trianglesPerBird);
      const x = (birdIndex % width) / width;
      const y = (birdIndex / width) / width;

      const color = new THREE.Color(0x444444 + (v / 9) / birds * 0x666666);

      (birdColors.array as Float32Array)[v * 3 + 0] = color.r;
      (birdColors.array as Float32Array)[v * 3 + 1] = color.g;
      (birdColors.array as Float32Array)[v * 3 + 2] = color.b;

      (references.array as Float32Array)[v * 2] = x;
      (references.array as Float32Array)[v * 2 + 1] = y;

      (birdVertex.array as Float32Array)[v] = v % 9;
    }

    this.scale(0.2, 0.2, 0.2);
  }
}

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

  private gui: GUI;
  private WIDTH: number;
  private BIRDS: number;
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private BOUNDS: number;
  private BOUNDS_HALF: number;
  private last: number;
  private gpuCompute: null | GPUComputationRenderer;
  private velocityVariable: any;
  private positionVariable: any;
  private positionUniforms: { [uniform: string]: IUniform };
  private velocityUniforms: { [uniform: string]: IUniform };
  private birdUniforms: { [uniform: string]: IUniform };
  private fragmentShaderPosition: string;
  private fragmentShaderVelocity: string;
  private birdVS: string;
  private birdFS: string;
  private params: {
    separation: number;
    alignment: number;
    cohesion: number;
    freedom: number;
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

    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.WIDTH = 32;
    this.BIRDS = this.WIDTH * this.WIDTH;
    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.BOUNDS = 800;
    this.BOUNDS_HALF = this.BOUNDS/2;
    this.last = performance.now();
    this.gpuCompute = null;
    this.velocityVariable = {};
    this.positionVariable = {};
    this.positionUniforms = {};
    this.velocityUniforms = {};
    this.birdUniforms = {};
    this.fragmentShaderPosition = `
      uniform float time;
      uniform float delta;

      void main()	{
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 tmpPos = texture2D( texturePosition, uv );
        vec3 position = tmpPos.xyz;
        vec3 velocity = texture2D( textureVelocity, uv ).xyz;

        float phase = tmpPos.w;

        phase = mod((phase + delta + length(velocity.xz) * delta * 3. + max(velocity.y, 0.0) * delta * 6.), 62.83);

        gl_FragColor = vec4( position + velocity * delta * 15. , phase );
      }
    `;
    this.fragmentShaderVelocity = `
      uniform float time;
      uniform float testing;
      uniform float delta; // about 0.016
      uniform float separationDistance; // 20
      uniform float alignmentDistance; // 40
      uniform float cohesionDistance; //
      uniform float freedomFactor;
      uniform vec3 predator;

      const float width = resolution.x;
      const float height = resolution.y;

      const float PI = 3.141592653589793;
      const float PI_2 = PI * 2.0;
      // const float VISION = PI * 0.55;

      float zoneRadius = 40.0;
      float zoneRadiusSquared = 1600.0;

      float separationThresh = 0.45;
      float alignmentThresh = 0.65;

      const float UPPER_BOUNDS = BOUNDS;
      const float LOWER_BOUNDS = -UPPER_BOUNDS;

      const float SPEED_LIMIT = 9.0;

      float rand( vec2 co ){
        return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
      }

      void main() {
        zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
        separationThresh = separationDistance / zoneRadius;
        alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
        zoneRadiusSquared = zoneRadius * zoneRadius;

        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 birdPosition, birdVelocity;

        vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
        vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

        float dist;
        vec3 dir; // direction
        float distSquared;

        float separationSquared = separationDistance * separationDistance;
        float cohesionSquared = cohesionDistance * cohesionDistance;

        float f;
        float percent;

        vec3 velocity = selfVelocity;

        float limit = SPEED_LIMIT;

        dir = predator * UPPER_BOUNDS - selfPosition;
        dir.z = 0.;
        // dir.z *= 0.6;
        dist = length( dir );
        distSquared = dist * dist;

        float preyRadius = 150.0;
        float preyRadiusSq = preyRadius * preyRadius;


        // move birds away from predator
        if ( dist < preyRadius ) {

          f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
          velocity += normalize( dir ) * f;
          limit += 5.0;
        }


        // if (testing == 0.0) {}
        // if ( rand( uv + time ) < freedomFactor ) {}


        // Attract flocks to the center
        vec3 central = vec3( 0., 0., 0. );
        dir = selfPosition - central;
        dist = length( dir );

        dir.y *= 2.5;
        velocity -= normalize( dir ) * delta * 5.;

        for ( float y = 0.0; y < height; y++ ) {
          for ( float x = 0.0; x < width; x++ ) {

            vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
            birdPosition = texture2D( texturePosition, ref ).xyz;

            dir = birdPosition - selfPosition;
            dist = length( dir );

            if ( dist < 0.0001 ) continue;

            distSquared = dist * dist;

            if ( distSquared > zoneRadiusSquared ) continue;

            percent = distSquared / zoneRadiusSquared;

            if ( percent < separationThresh ) { // low

              // Separation - Move apart for comfort
              f = ( separationThresh / percent - 1.0 ) * delta;
              velocity -= normalize( dir ) * f;

            } else if ( percent < alignmentThresh ) { // high

              // Alignment - fly the same direction
              float threshDelta = alignmentThresh - separationThresh;
              float adjustedPercent = ( percent - separationThresh ) / threshDelta;

              birdVelocity = texture2D( textureVelocity, ref ).xyz;

              f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
              velocity += normalize( birdVelocity ) * f;

            } else {

              // Attraction / Cohesion - move closer
              float threshDelta = 1.0 - alignmentThresh;
              float adjustedPercent;
              if( threshDelta == 0. ) adjustedPercent = 1.;
              else adjustedPercent = ( percent - alignmentThresh ) / threshDelta;

              f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;

              velocity += normalize( dir ) * f;

            }

          }

        }



        // this make tends to fly around than down or up
        // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);

        // Speed Limits
        if ( length( velocity ) > limit ) {
          velocity = normalize( velocity ) * limit;
        }

        gl_FragColor = vec4( velocity, 1.0 );
      }
    `;
    this.birdVS = `
      attribute vec2 reference;
      attribute float birdVertex;

      attribute vec3 birdColor;

      uniform sampler2D texturePosition;
      uniform sampler2D textureVelocity;

      varying vec4 vColor;
      varying float z;

      uniform float time;

      void main() {

        vec4 tmpPos = texture2D( texturePosition, reference );
        vec3 pos = tmpPos.xyz;
        vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

        vec3 newPosition = position;

        if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
          // flap wings
          newPosition.y = sin( tmpPos.w ) * 5.;
        }

        newPosition = mat3( modelMatrix ) * newPosition;


        velocity.z *= -1.;
        float xz = length( velocity.xz );
        float xyz = 1.;
        float x = sqrt( 1. - velocity.y * velocity.y );

        float cosry = velocity.x / xz;
        float sinry = velocity.z / xz;

        float cosrz = x / xyz;
        float sinrz = velocity.y / xyz;

        mat3 maty =  mat3(
          cosry, 0, -sinry,
          0    , 1, 0     ,
          sinry, 0, cosry

        );

        mat3 matz =  mat3(
          cosrz , sinrz, 0,
          -sinrz, cosrz, 0,
          0     , 0    , 1
        );

        newPosition =  maty * matz * newPosition;
        newPosition += pos;

        z = newPosition.z;

        vColor = vec4( birdColor, 1.0 );
        gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
      }
    `;
    this.birdFS = `
      varying vec4 vColor;
      varying float z;

      uniform vec3 color;

      void main() {
        // Fake colors for now
        float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
        gl_FragColor = vec4( z2, z2, z2, 1. );
      }
    `;
    this.params = {
      separation: 20.0,
      alignment: 20.0,
      cohesion: 20.0,
      freedom: 0.75,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.fog = new THREE.Fog(0xffffff, 100, 1000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 3000);
    this.camera.position.z = 350;

    // 渲染器
    this.createRenderer();
    // 初始化
    this.initComputeRenderer();
    this.velocityHandle();
    // 实例化
    this.initBirds();

    this.bind();
    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = e.clientX - this.half.x;
        const y = e.clientX - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        const x = e.clientX - this.half.x;
        const y = e.clientX - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    }
  }

  private velocityHandle() {
    this.velocityUniforms['separationDistance'].value = this.params.separation;
    this.velocityUniforms['alignmentDistance'].value = this.params.alignment;
    this.velocityUniforms['cohesionDistance'].value = this.params.cohesion;
    this.velocityUniforms['freedomFactor'].value = this.params.freedom;
  }

  private setGUI() {
    this.gui.add(this.params, 'separation', 0.0, 100.0, 1.0).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'alignment', 0.0, 100, 0.001).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'cohesion', 0.0, 100, 0.025).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'freedom', 0.0, 10, 0.1).onChange(() => {
      this.velocityHandle();
    });
  }

  private fillPositionTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;

    for (let k = 0; k < array.length; k += 4) {
      const x = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const y = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const z = Math.random() * this.BOUNDS - this.BOUNDS_HALF;

      array[k + 0] = x;
      array[k + 1] = y;
      array[k + 2] = z;
      array[k + 3] = 1;
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;

    for (let k = 0; k < array.length; k += 4) {
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;

      array[k + 0] = x * 10;
      array[k + 1] = y * 10;
      array[k + 2] = z * 10;
      array[k + 3] = 1;
    }
  }

  private initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, this.renderer!);

    if (this.renderer!.capabilities.isWebGL2 === false) {
      this.gpuCompute.setDataType(THREE.HalfFloatType);
    }

    const dtPosition = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();

    this.fillPositionTexture(dtPosition);
    this.fillVelocityTexture(dtVelocity);

    this.positionVariable = this.gpuCompute.addVariable('texturePosition', this.fragmentShaderPosition, dtPosition);
    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', this.fragmentShaderVelocity, dtVelocity);

    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms['time'] = { value: 0.0 };
    this.positionUniforms['delta'] = { value: 0.0 };

    this.velocityUniforms['time'] = { value: 1.0 };
    this.velocityUniforms['delta'] = { value: 0.0 };
    this.velocityUniforms['testing'] = { value: 1.0 };
    this.velocityUniforms['separationDistance'] = { value: 1.0 };
    this.velocityUniforms['alignmentDistance'] = { value: 1.0 };
    this.velocityUniforms['cohesionDistance'] = { value: 1.0 };
    this.velocityUniforms['freedomFactor'] = { value: 1.0 };
    this.velocityUniforms['predator'] = { value: new THREE.Vector3() };

    this.velocityVariable.material.defines.BOUNDS = this.BOUNDS.toFixed(2);

    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    this.velocityVariable.wrapS = THREE.RepeatWrapping;
    this.velocityVariable.wrapT = THREE.RepeatWrapping;

    const error = this.gpuCompute.init();
    if (error !== null) { console.error(error); }
  }

  private initBirds() {
    const geometry = new BirdGeometry(this.WIDTH, this.BIRDS);

    this.birdUniforms = {
      'time': { value: 1.0 },
      'delta': { value: 0.0 },
      'texturePosition': { value: null },
      'textureVelocity': { value: null },
      'color': { value: new THREE.Color(0xff2200) },
    };

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: this.birdUniforms,
      vertexShader: this.birdVS,
      fragmentShader: this.birdFS,
    });

    const bird = new THREE.Mesh(geometry, material);
    bird.rotation.y = Math.PI / 2;
    bird.matrixAutoUpdate = false;
    bird.updateMatrix();
    this.scene.add(bird);
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

    {
      const now = performance.now();
      let delta = (now - this.last) / 1000;

      if (delta > 1) {delta = 1;}

      this.last = now;

      this.positionUniforms['time'].value = now;
      this.positionUniforms['delta'].value = delta;

      this.velocityUniforms['time'].value = now;
      this.velocityUniforms['delta'].value = delta;

      this.birdUniforms['time'].value = now;
      this.birdUniforms['delta'].value = delta;

      {
        const x = 0.5 * this.mouse.x / this.half.x;
        const y = -0.5 * this.mouse.y / this.half.y;
        const z = 0;
        this.velocityUniforms['predator'].value.set(x, y, z);

        this.mouse.set(10000, 10000);
      }

      this.gpuCompute!.compute();
      this.birdUniforms['texturePosition'].value = this.gpuCompute!.getCurrentRenderTarget(this.positionVariable).texture;
      this.birdUniforms['textureVelocity'].value = this.gpuCompute!.getCurrentRenderTarget(this.velocityVariable).texture;
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.onpointermove = null;
    window.ontouchmove = null;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.half.set(this.width/2, this.height/2);

      this.bind();

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

