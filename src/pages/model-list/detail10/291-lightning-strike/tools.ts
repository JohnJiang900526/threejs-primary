import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LightningStrike, type LightningSegment, type LightningSubray } from 'three/examples/jsm/geometries/LightningStrike';
import { LightningStorm } from 'three/examples/jsm/objects/LightningStorm';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private stats: null | Stats;
  private animateNumber: number;

  private gui: GUI;

  private composer: null | EffectComposer;
  private currentSceneIndex: number;
  private currentTime: number;
  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width / this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.stats = null;
    this.animateNumber = 0;

    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });

    this.composer = null;
    this.currentSceneIndex = 2;
    this.currentTime = 0;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  init() {
    // 渲染器
    this.createRenderer();
    this.composer = new EffectComposer(this.renderer!);

    // 场景
    this.generateScane();

    this.initStats();
    this.animate();
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
    this.gui.close();

    {
      this.scene.userData.sceneIndex = this.currentSceneIndex;
      this.scene.userData.timeRate = 1;
      this.scene.userData.lightningColorRGB = [
        this.scene.userData.lightningColor.r * 255,
        this.scene.userData.lightningColor.g * 255,
        this.scene.userData.lightningColor.b * 255
      ];
      this.scene.userData.outlineColorRGB = [
        this.scene.userData.outlineColor.r * 255,
        this.scene.userData.outlineColor.g * 255,
        this.scene.userData.outlineColor.b * 255
      ];
    }

    const sceneFolder = this.gui.addFolder('场景参数');
    const scaneIndexValues = { '电锥': 0, '灯泡': 1, '风暴': 2 };
    sceneFolder.add(this.scene.userData, 'sceneIndex', scaneIndexValues).name('场景').onChange((value: number) => {
      this.currentSceneIndex = value;
      this.generateScane();
    });
    const canGo = this.scene.userData.canGoBackwardsInTime;
    sceneFolder.add(this.scene.userData, 'timeRate', canGo ? -1 : 0, 1).name('渲染频率');
  
    
    const graphicsFolder = this.gui.addFolder('图形');
    graphicsFolder.add(this.scene.userData, 'outlineEnabled').name('是否启用发光');

    graphicsFolder.addColor(this.scene.userData, 'lightningColorRGB').name('颜色').onChange((value: any) => {
      this.scene.userData.lightningMaterial.color.setRGB(value[0], value[1], value[2]).multiplyScalar(1 / 255);
    });

    graphicsFolder.addColor(this.scene.userData, 'outlineColorRGB').name('Glow color').onChange((value: any) => {
      this.scene.userData.outlineColor.setRGB(value[0], value[1], value[2]).multiplyScalar(1 / 255);
    });

    const rayFolder = this.gui.addFolder('射线参数');
    rayFolder.add(this.scene.userData.rayParams, 'straightness', 0, 1).name('Straightness');
    rayFolder.add(this.scene.userData.rayParams, 'roughness', 0, 1).name('Roughness');
    rayFolder.add(this.scene.userData.rayParams, 'radius0', 0.1, 10).name('Initial radius');
    rayFolder.add(this.scene.userData.rayParams, 'radius1', 0.1, 10).name('Final radius');
    rayFolder.add(this.scene.userData.rayParams, 'radius0Factor', 0, 1).name('Subray initial radius');
    rayFolder.add(this.scene.userData.rayParams, 'radius1Factor', 0, 1).name('Subray final radius');
    rayFolder.add(this.scene.userData.rayParams, 'timeScale', 0, 5).name('Ray time scale');
    rayFolder.add(this.scene.userData.rayParams, 'subrayPeriod', 0.1, 10).name('Subray period (s)');
    rayFolder.add(this.scene.userData.rayParams, 'subrayDutyCycle', 0, 1).name('Subray duty cycle');

    if (this.scene.userData.recreateRay) {
      const raySlowFolder = this.gui.addFolder('射线参数(慢速)');

      raySlowFolder.add(this.scene.userData.rayParams, 'ramification', 0, 15).step(1).name('衍生常量').onFinishChange(() => {
        this.scene.userData.recreateRay();
      });

      raySlowFolder.add(this.scene.userData.rayParams, 'maxSubrayRecursion', 0, 5).step(1).name('递归').onFinishChange(() => {
        this.scene.userData.recreateRay();
      });

      raySlowFolder.add(this.scene.userData.rayParams, 'recursionProbability', 0, 1).name('Rec.概率').onFinishChange(() => {
        this.scene.userData.recreateRay();
      });
    }
  }

  private generateScane() {
    switch (this.currentSceneIndex) {
      case 0:
        this.scene = this.createConesScene();
        break;
      case 1:
        this.scene = this.createBallScene();
        break;
      case 2:
        this.scene = this.createStormScene();
        break;
      default:
        this.scene = this.createConesScene();
    }

    this.setGUI();
  }

  private createOutline(scene: THREE.Scene, objectsArray: THREE.Mesh[], visibleColor: THREE.Color) {
    const outlinePass = new OutlinePass(new THREE.Vector2(this.width, this.height), scene, scene.userData.camera, objectsArray);
    outlinePass.edgeStrength = 2.5;
    outlinePass.edgeGlow = 0.7;
    outlinePass.edgeThickness = 2.8;
    outlinePass.visibleEdgeColor = visibleColor;
    outlinePass.hiddenEdgeColor.set(0);

    this.composer!.addPass(outlinePass);
    scene.userData.outlineEnabled = true;

    return outlinePass;
  }

  // 带闪电的锥形
  private createConesScene() {
    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.userData.canGoBackwardsInTime = true;
    scene.userData.camera = new THREE.PerspectiveCamera(50, this.aspect, 200, 100000);

    // 光线
    scene.userData.lightningColor = new THREE.Color(0xB0FFFF);
    scene.userData.outlineColor = new THREE.Color(0x00FFFF);

    const posLight = new THREE.PointLight(0x00ffff, 1, 5000, 2);
    scene.add(posLight);

    // 地板
    const geometry = new THREE.PlaneGeometry(200000, 200000);
    const material = new THREE.MeshPhongMaterial({ color: 0xC0C0C0, shininess: 0 });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = - Math.PI * 0.5;
    scene.add(ground);

    // 圆锥
    const distance = 1000;
    const height = 200;
    const heightHalf = height * 0.5;

    posLight.position.set(0, (distance + height) * 0.5, 0);
    posLight.color = scene.userData.outlineColor;

    scene.userData.camera.position.set(
      5 * height,
      4 * height,
      18 * height,
    );

    const geometry1 = new THREE.ConeGeometry(height, height, 30, 1, false);
    const material1 = new THREE.MeshPhongMaterial({ color: 0xFFFF00, emissive: 0x1F1F00 });
    const coneMesh1 = new THREE.Mesh(geometry1, material1);
    coneMesh1.rotation.x = Math.PI;
    coneMesh1.position.y = distance + height;
    scene.add(coneMesh1);

    const geometry2 = coneMesh1.geometry.clone();
    const material2 = new THREE.MeshPhongMaterial({ color: 0xFF2020, emissive: 0x1F0202 });
    const coneMesh2 = new THREE.Mesh(geometry2, material2);
    coneMesh2.position.y = heightHalf;
    scene.add(coneMesh2);

    // 雷电
    scene.userData.lightningMaterial = new THREE.MeshBasicMaterial({
      color: scene.userData.lightningColor
    });

    scene.userData.rayParams = {
      sourceOffset: new THREE.Vector3(0, 0, 0),
      destOffset: new THREE.Vector3(0, 0, 0),
      radius0: 4,
      radius1: 4,
      minRadius: 2.5,
      maxIterations: 7,
      isEternal: true,
      timeScale: 0.7,
      propagationTimeFactor: 0.05,
      vanishingTimeFactor: 0.95,
      subrayPeriod: 3.5,
      subrayDutyCycle: 0.6,
      maxSubrayRecursion: 3,
      ramification: 7,
      recursionProbability: 0.6,
      roughness: 0.85,
      straightness: 0.6
    };

    let lightningStrike: null | LightningStrike = null;
    let lightningStrikeMesh: null | THREE.Mesh = null;
    const outlineMeshArray: THREE.Mesh[] = [];

    // 重建射线
    scene.userData.recreateRay = () => {
      if (lightningStrikeMesh) {
        scene.remove(lightningStrikeMesh);
      }

      lightningStrike = new LightningStrike(scene.userData.rayParams);
      lightningStrikeMesh = new THREE.Mesh(lightningStrike, scene.userData.lightningMaterial);

      outlineMeshArray.length = 0;
      outlineMeshArray.push(lightningStrikeMesh);

      scene.add(lightningStrikeMesh);
    };
    scene.userData.recreateRay();

    // composer 渲染
    const renderPass = new RenderPass(scene, scene.userData.camera);
    this.composer!.passes = [];
    this.composer!.addPass(renderPass);
    this.createOutline(scene, outlineMeshArray, scene.userData.outlineColor);

    // 控制器
    const controls = new OrbitControls(scene.userData.camera, this.renderer!.domElement);
    controls.target.y = (distance + height) * 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.userData.render = (time: number) => {
      // 移动锥体和更新射线位置
      // 第一个锥形位置
      coneMesh1.position.set(
        Math.sin(0.5 * time) * distance * 0.6,
        distance + height,
        Math.cos(0.5 * time) * distance * 0.6,
      );
      // 第二个锥形体的位置
      coneMesh2.position.set(
        Math.sin(0.9 * time) * distance,
        heightHalf,
        0,
      );

      // 闪电的上边位置
      // @ts-ignore
      lightningStrike!.rayParameters.sourceOffset.copy(coneMesh1.position);
      // @ts-ignore
      lightningStrike!.rayParameters.sourceOffset.y -= heightHalf;

      // 闪电的下边位置
      // @ts-ignore
      lightningStrike!.rayParameters.destOffset.copy(coneMesh2.position);
      // @ts-ignore
      lightningStrike!.rayParameters.destOffset.y += heightHalf;

      lightningStrike!.update(time);
      controls.update();

      // 更新点光位置到光线的中间
      // @ts-ignore
      const rayParameters = lightningStrike!.rayParameters;
      const { sourceOffset, destOffset } = rayParameters;
      posLight.position.lerpVectors( sourceOffset, destOffset, 0.5);

      if (scene.userData.outlineEnabled) {
        this.composer!.render();
      } else {
        this.renderer!.render(scene, scene.userData.camera);
      }
    };

    return scene;
  }
  // 电灯泡
  private createBallScene() {
    const scene = new THREE.Scene();
    scene.userData.canGoBackwardsInTime = true;
    scene.userData.camera = new THREE.PerspectiveCamera(50, this.aspect, 100, 50000);

    const ballScene = new THREE.Scene();
    ballScene.background = new THREE.Color(0x454545);

    // 光线
    const ambientLight = new THREE.AmbientLight(0x444444);
    ballScene.add(ambientLight);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(1, 1, 1);
    ballScene.add(light1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 1.5);
    light2.position.set(-0.5, 1, 0.2);
    ballScene.add(light2);
    scene.add(light2);

    // 等离子体球
    scene.userData.lightningColor = new THREE.Color(0xFFB0FF);
    scene.userData.outlineColor = new THREE.Color(0xFF00FF);

    scene.userData.lightningMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      color: scene.userData.lightningColor,
    });

    const path = "/examples/textures/cube/Bridge2/";
    const urls = [
      'posx.jpg', 'negx.jpg',
      'posy.jpg', 'negy.jpg',
      'posz.jpg', 'negz.jpg',
    ];

    const loader = (new THREE.CubeTextureLoader()).setPath(path);
    const textureCube = loader.load(urls);
    textureCube.mapping = THREE.CubeReflectionMapping;
    textureCube.encoding = THREE.sRGBEncoding;

    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      transparent: true,
      transmission: .96,
      depthWrite: false,
      color: 'white',
      metalness: 0,
      roughness: 0,
      envMap: textureCube
    });

    const sphereHeight = 300;
    const sphereRadius = 200;

    scene.userData.camera.position.set(5 * sphereRadius, 2 * sphereHeight, 6 * sphereRadius);

    const geometry = new THREE.SphereGeometry(sphereRadius, 80, 40);
    const sphereMesh = new THREE.Mesh(geometry, sphereMaterial);
    sphereMesh.position.set(0, sphereHeight, 0);
    ballScene.add(sphereMesh);

    const sphere = new THREE.Sphere(sphereMesh.position, sphereRadius);
    const geometry1 = new THREE.SphereGeometry(sphereRadius * 0.05, 24, 12);
    const spherePlasma = new THREE.Mesh(geometry1, scene.userData.lightningMaterial);
    spherePlasma.position.copy(sphereMesh.position);
    spherePlasma.scale.y = 0.6;
    scene.add(spherePlasma);

    const geometry2 = new THREE.CylinderGeometry(sphereRadius * 0.06, sphereRadius * 0.06, sphereHeight, 6, 1, true)
    const material2 = new THREE.MeshLambertMaterial({ color: 0x020202 });
    const post = new THREE.Mesh(geometry2, material2);
    post.position.y = (sphereHeight * 0.5 - sphereRadius * 0.05 * 1.2);
    scene.add(post);

    const geometry3 = new THREE.BoxGeometry(sphereHeight * 0.5, sphereHeight * 0.1, sphereHeight * 0.5);
    const box = new THREE.Mesh(geometry3, post.material);
    box.position.y = sphereHeight * 0.05 * 0.5;
    scene.add(box);

    const rayDirection = new THREE.Vector3();
    const vec1 = new THREE.Vector3();
    const vec2 = new THREE.Vector3();
    let rayLength = 0;

    scene.userData.rayParams = {
      sourceOffset: sphereMesh.position,
      destOffset: new THREE.Vector3(sphereRadius, 0, 0).add(sphereMesh.position),
      radius0: 4,
      radius1: 4,
      radius0Factor: 0.82,
      minRadius: 2.5,
      maxIterations: 6,
      isEternal: true,

      timeScale: 0.6,
      propagationTimeFactor: 0.15,
      vanishingTimeFactor: 0.87,
      subrayPeriod: 0.8,
      ramification: 5,
      recursionProbability: 0.8,

      roughness: 0.85,
      straightness: 0.7,

      onSubrayCreation: (segment: LightningSegment, parentSubray: LightningSubray, childSubray: LightningSubray, lightningStrike: LightningStrike) => {
        // @ts-ignore
        lightningStrike?.subrayConePosition(segment, parentSubray, childSubray, 0.6, 0.9, 0.7);

        // 投影
        // @ts-ignore
        vec1.subVectors(childSubray.pos1, lightningStrike.rayParameters.sourceOffset);
        vec2.set(0, 0, 0);

        // @ts-ignore
        if (lightningStrike.randomGenerator.random() < 0.7) {
          vec2.copy(rayDirection).multiplyScalar(rayLength * 1.0865);
        }

        vec1.add(vec2).setLength(rayLength);
        // @ts-ignore
        childSubray.pos1.addVectors(vec1, lightningStrike.rayParameters.sourceOffset);
      }
    };

    let lightningStrike: null | LightningStrike = null;
    let lightningStrikeMesh: null | THREE.Mesh = null;
    const outlineMeshArray: THREE.Mesh[] = [];

    scene.userData.recreateRay = () => {
      if (lightningStrikeMesh) {
        scene.remove(lightningStrikeMesh);
      }

      lightningStrike = new LightningStrike(scene.userData.rayParams);
      lightningStrikeMesh = new THREE.Mesh(lightningStrike, scene.userData.lightningMaterial);

      outlineMeshArray.length = 0;
      outlineMeshArray.push(lightningStrikeMesh);
      outlineMeshArray.push(spherePlasma);
      scene.add(lightningStrikeMesh);
    };

    scene.userData.recreateRay();

    // composer 渲染
    const renderPass = new RenderPass(ballScene, scene.userData.camera);
    this.composer!.passes = [];
    this.composer!.addPass(renderPass);

    const rayPass = new RenderPass(scene, scene.userData.camera);
    rayPass.clear = false;
    this.composer!.addPass(rayPass);

    const outlinePass = this.createOutline(scene, outlineMeshArray, scene.userData.outlineColor);

    scene.userData.render = (time: number) => {
      // @ts-ignore
      const rayParameters = lightningStrike!.rayParameters;
      const { destOffset, sourceOffset } = rayParameters;
      rayDirection.subVectors(destOffset, sourceOffset);
      rayLength = rayDirection.length();
      rayDirection.normalize();

      lightningStrike!.update(time);
      controls.update();

      outlinePass.enabled = scene.userData.outlineEnabled;
      this.composer!.render();
    };

    // 控制器
    const controls = new OrbitControls(scene.userData.camera, this.renderer!.domElement);
    controls.target.copy(sphereMesh.position);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const intersection = new THREE.Vector3();
    // 光线投射
    const handle = (e: PointerEvent | Touch) => {
      const x = e.clientX / this.width * 2 - 1;
      const y = -((e.clientY - 45) / this.height) * 2 + 1;
      this.mouse.set(x, y);

      this.raycaster.setFromCamera(this.mouse, scene.userData.camera);
      const result = this.raycaster.ray.intersectSphere(sphere, intersection);

      if (result !== null) {
        // @ts-ignore
        lightningStrike!.rayParameters.destOffset.copy(intersection);
      }
    };

    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];
        handle(e);
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        if (e.isPrimary) { return; }
        handle(e);
      };
    }

    return scene;
  }
  private createStormScene() {
    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.userData.canGoBackwardsInTime = false;
    scene.userData.camera = new THREE.PerspectiveCamera(50, this.aspect, 20, 10000);

    // 光线
    const light0 = new THREE.AmbientLight(0x444444);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(1, 1, 1);

    const posLight = new THREE.PointLight(0x00ffff);
    posLight.position.set(0, 100, 0);
    scene.add(light0, light1, posLight);

    // 地板
    const GROUND_SIZE = 1000;

    scene.userData.camera.position.set(0, 0.2, 1.6).multiplyScalar(GROUND_SIZE * 0.5);
    const geometry1 = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const material1 = new THREE.MeshLambertMaterial({ color: 0x072302 });
    const ground = new THREE.Mesh(geometry1, material1);
    ground.rotation.x = - Math.PI * 0.5;
    scene.add(ground);

    // 风暴
    scene.userData.lightningColor = new THREE.Color(0xB0FFFF);
    scene.userData.outlineColor = new THREE.Color(0x00FFFF);

    scene.userData.lightningMaterial = new THREE.MeshBasicMaterial({ 
      color: scene.userData.lightningColor 
    });

    const rayDirection = new THREE.Vector3(0, -1, 0);
    const vec1 = new THREE.Vector3();
    const vec2 = new THREE.Vector3();
    let rayLength = 0;

    scene.userData.rayParams = {
      radius0: 1,
      radius1: 0.5,
      minRadius: 0.3,
      maxIterations: 7,

      timeScale: 0.15,
      propagationTimeFactor: 0.2,
      vanishingTimeFactor: 0.9,
      subrayPeriod: 4,
      subrayDutyCycle: 0.6,

      maxSubrayRecursion: 3,
      ramification: 3,
      recursionProbability: 0.4,

      roughness: 0.85,
      straightness: 0.65,
      onSubrayCreation: function (segment: LightningSegment, parentSubray: LightningSubray, childSubray: LightningSubray, lightningStrike: LightningStrike) {
        // @ts-ignore
        lightningStrike.subrayConePosition(segment, parentSubray, childSubray, 0.6, 0.6, 0.5);

        // 平面投影
        // @ts-ignore
        const sourceOffset = lightningStrike.rayParameters.sourceOffset;
        rayLength = sourceOffset.y;

        vec1.subVectors(childSubray.pos1, sourceOffset);
        const proj = rayDirection.dot(vec1);
        vec2.copy(rayDirection).multiplyScalar(proj);
        vec1.sub(vec2);

        const scale = proj / rayLength > 0.5 ? rayLength / proj : 1;
        vec2.multiplyScalar(scale);
        vec1.add(vec2);
        childSubray.pos1.addVectors(vec1, sourceOffset);
      }
    };

    // 黑星标记
    const starVertices = [];
    const prevPoint = new THREE.Vector3(0, 0, 1);
    const currPoint = new THREE.Vector3();
    for (let i = 1; i <= 16; i++) {
      currPoint.set(Math.sin(2 * Math.PI * i / 16), 0, Math.cos(2 * Math.PI * i / 16));
      if (i % 2 === 1) {
        currPoint.multiplyScalar(0.3);
      }

      starVertices.push(0, 0, 0);
      starVertices.push(prevPoint.x, prevPoint.y, prevPoint.z);
      starVertices.push(currPoint.x, currPoint.y, currPoint.z);
      prevPoint.copy(currPoint);
    }

    const starGeometry = new THREE.BufferGeometry();
    const positionAttr = new THREE.Float32BufferAttribute(starVertices, 3);
    starGeometry.setAttribute('position', positionAttr);
    const starMesh = new THREE.Mesh(starGeometry, new THREE.MeshBasicMaterial({ color: 0x020900 }));
    starMesh.scale.multiplyScalar(6);

    // 风暴
    const storm = new LightningStorm({
      size: GROUND_SIZE,
      minHeight: 90,
      maxHeight: 200,
      maxSlope: 0.6,
      maxLightnings: 8,
      lightningParameters: scene.userData.rayParams,
      lightningMaterial: scene.userData.lightningMaterial,
      onLightningDown: (lightning) => {
        // 在射线击中时添加黑色星标记
        const star1 = starMesh.clone();
        // @ts-ignore
        star1.position.copy(lightning.rayParameters.destOffset);
        star1.position.y = 0.05;
        star1.rotation.y = 2 * Math.PI * Math.random();
        scene.add(star1);
      }
    });
    scene.add(storm);

    // composer 渲染
    this.composer!.passes = [];
    this.composer!.addPass(new RenderPass(scene, scene.userData.camera));
    // @ts-ignore
    this.createOutline(scene, storm.lightningsMeshes, scene.userData.outlineColor);

    // 控制器
    const controls = new OrbitControls(scene.userData.camera, this.renderer!.domElement);
    controls.target.y = GROUND_SIZE * 0.05;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    scene.userData.render = (time: number) => {
      storm.update(time);
      controls.update();

      if (scene.userData.outlineEnabled) {
        this.composer!.render();
      } else {
        this.renderer!.render(scene, scene.userData.camera);
      }
    };
    return scene;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
      this.currentTime += this.scene.userData.timeRate * this.clock.getDelta();
      if (this.currentTime < 0) { this.currentTime = 0; }
      this.scene.userData.render(this.currentTime);
    }
  }

  // 消除 副作用
  dispose() {
    this.container.onpointermove = null;
    this.container.ontouchmove = null;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width / this.height;

      this.scene.userData.camera.aspect = this.aspect;
      this.scene.userData.camera.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
      this.composer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

