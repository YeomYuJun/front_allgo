import * as THREE from 'three';

export default class GradientDescent {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.gradientPathLine = null;
    this.gradientPathPoints = [];
  }
  
  /**
   * 경사 하강법 경로 시각화
   * @param {Array} pathData - 경사 하강법 경로 데이터 포인트 배열
   * @param {Object} options - 시각화 옵션
   */
  visualizePath(pathData, options = {}) {
    if (!this.sceneManager || !this.sceneManager.scene || !pathData || pathData.length === 0) {
      console.warn('Scene not ready or no path data to visualize.');
      return;
    }
    
    // 기존 경로 시각화 제거
    this.clearPath();
    
    // 옵션 설정 (기본값 적용)
    const {
      lineColor = 0xff8800, 
      lineWidth = 3,
      pointColor = 0xff8800,
      pointSize = 0.1,
      showPoints = true
    } = options;
    
    // 경로 포인트 변환 (API → Three.js 좌표계)
    const points = pathData.map(step => 
      new THREE.Vector3(step.x, step.z, step.y) // API (x,y,z) → Three.js (x, z, y)
    );
    
    // 선 생성
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      linewidth: lineWidth 
    });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    this.gradientPathLine = new THREE.Line(lineGeometry, lineMaterial);
    this.sceneManager.scene.add(this.gradientPathLine);
    
    // 점 생성 (선택적)
    if (showPoints) {
      const pointMaterial = new THREE.MeshBasicMaterial({ color: pointColor });
      
      points.forEach((point, index) => {
        const pointGeometry = new THREE.SphereGeometry(pointSize, 12, 12);
        const sphere = new THREE.Mesh(pointGeometry, pointMaterial);
        sphere.position.copy(point);
        this.sceneManager.scene.add(sphere);
        this.gradientPathPoints.push(sphere);
      });
    }
    
    return {
      points,
      lineObject: this.gradientPathLine,
      pointObjects: this.gradientPathPoints
    };
  }
  
  /**
   * 스텝 인덱스 레이블 추가 (선택적)
   * @param {THREE.Vector3} position - 레이블 위치
   * @param {Number} index - 스텝 인덱스
   * @param {Number} size - 레이블 크기
   * @param {Number} color - 레이블 색상 (16진수)
   */
  addStepLabel(position, index, size = 0.1, color = 0xff8800) {
    if (!this.sceneManager || !this.sceneManager.scene) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 48;
    
    canvas.width = 64;
    canvas.height = 64;
    
    ctx.font = `Bold ${fontSize}px Arial`;
    ctx.fillStyle = `rgba(${new THREE.Color(color).r*255}, ${new THREE.Color(color).g*255}, ${new THREE.Color(color).b*255}, 1.0)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(index.toString(), canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      depthTest: false 
    });
    const sprite = new THREE.Sprite(material);
    
    // 위치를 약간 오프셋 (점보다 조금 위에 표시)
    sprite.position.copy(position.clone().add(new THREE.Vector3(0, 0.1, 0)));
    sprite.scale.set(size, size, 1);
    sprite.userData.isGradientStepLabel = true;
    
    this.sceneManager.scene.add(sprite);
    return sprite;
  }
  
  /**
   * 경로 시각화 제거
   */
  clearPath() {
    if (this.gradientPathLine) {
      this.sceneManager.scene.remove(this.gradientPathLine);
      this.gradientPathLine.geometry.dispose();
      this.gradientPathLine.material.dispose();
      this.gradientPathLine = null;
    }
    
    this.gradientPathPoints.forEach(point => {
      this.sceneManager.scene.remove(point);
      point.geometry.dispose();
      point.material.dispose();
    });
    this.gradientPathPoints = [];
    
    // 스텝 레이블 제거 (있는 경우)
    this.sceneManager.scene.children
      .filter(child => child.userData.isGradientStepLabel)
      .forEach(label => this.sceneManager.scene.remove(label));
  }
  
  /**
   * 모든 리소스 정리
   */
  dispose() {
    this.clearPath();
  }
}
