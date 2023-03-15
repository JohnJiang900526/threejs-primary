import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MD2CharacterComplex } from 'three/examples/jsm/misc/MD2CharacterComplex';
import { Gyroscope } from 'three/examples/jsm/misc/Gyroscope';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private cameraControls: null | OrbitControls
  private stats: null | Stats;

  private light: THREE.DirectionalLight
  private characters: MD2CharacterComplex[]
  private nCharacters: number
  private controls: {
    moveForward: boolean,
    moveBackward: boolean,
    moveLeft: boolean,
    moveRight: boolean,
    crouch: boolean
    jump: boolean
    attack: boolean
  }
  private clock: THREE.Clock
  private config: {
    baseUrl: string,
    body: string,
    skins: string[],
    weapons: [string, string][],
    animations: {
      move: 'run',
      idle: 'stand',
      jump: 'jump',
      attack: 'attack',
      crouchMove: 'cwalk',
      crouchIdle: 'cstand',
      crouchAttach: 'crattack',
    },
    walkSpeed: number,
    crouchSpeed: number,
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.cameraControls = null;
    this.stats = null;

    this.light = new THREE.DirectionalLight();
    this.characters = [];
    this.nCharacters = 0;
    this.controls = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      crouch: false,
      jump: false,
      attack: false,
    }
    this.clock = new THREE.Clock();
    this.config = {
      baseUrl: '/examples/models/md2/ogro/',
      body: 'ogro.md2',
      skins: [ 
        'grok.jpg', 'ogrobase.png', 'arboshak.png', 
        'ctf_r.png', 'ctf_b.png', 'darkam.png', 
        'freedom.png', 'gib.png', 'gordogh.png', 
        'igdosh.png', 'khorne.png', 'nabogro.png',
        'sharokh.png'
      ],
      weapons: [['weapon.md2', 'weapon.jpg']],
      animations: {
        move: 'run',
        idle: 'stand',
        jump: 'jump',
        attack: 'attack',
        crouchMove: 'cwalk',
        crouchIdle: 'cstand',
        crouchAttach: 'crattack'
      },
      walkSpeed: 350,
      crouchSpeed: 175
    };
  }

  // 初始化方法入口
  init() {
    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 4000);
    this.camera.position.set(0, 150, 1300);

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.fog = new THREE.Fog(0xffffff, 200, 4000);
    this.scene.add(this.camera);

    // 光线
    this.createLight();

    // 创建地板
    this.createGround();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.cameraControls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.cameraControls.target.set(0, 50, 0);
    this.cameraControls.update();

    // 加载模型
    this.loadModel();
    
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

  // 绑定事件
  private bind() {
    window.onkeydown = (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': this.controls.moveForward = true; break;
        case 'ArrowDown':
        case 'KeyS': this.controls.moveBackward = true; break;
        case 'ArrowLeft':
        case 'KeyA': this.controls.moveLeft = true; break;

        case 'ArrowRight':
        case 'KeyD': this.controls.moveRight = true; break;

        case 'KeyC': this.controls.crouch = true; break;
        case 'Space': this.controls.jump = true; break;
        case 'ControlLeft':
        case 'ControlRight': this.controls.attack = true; break;
      }
    };

    window.onkeyup = (e) => {
      switch(e.code) {
        case 'ArrowUp':
					case 'KeyW': this.controls.moveForward = false; break;
					case 'ArrowDown':
					case 'KeyS': this.controls.moveBackward = false; break;
					case 'ArrowLeft':
					case 'KeyA': this.controls.moveLeft = false; break;
					case 'ArrowRight':
					case 'KeyD': this.controls.moveRight = false; break;
					case 'KeyC': this.controls.crouch = false; break;
					case 'Space': this.controls.jump = false; break;
					case 'ControlLeft':
					case 'ControlRight': this.controls.attack = false; break;
      }
    };
  }

  // 加载模型
  private loadModel() {
    const nRows = 1;
    const nSkins = this.config.skins.length;

    this.nCharacters = nSkins * nRows;
    for (let i = 0; i < this.nCharacters; i++) {
      const character = new MD2CharacterComplex();
      character.scale = 3;
      // @ts-ignore
      character.controls = this.controls;
      this.characters.push(character);
    }

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const baseCharacter = new MD2CharacterComplex();
    baseCharacter.scale = 3;
    baseCharacter.onLoadComplete = () => {
      toast.close();
      let k = 0;
      
      for (let j = 0; j < nRows; j++) {
        for (let i = 0; i < nSkins; i++) {
          const cloneCharacter = this.characters[k];
          cloneCharacter.shareParts(baseCharacter);
          cloneCharacter.enableShadows(true);

          cloneCharacter.setSkin(i);
          cloneCharacter.setWeapon(0);
          
          cloneCharacter.root.position.x = (i - nSkins/2) * 150;
          cloneCharacter.root.position.z = j * 250;
          this.scene.add(cloneCharacter.root);
          k++;
        }
      }

      const gyro = new Gyroscope();
      if (this.camera) { gyro.add(this.camera); }
      gyro.add(this.light, this.light.target);
      this.characters[Math.floor(nSkins/2)].root.add(gyro);
    };
    baseCharacter.loadParts(this.config);
  }

  // 创建地板
  private createGround() {
    const texture = new THREE.TextureLoader().load("/examples/textures/terrain/grasslight-big.jpg");
    const geometry = new THREE.PlaneGeometry(16000, 16000);
    const material = new THREE.MeshPhongMaterial({color: 0xffffff, map: texture});

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    // .set ( x : Float, y : Float ) : this
    // 设置该向量的x和y分量
    (ground.material.map as THREE.Texture).repeat.set(64, 64);
    // 这个值定义了纹理贴图在水平方向上将如何包裹，在UV映射中对应于U
    (ground.material.map as THREE.Texture).wrapS = THREE.RepeatWrapping;
    // 这个值定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V
    (ground.material.map as THREE.Texture).wrapT = THREE.RepeatWrapping;
    (ground.material.map as THREE.Texture).encoding = THREE.sRGBEncoding;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  // 添加光线
  private createLight() {
    const ambient = new THREE.AmbientLight(0x222222);

    this.light = new THREE.DirectionalLight(0xffffff, 2.25);
    this.light.position.set(200, 450, 500);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(1024, 1024);

    this.light.shadow.camera.near = 100;
    this.light.shadow.camera.far = 1200;
    this.light.shadow.camera.left = -1000;
    this.light.shadow.camera.right = 1000;
    this.light.shadow.camera.top = 350;
    this.light.shadow.camera.bottom = -350;

    this.scene.add(ambient, this.light);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
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

    const delta = this.clock.getDelta();
    this.characters.forEach((character) => {
      character.update(delta);
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

