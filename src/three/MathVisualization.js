import * as THREE from 'three';

export default class MathVisualization {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.surfaceMesh = null;
    this.wireframeMesh = null;
    this.specialPointMarker = null; // 최소점 또는 안장점 표시
  }
  
  /**
   * 3D 표면 생성
   * @param {Array} points - 3D 표면 데이터 포인트 배열
   * @param {Number} resolution - 표면 해상도
   * @param {Boolean} showWireframe - 와이어프레임 표시 여부
   * @param {String} colorMode - 'convex' 또는 'saddle' 등 컬러 모드
   */
  createSurface(points, resolution, showWireframe, colorMode = 'convex') {
    if (!this.sceneManager || !this.sceneManager.scene || !points || points.length === 0) {
      console.warn("Scene or points data not available for surface creation.");
      return;
    }
    
    // 기존 메시 제거
    this.clearSurface();
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const indices = [];
    const numGridPoints = resolution + 1;
    
    // 정점과 색상 데이터 설정
    for (let i = 0; i < numGridPoints; i++) {
      for (let j = 0; j < numGridPoints; j++) {
        const index = i * numGridPoints + j;
        if (index < points.length) {
          const p = points[index];
          
          // 정점 위치: API (x,y,z) -> Three.js (x, z, y) 매핑
          vertices.push(p.x, p.z, p.y);
          
          // 포인트에 따른 색상 계산
          const color = this.calculatePointColor(p, colorMode);
          colors.push(color.r, color.g, color.b);
        }
      }
    }
    
    // 인덱스 설정 (삼각형 생성)
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * numGridPoints + j;
        const b = a + 1;
        const c = (i + 1) * numGridPoints + j;
        const d = c + 1;
        
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    
    // 버퍼 지오메트리 속성 설정
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // 메인 서피스 메시 생성
    const material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      vertexColors: true,
      shininess: 30
    });
    
    this.surfaceMesh = new THREE.Mesh(geometry, material);
    this.sceneManager.scene.add(this.surfaceMesh);
    
    // 와이어프레임 메시 생성 (선택적)
    if (showWireframe) {
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0x000000,
        linewidth: 1,
        opacity: 0.25,
        transparent: true
      });
      
      this.wireframeMesh = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        wireframeMaterial
      );
      
      this.sceneManager.scene.add(this.wireframeMesh);
    }
  }
  
  /**
   * 포인트 색상 계산
   * @param {Object} point - 좌표 포인트 {x, y, z}
   * @param {String} colorMode - 색상 모드
   * @returns {THREE.Color} 색상 객체
   */
  calculatePointColor(point, colorMode) {
    const color = new THREE.Color();
    
    if (colorMode === 'convex') {
      // 볼록 함수 색상: 높이에 따라 점진적 변화 (파란색 → 녹색 → 빨간색)
      const normalizedZ = Math.max(0, Math.min(1, (point.z + 10) / 20));
      if (normalizedZ < 0.5) {
        // 파란색 → 녹색
        color.setRGB(0, normalizedZ * 2, 1 - normalizedZ * 2);
      } else {
        // 녹색 → 빨간색
        color.setRGB((normalizedZ - 0.5) * 2, 1 - (normalizedZ - 0.5) * 2, 0);
      }
    } else if (colorMode === 'saddle') {
      // 안장점 함수 색상: 높이가 0보다 작으면 파란색, 크면 빨간색
      if (point.z < 0) {
        // 음수 높이: 파란색 계열
        const intensity = Math.min(1, Math.abs(point.z) / 10);
        color.setRGB(0.2 * (1-intensity), 0.5 * (1-intensity), intensity);
      } else {
        // 양수 높이: 빨간색 계열
        const intensity = Math.min(1, point.z / 10);
        color.setRGB(intensity, 0.2 * (1-intensity), 0.2 * (1-intensity));
      }
    } else {
      // 기본 색상 (그레이)
      color.setRGB(0.5, 0.5, 0.5);
    }
    
    return color;
  }
  
  /**
   * 특수점(최소점/안장점) 마커 추가
   * @param {Array} position - [x, y, z] 위치
   * @param {Number} size - 마커 크기
   * @param {Number} color - 마커 색상 (16진수)
   */
  addSpecialPointMarker(position, size = 0.15, color = 0xff0000) {
    if (!this.sceneManager || !this.sceneManager.scene) return;
    
    // 기존 마커 제거
    if (this.specialPointMarker) {
      this.sceneManager.scene.remove(this.specialPointMarker);
      if (this.specialPointMarker.geometry) this.specialPointMarker.geometry.dispose();
      if (this.specialPointMarker.material) this.specialPointMarker.material.dispose();
      this.specialPointMarker = null;
    }
    
    // 새 마커 생성
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    this.specialPointMarker = new THREE.Mesh(geometry, material);
    
    // Three.js 좌표계 변환: API (x,y,z) -> Three.js (x, z, y)
    this.specialPointMarker.position.set(position[0], position[2], position[1]);
    this.sceneManager.scene.add(this.specialPointMarker);
  }
  
  /**
   * 표면 메시 제거
   */
  clearSurface() {
    if (this.surfaceMesh) {
      this.sceneManager.scene.remove(this.surfaceMesh);
      this.surfaceMesh.geometry.dispose();
      this.surfaceMesh.material.dispose();
      this.surfaceMesh = null;
    }
    
    if (this.wireframeMesh) {
      this.sceneManager.scene.remove(this.wireframeMesh);
      this.wireframeMesh.geometry.dispose();
      this.wireframeMesh.material.dispose();
      this.wireframeMesh = null;
    }
    
    if (this.specialPointMarker) {
      this.sceneManager.scene.remove(this.specialPointMarker);
      this.specialPointMarker.geometry.dispose();
      this.specialPointMarker.material.dispose();
      this.specialPointMarker = null;
    }
  }
  
  /**
   * 모든 리소스 정리
   */
  dispose() {
    this.clearSurface();
  }
}
