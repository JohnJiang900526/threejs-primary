import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import type { IUniform } from 'three';
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

  private gui: GUI;
  private WIDTH: number;
  private BIRDS: number;
  private BirdGeometry: THREE.BufferGeometry;
  private textureAnimation: THREE.DataTexture;
  private durationAnimation: number;
  private birdMesh: THREE.Mesh;
  private materialShader: any;
  private indicesPerBird: number;

  private gltfs: string[];
  private colors: number[];
  private sizes: number[];
  private selectModel: number;

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

  private params: {
    separation: number;
    alignment: number;
    cohesion: number;
    freedom: number;
    size: number;
    count: number;
  }

  private fragmentShaderPosition: string;
  private fragmentShaderVelocity: string;
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
    this.WIDTH = 64;
    this.BIRDS = this.WIDTH * this.WIDTH;
    this.BirdGeometry = new THREE.BufferGeometry();
    this.textureAnimation = new THREE.DataTexture();
    this.durationAnimation = 0;
    this.birdMesh = new THREE.Mesh();
    this.materialShader = null;
    this.indicesPerBird = 0;

    this.gltfs = ['/examples/models/gltf/Parrot.glb', '/examples/models/gltf/Flamingo.glb'];
    this.colors = [0xccFFFF, 0xffdeff];
    this.sizes = [0.2, 0.1];
    this.selectModel = Math.floor(Math.random() * this.gltfs.length);

    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2();
    this.BOUNDS = 800;
    this.BOUNDS_HALF = this.BOUNDS/2;
    this.last = performance.now();
    this.gpuCompute = null;
    this.velocityVariable = {};
    this.positionVariable = {}
    this.positionUniforms = {};
    this.velocityUniforms = {};

    this.params = {
      separation: 20.0,
      alignment: 20.0,
      cohesion: 20.0,
      freedom: 0.75,
      size: this.sizes[this.selectModel],
      count: Math.floor(this.BIRDS / 4)
    };

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
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors[this.selectModel]);
    this.scene.fog = new THREE.Fog(this.colors[this.selectModel], 100, 1000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 3000);
    this.camera.position.z = 350;

    // 灯光
    this.generateLight();
    // 渲染器
    this.createRenderer();
    // 初始化
    this.initComputeRenderer();
    
    {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.setBirdGeometry().then(() => {
        toast.close();
  
        this.initBirds();
        // 执行默认函数
        this.velocityHandle();
  
        this.setGUI();
      }).catch(() => {
        toast.close();
      });
    }

    this.bind();
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

    if (this.materialShader) {
      this.materialShader.uniforms['size'].value = this.params.size;
    }
    this.BirdGeometry.setDrawRange(0, this.indicesPerBird * this.params.count);
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
    this.gui.add(this.params, 'size', 0, 1, 0.01).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'count', 0, this.BIRDS, 1).onChange(() => {
      this.velocityHandle();
    });
    this.gui.close();
  }

  private generateLight() {
    const light1 = new THREE.HemisphereLight(this.colors[this.selectModel], 0xffffff, 1.6);
    light1.color.setHSL(0.6, 1, 0.6);
    light1.groundColor.setHSL(0.095, 1, 0.75);
    light1.position.set(0, 50, 0);

    const light2 = new THREE.DirectionalLight(0x00CED1, 0.6);
    light2.color.setHSL(0.1, 1, 0.95);
    light2.position.set(- 1, 1.75, 1);
    light2.position.multiplyScalar(30);
   
    this.scene.add(light1, light2);
  }

  private nextPowerOf2(n: number) {
    return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2)));
  }

  private lerp(value1: number, value2: number, amount: number) {
    const num = Math.max(Math.min(amount, 1), 0);
    return value1 + (value2 - value1) * num;
  }

  // 初始化 BirdGeometry
  private async setBirdGeometry() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(this.gltfs[this.selectModel]);

    const animations = gltf.animations;
    this.durationAnimation = Math.round(animations[0].duration * 60);

    const birdGeo = (gltf.scene.children[0] as THREE.Mesh).geometry;
    const morphAttributes = birdGeo.morphAttributes.position;
    const tHeight = this.nextPowerOf2(this.durationAnimation);
    const tWidth = this.nextPowerOf2(birdGeo.getAttribute('position').count);

    this.indicesPerBird = birdGeo.index!.count;
    const tData = new Float32Array(4 * tWidth * tHeight);

    for (let i = 0; i < tWidth; i++) {
      for (let j = 0; j < tHeight; j++) {
        const offset = j * tWidth * 4;
        const curMorph = Math.floor(j / this.durationAnimation * morphAttributes.length);
        const nextMorph = (Math.floor(j / this.durationAnimation * morphAttributes.length) + 1) % morphAttributes.length;
        const lerpAmount = j / this.durationAnimation * morphAttributes.length % 1;

        if (j < this.durationAnimation) {
          let d0, d1;
          d0 = morphAttributes[curMorph].array[i * 3];
          d1 = morphAttributes[nextMorph].array[i * 3];

          if (d0 !== undefined && d1 !== undefined) tData[offset + i * 4] = this.lerp(d0, d1, lerpAmount);

          d0 = morphAttributes[curMorph].array[i * 3 + 1];
          d1 = morphAttributes[nextMorph].array[i * 3 + 1];

          if (d0 !== undefined && d1 !== undefined) tData[offset + i * 4 + 1] = this.lerp(d0, d1, lerpAmount);

          d0 = morphAttributes[curMorph].array[i * 3 + 2];
          d1 = morphAttributes[nextMorph].array[i * 3 + 2];

          if (d0 !== undefined && d1 !== undefined) tData[offset + i * 4 + 2] = this.lerp(d0, d1, lerpAmount);

          tData[offset + i * 4 + 3] = 1;
        }
      }
    }

    this.textureAnimation = new THREE.DataTexture(tData, tWidth, tHeight, THREE.RGBAFormat, THREE.FloatType);
    this.textureAnimation.needsUpdate = true;

    const vertices: number[] = [], color: number[] = [];
    const reference: number[] = [], seeds: number[] = [];
    const indices: number[] = [];

    const totalVertices = birdGeo.getAttribute('position').count * 3 * this.BIRDS;
    for (let i = 0; i < totalVertices; i++) {
      const position = birdGeo.getAttribute('position') as THREE.BufferAttribute;
      const index = i % (position.count * 3);
      vertices.push(position.array[index]);

      const ca = birdGeo.getAttribute('color') as THREE.BufferAttribute;
      color.push(ca.array[index]);
    }

    {
      const position = birdGeo.getAttribute('position') as THREE.BufferAttribute;
      const num = position.count * this.BIRDS;
      let r = Math.random();
      for (let i = 0; i < num; i++) {
        const bIndex = i % (position.count);
        const bird = Math.floor(i / position.count);
        if (bIndex == 0) {
          r = Math.random();
        }
        const j = ~~bird;
        const x = (j % this.WIDTH) / this.WIDTH;
        const y = ~~(j / this.WIDTH) / this.WIDTH;

        reference.push(x, y, bIndex / tWidth, this.durationAnimation / tHeight);
        seeds.push(bird, r, Math.random(), Math.random());
      }
    }

    {
      const position = birdGeo.getAttribute('position') as THREE.BufferAttribute;
      const index = birdGeo.index as THREE.BufferAttribute;
      const num = index!.array.length * this.BIRDS;
      for (let i = 0; i < num; i++) {
        const offset = Math.floor(i /index.array.length) * (position.count);
        indices.push(index.array[i % index.array.length] + offset);
      }
    }

    const positionAttr = new THREE.BufferAttribute(new Float32Array(vertices), 3);
    this.BirdGeometry.setAttribute('position', positionAttr);

    const birdColorAttr = new THREE.BufferAttribute(new Float32Array(color), 3);
    this.BirdGeometry.setAttribute('birdColor', birdColorAttr);

    const colorAttr = new THREE.BufferAttribute(new Float32Array(color), 3);
    this.BirdGeometry.setAttribute('color', colorAttr);

    const referenceAttr = new THREE.BufferAttribute(new Float32Array(reference), 4);
    this.BirdGeometry.setAttribute('reference', referenceAttr);

    const seedsAttr = new THREE.BufferAttribute(new Float32Array(seeds), 4);
    this.BirdGeometry.setAttribute('seeds', seedsAttr);

    this.BirdGeometry.setIndex(indices);
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
    const geometry = this.BirdGeometry;

    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      flatShading: true,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.texturePosition = { value: null };
      shader.uniforms.textureVelocity = { value: null };
      shader.uniforms.textureAnimation = { value: this.textureAnimation };
      shader.uniforms.time = { value: 1.0 };
      shader.uniforms.size = { value: this.params.size };
      shader.uniforms.delta = { value: 0.0 };

      let token = '#define STANDARD';

      let insert = `
        attribute vec4 reference;
        attribute vec4 seeds;
        attribute vec3 birdColor;
        uniform sampler2D texturePosition;
        uniform sampler2D textureVelocity;
        uniform sampler2D textureAnimation;
        uniform float size;
        uniform float time;
      `;

      shader.vertexShader = shader.vertexShader.replace(token, token + insert);

      token = '#include <begin_vertex>';

      insert = `
        vec4 tmpPos = texture2D( texturePosition, reference.xy );

        vec3 pos = tmpPos.xyz;
        vec3 velocity = normalize(texture2D( textureVelocity, reference.xy ).xyz);
        vec3 aniPos = texture2D( textureAnimation, vec2( reference.z, mod( time + ( seeds.x ) * ( ( 0.0004 + seeds.y / 10000.0) + normalize( velocity ) / 20000.0 ), reference.w ) ) ).xyz;
        vec3 newPosition = position;

        newPosition = mat3( modelMatrix ) * ( newPosition + aniPos );
        newPosition *= size + seeds.y * size * 0.2;

        velocity.z *= -1.;
        float xz = length( velocity.xz );
        float xyz = 1.;
        float x = sqrt( 1. - velocity.y * velocity.y );

        float cosry = velocity.x / xz;
        float sinry = velocity.z / xz;

        float cosrz = x / xyz;
        float sinrz = velocity.y / xyz;

        mat3 maty =  mat3( cosry, 0, -sinry, 0    , 1, 0     , sinry, 0, cosry );
        mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0     , 0    , 1 );

        newPosition =  maty * matz * newPosition;
        newPosition += pos;

        vec3 transformed = vec3( newPosition );
      `;

      shader.vertexShader = shader.vertexShader.replace(token, insert);
      this.materialShader = shader;
    };

    this.birdMesh = new THREE.Mesh(geometry, material);
    this.birdMesh.rotation.y = Math.PI / 2;
    this.birdMesh.castShadow = true;
    this.birdMesh.receiveShadow = true;
    this.scene.add(this.birdMesh);
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

      if (delta > 1) { delta = 1; }
      this.last = now;

      this.positionUniforms['time'].value = now;
      this.positionUniforms['delta'].value = delta;
      this.velocityUniforms['time'].value = now;
      this.velocityUniforms['delta'].value = delta;
      if (this.materialShader) {
        this.materialShader.uniforms['time'].value = now / 1000;
        this.materialShader.uniforms['delta'].value = delta;
      }

      const x = 0.5 * this.mouse.x / this.half.x;
      const y = -0.5 * this.mouse.y / this.half.y;
      this.velocityUniforms['predator'].value.set(x, y, 0);
      this.mouse.set(10000, 10000);

      this.gpuCompute!.compute();
      if (this.materialShader) {
        this.materialShader.uniforms['texturePosition'].value = this.gpuCompute!.getCurrentRenderTarget(this.positionVariable).texture;
        this.materialShader.uniforms['textureVelocity'].value = this.gpuCompute!.getCurrentRenderTarget(this.velocityVariable).texture;
      }
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
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

