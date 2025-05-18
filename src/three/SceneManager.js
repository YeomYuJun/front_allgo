import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class SceneManager {
  constructor(container) {
    // DOM 컨테이너
    this.container = container;
    
    // Three.js 기본 객체
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // 애니메이션 ID
    this.animationFrameId = null;
    
    // 씬 객체들
    this.axesHelper = null;
    this.axisLabels = [];
    
    // 콜백 함수
    this.customUpdateFn = null;
    
    // 초기화
    this.initialize();
  }
  
  initialize() {
    if (!this.container) {
      console.error('Three.js container is not defined.');
      return;
    }

    // Scene 생성
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // 컨테이너 크기 가져오기
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    // Camera 설정
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer 설정
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Controls 설정
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // 기본 조명 추가
    this.addLights();
    
    // 윈도우 리사이징 이벤트 리스너
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 애니메이션 시작
    this.animate();
  }
  
  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7.5);
    this.scene.add(dirLight);
  }
  
  handleResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    // 컨트롤 업데이트
    if (this.controls) {
      this.controls.update();
    }
    
    // 사용자 정의 업데이트 함수 실행
    if (this.customUpdateFn && typeof this.customUpdateFn === 'function') {
      this.customUpdateFn();
    }
    
    // 렌더링
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  setCustomUpdateFunction(fn) {
    this.customUpdateFn = fn;
  }
  
  adjustCameraPosition(range) {
    if (!this.camera) return;
    const factor = range * 0.5;
    this.camera.position.set(factor, factor, factor);
    this.camera.lookAt(0, 0, 0);
  }
  
  addAxes(range) {
    if (!this.scene) return;
    
    // 기존 축 제거
    if (this.axesHelper) {
      this.scene.remove(this.axesHelper);
      this.axesHelper.dispose();
      this.axesHelper = null;
    }
    
    // 기존 레이블 제거
    this.axisLabels.forEach(label => {
      this.scene.remove(label);
    });
    this.axisLabels = [];
    
    // 새 축 추가
    this.axesHelper = new THREE.AxesHelper(range + 2);
    this.scene.add(this.axesHelper);
    
    // 축 레이블 추가
    this.addAxisLabels(range);
  }
  
  addAxisLabels(range) {
    const labelDistance = range + 1;
    
    // X, Y, Z 축 레이블 생성
    this.axisLabels.push(
      this.createTextLabel('X', new THREE.Vector3(labelDistance, 0, 0), 0xff0000, range * 0.1),
      this.createTextLabel('Y', new THREE.Vector3(0, labelDistance, 0), 0x00ff00, range * 0.1),
      this.createTextLabel('Z', new THREE.Vector3(0, 0, labelDistance), 0x0000ff, range * 0.1)
    );
  }
  
  createTextLabel(text, position, color, size) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const fontFace = "Arial";
    const fontSize = 64;
    context.font = `Bold ${fontSize}px ${fontFace}`;
    const textWidth = context.measureText(text).width;
    
    canvas.width = textWidth + 20;
    canvas.height = fontSize + 20;
    
    // 폰트 다시 설정 (캔버스 크기 변경 후 초기화)
    context.font = `Bold ${fontSize}px ${fontFace}`;
    context.fillStyle = `rgba(${new THREE.Color(color).r*255}, ${new THREE.Color(color).g*255}, ${new THREE.Color(color).b*255}, 1.0)`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      depthTest: false 
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(size * (canvas.width/canvas.height), size, 1);
    sprite.userData.isAxisLabel = true;
    
    this.scene.add(sprite);
    return sprite;
  }
  
  clear() {
    // 애니메이션 프레임 취소
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 이벤트 리스너 제거
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // 씬 정리
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    // 렌더러 정리
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.container.contains(this.renderer.domElement)) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
    
    // 참조 제거
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.axesHelper = null;
    this.axisLabels = [];
    this.customUpdateFn = null;
  }
}
