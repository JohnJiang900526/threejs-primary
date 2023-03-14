import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import { GUI } from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MD2Character } from 'three/examples/jsm/misc/MD2Character';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  private character: MD2Character
  private gui: null | GUI
  private playbackConfig: {
    speed: number,
    wireframe: boolean
  }
  private clock: THREE.Clock
  private config: {
    baseUrl: string,
    body: string,
    skins: string[],
    weapons: [string, string][]
  }
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

    this.character = new MD2Character();
    this.gui = null;
    this.playbackConfig = {
      speed: 1,
      wireframe: false
    };
    this.clock = new THREE.Clock();
    this.config = {
      baseUrl: '/examples/models/md2/ratamahatta/',
      body: 'ratamahatta.md2',
      skins: [
        'ratamahatta.png', 'ctf_b.png', 'ctf_r.png',
        'dead.png', 'gearwhore.png'
      ],
      weapons: [
        [ 'weapon.md2', 'weapon.png' ],
        [ 'w_bfg.md2', 'w_bfg.png' ],
        [ 'w_blaster.md2', 'w_blaster.png' ],
        [ 'w_chaingun.md2', 'w_chaingun.png' ],
        [ 'w_glauncher.md2', 'w_glauncher.png' ],
        [ 'w_hyperblaster.md2', 'w_hyperblaster.png' ],
        [ 'w_machinegun.md2', 'w_machinegun.png' ],
        [ 'w_railgun.md2', 'w_railgun.png' ],
        [ 'w_rlauncher.md2', 'w_rlauncher.png' ],
        [ 'w_shotgun.md2', 'w_shotgun.png' ],
        [ 'w_sshotgun.md2', 'w_sshotgun.png' ]
      ]
    };
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 400, 1000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(0, 150, 400);

    // 加载模型
    this.loadModel();

    // 创建光照
    this.createLight();

    // 创建地板
    this.createFloor();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 50, 0);
    this.controls.update();

    this.guiInit();
    
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private labelize(text: string) {
    const parts = text.split('.');
    if (parts.length > 1) {
      parts.length -= 1;
      return parts.join('.');
    }
    return text;
  }

  private setupSkinsGUI() {
    const character = this.character;
    const gui = this.gui as GUI;
    const folder = gui.addFolder("皮肤");

    const generateCallback = function (i: number) {
      return () => { character.setSkin(i); };
    };

    for ( let i = 0; i < character.skinsBody.length; i++ ) {
      const name = character.skinsBody[ i ].name;
      // @ts-ignore
      this.playbackConfig[name] = generateCallback(i);
      folder.add(this.playbackConfig, name).name(this.labelize(name));
    }
  }

  private setupWeaponsGUI() {
    const character = this.character;
    const gui = this.gui as GUI;
    const folder = gui.addFolder("武器");

    const generateCallback = function (i: number) {
      return () => { character.setWeapon(i); };
    };

    for (let i = 0; i < character.weapons.length; i++) {
      const name = character.weapons[i].name as string;
      // @ts-ignore
      this.playbackConfig[name] = generateCallback(i);
      folder.add(this.playbackConfig, name ).name(this.labelize(name));
    }
  }
  private setupGUIAnimations() {
    const character = this.character;
    const gui = this.gui as GUI;

    const folder = gui.addFolder("动画");

    const generateCallback = function (animationClip: THREE.AnimationClip) {
      return () => {
        character.setAnimation(animationClip.name)
      };
    };

    // @ts-ignore
    const animations = character.meshBody.geometry.animations;
    for ( let i = 0; i < animations.length; i++) {
      const clip = animations[i];
      // @ts-ignore
      this.playbackConfig[clip.name] = generateCallback(clip);
      folder.add(this.playbackConfig, clip.name, clip.name);
    }
  }

  // 加载模型
  private loadModel() {
    this.character.scale = 3;

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.character.loadParts(this.config);
    this.character.onLoadComplete = () => {
      toast.close();

      this.setupSkinsGUI();
      this.setupWeaponsGUI();
      this.setupGUIAnimations();

      if (this.character.meshBody) {
        // @ts-ignore
        this.character.setAnimation(this.character.meshBody.geometry.animations[0].name );
      }
    };
    this.scene.add(this.character.root);
  }

  // 创建地板
  private createFloor() {
    const texture = new THREE.TextureLoader().load("/examples/textures/terrain/grasslight-big.jpg");
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    const material = new THREE.MeshPhongMaterial({color: 0xffffff, map: texture});

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = - Math.PI / 2;
    (ground.material.map as THREE.Texture).repeat.set(8, 8);
    (ground.material.map as THREE.Texture).wrapS = THREE.RepeatWrapping;
    (ground.material.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    (ground.material.map as THREE.Texture).encoding = THREE.sRGBEncoding;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 创建光源
  private createLight() {
    const ambient = new THREE.AmbientLight(0x222222);

    const light1 = new THREE.SpotLight(0xffffff, 5, 1000);
    light1.position.set(200, 250, 500);
    light1.angle = 0.5;
    light1.penumbra = 0.5;
    light1.castShadow = true;
    light1.shadow.mapSize.set(1024, 1024);

    const light2 = new THREE.SpotLight(0xffffff, 5, 1000);
    light2.position.set(-100, 350, 350);
    light2.angle = 0.5;
    light2.penumbra = 0.5;
    light2.castShadow = true;
    light2.shadow.mapSize.set(1024, 1024);

    this.scene.add(ambient, light1, light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // gui
  private guiInit() {
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.gui.add(this.playbackConfig, 'speed', 0, 2 ).onChange(() => {
      this.character.setPlaybackRate( this.playbackConfig.speed );
    });

    this.gui.add(this.playbackConfig, 'wireframe').onChange(() => {
      this.character.setWireframe(this.playbackConfig.wireframe);
    });
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
    if (this.character) { this.character.update(this.clock.getDelta()); }

    // 执行渲染
    if (this.camera && this.renderer) {
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

