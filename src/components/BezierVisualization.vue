<template>
  <section class="bezier-container container">
    <div>
      <h2 class="tit">Bezier Curves Visualization</h2>
    </div>
    <section class="container-wrap">
      <!-- 좌측: 2D 시각화 -->
      <section class="sub-section section-l canvas-wrap">
        <div class="visualization-grid">
          <div class="viz-panel bezier-2d-panel grid-fr">
            <h4>Bezier Curves & De Casteljau 알고리즘</h4>
            <div ref="threeContainer" class="viz-container three-container"></div>
          </div>
          <div class="explanation-panel">
            <h4>베지어 곡선이란?</h4>
            <div class="explanation-content">
              <div class="math-formula">
                <strong>수학적 정의:</strong> B(t) = Σ(C(n,i) × (1-t)^(n-i) × t^i × Pi), t∈[0,1]
              </div>
              <p><strong>핵심 개념:</strong></p>
              <ul>
                <li><strong>베른슈타인 다항식:</strong> 제어점들을 가중평균으로 결합하여 부드러운 곡선 생성</li>
                <li><strong>De Casteljau 알고리즘:</strong> 재귀적 선형보간으로 곡선점을 기하학적으로 계산</li>
                <li><strong>제어점:</strong> 곡선의 형태를 결정하는 기준점들 (빨간 구체로 표시)</li>
                <li><strong>t 파라미터:</strong> 0에서 1까지 변화하며 곡선 위의 점을 결정</li>
              </ul>
              <p><strong>수학적 특성:</strong></p>
              <ul>
                <li>첫 번째와 마지막 제어점을 반드시 통과</li>
                <li>제어다각형 내부에 곡선이 유지됨 (Convex Hull Property)</li>
                <li>무한히 부드러운 곡선 (C^∞ 연속성)</li>
              </ul>
              <p><strong>응용 분야:</strong> 컴퓨터 그래픽스, CAD 설계, 폰트 디자인, 애니메이션 경로</p>
            </div>
          </div>
        </div>
      </section>
      <!-- 우측: 컨트롤 및 정보 -->
      <section class="sub-section section-r controls-wrap">
        <div class="controls curve-controls">
          <h3>1. 곡선 설정</h3>
          <div class="control-builder">
            <div class="control-component">
              <label>제어점 개수: {{ controlPoints.length }}</label>
              <div class="preset-buttons">
                <button @click="setPresetPoints('linear')">직선 (2점)</button>
                <button @click="setPresetPoints('quadratic')">2차 (3점)</button>
                <button @click="setPresetPoints('cubic')">3차 (4점)</button>
                <button @click="setPresetPoints('quintic')">5차 (6점) - 최대</button>
              </div>
            </div>
            <div class="control-component">
              <label>드래그로 제어점 이동 가능</label>
              <p class="help-text">마우스로 제어점(빨간 구)을 클릭하고 드래그하세요</p>
            </div>
          </div>
        </div>
        <div class="controls animation-controls">
          <h3>2. De Casteljau 애니메이션</h3>
          <div class="control-builder">
            <div class="control-component">
              <label>t 파라미터: {{ tParameter.toFixed(3) }}</label>
              <input type="range" v-model.number="tParameter" min="0" max="1" step="0.01" />
            </div>
            <div class="control-component">
              <label>구성선 표시</label>
              <input type="checkbox" v-model="showConstructionLines" />
            </div>
            <div class="control-component">
              <label>애니메이션 속도: {{ animationSpeed }}ms</label>
              <input type="range" v-model.number="animationSpeed" min="50" max="500" step="50" />
            </div>
            <div class="control-component">
              <button @click="startAnimation" :disabled="isAnimating">
                {{ isAnimating ? '애니메이션 진행 중...' : 'De Casteljau 애니메이션 시작' }}
              </button>
              <button @click="stopAnimation" :disabled="!isAnimating">
                정지
              </button>
              <button @click="resetCurve">
                리셋
              </button>
            </div>
          </div>
        </div>
        <div class="results-panel">
          <h3>곡선 정보</h3>
          <div class="result-content" v-if="bezierResult">
            <p><strong>차수 (Degree):</strong> {{ bezierResult.degree }}</p>
            <p><strong>제어점 개수:</strong> {{ controlPoints.length }}</p>
            <p><strong>곡선 점 개수:</strong> {{ bezierResult.curvePoints ? bezierResult.curvePoints.length : 0 }}</p>
            <p><strong>현재 t:</strong> {{ tParameter.toFixed(3) }}</p>
            <p v-if="bezierResult.currentPoint">
              <strong>현재 점:</strong> ({{ bezierResult.currentPoint.x.toFixed(3) }}, {{ bezierResult.currentPoint.y.toFixed(3) }})
            </p>
            <p v-if="curveLength > 0">
              <strong>곡선 길이:</strong> {{ curveLength.toFixed(3) }}
            </p>
          </div>
        </div>
        <div class="advanced-controls">
          <h3>고급 기능</h3>
          <div class="control-builder">
            <div class="control-component">
              <button @click="elevateDegree" :disabled="controlPoints.length < 2 || controlPoints.length >= 6">
                차수 상승 (최대 5차)
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  </section>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default {
  setup() {
    // --- 상태 변수들 ---
    const threeContainer = ref(null);
    const controlPoints = ref([
      { x: -3, y: -1 },
      { x: -1, y: 2 },
      { x: 1, y: 2 },
      { x: 3, y: -1 }
    ]);
    const resolution = ref(100);
    const tParameter = ref(0.5);
    const showConstructionLines = ref(true);
    const animationSpeed = ref(250);
    const isAnimating = ref(false);
    const bezierResult = ref(null);
    const curveLength = ref(0);

    // --- Three.js 관련 객체 ---
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let animationId = null;
    let curveGroup = null;
    let controlPointsGroup = null;
    let constructionGroup = null;
    let currentPointMarker = null;
    let isDragging = false;
    let selectedControlPoint = null;
    let raycaster = null;
    let mouse = null;

    // API URL
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/bezier`;

    // --- API 호출 함수들 ---
    const generateBezierCurve = async () => {
      try {
        const requestData = {
          controlPoints: controlPoints.value,
          resolution: resolution.value,
          tParameter: tParameter.value,
          showConstructionLines: showConstructionLines.value
        };

        const response = await fetch(`${API_BASE_URL}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error generating Bezier curve:', error);
        return null;
      }
    };


    const elevateDegreeAPI = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/elevate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(controlPoints.value)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error elevating degree:', error);
        return null;
      }
    };

    // --- Three.js 초기화 ---
    const initThreeScene = () => {
      if (!threeContainer.value) return;

      // Scene 생성
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // Camera 생성
      camera = new THREE.PerspectiveCamera(75, threeContainer.value.clientWidth / threeContainer.value.clientHeight, 0.1, 1000);
      camera.position.set(0, 0, 10);

      // Renderer 생성
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
      threeContainer.value.appendChild(renderer.domElement);

      // Controls 생성
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;

      // Raycaster and mouse for interaction
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // 좌표축 추가
      const axesHelper = new THREE.AxesHelper(3);
      scene.add(axesHelper);

      // 그리드 추가
      const gridHelper = new THREE.GridHelper(10, 20);
      gridHelper.rotateX(Math.PI / 2);
      scene.add(gridHelper);

      // Groups 초기화
      curveGroup = new THREE.Group();
      controlPointsGroup = new THREE.Group();
      constructionGroup = new THREE.Group();
      scene.add(curveGroup);
      scene.add(controlPointsGroup);
      scene.add(constructionGroup);

      // 마우스 이벤트 추가
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);

      // 초기 곡선 생성
      updateBezierCurve();

      // 애니메이션 루프 시작
      animate();
    };

    // --- 마우스 상호작용 ---
    const onMouseDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(controlPointsGroup.children);

      if (intersects.length > 0) {
        isDragging = true;
        selectedControlPoint = intersects[0].object.userData.index;
        controls.enabled = false;
      }
    };

    const onMouseMove = (event) => {
      if (!isDragging || selectedControlPoint === null) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // Calculate intersection with z=0 plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      if (intersection) {
        controlPoints.value[selectedControlPoint].x = intersection.x;
        controlPoints.value[selectedControlPoint].y = intersection.y;
        updateBezierCurve();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      selectedControlPoint = null;
      controls.enabled = true;
    };

    // --- 베지어 곡선 업데이트 ---
    const updateBezierCurve = async () => {
      const result = await generateBezierCurve();
      if (result) {
        bezierResult.value = result;
        drawBezierCurve(result);
        drawControlPoints();
        if (showConstructionLines.value) {
          drawConstructionLines(result);
        }
        drawCurrentPoint(result.currentPoint);
      }
    };

    // --- 베지어 곡선 그리기 ---
    const drawBezierCurve = (result) => {
      curveGroup.clear();

      if (!result.curvePoints || result.curvePoints.length === 0) return;

      const points = result.curvePoints.map(p => new THREE.Vector3(p.x, p.y, 0));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x2196f3, linewidth: 3 });
      const curve = new THREE.Line(geometry, material);
      curveGroup.add(curve);

      // Calculate curve length
      if (result.curvePoints.length > 1) {
        let length = 0;
        for (let i = 1; i < result.curvePoints.length; i++) {
          const p0 = result.curvePoints[i - 1];
          const p1 = result.curvePoints[i];
          const dx = p1.x - p0.x;
          const dy = p1.y - p0.y;
          length += Math.sqrt(dx * dx + dy * dy);
        }
        curveLength.value = length;
      }
    };

    // --- 제어점 그리기 ---
    const drawControlPoints = () => {
      controlPointsGroup.clear();

      controlPoints.value.forEach((point, index) => {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(point.x, point.y, 0);
        sphere.userData = { index };
        controlPointsGroup.add(sphere);
      });

      // Draw control polygon
      if (controlPoints.value.length > 1) {
        const points = controlPoints.value.map(p => new THREE.Vector3(p.x, p.y, 0));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
        const polygon = new THREE.Line(geometry, material);
        controlPointsGroup.add(polygon);
      }
    };

    // --- 구성선 그리기 ---
    const drawConstructionLines = (result) => {
      constructionGroup.clear();

      if (!result.constructionLines || !showConstructionLines.value) return;

      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

      result.constructionLines.forEach((level, levelIndex) => {
        if (level.length < 2) return;

        for (let i = 0; i < level.length - 1; i++) {
          const p0 = level[i];
          const p1 = level[i + 1];
          
          const points = [
            new THREE.Vector3(p0.x, p0.y, 0),
            new THREE.Vector3(p1.x, p1.y, 0)
          ];
          
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const color = colors[levelIndex % colors.length];
          const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
          const line = new THREE.Line(geometry, material);
          constructionGroup.add(line);
        }

        // Draw intermediate points
        level.forEach(point => {
          const geometry = new THREE.SphereGeometry(0.05, 8, 8);
          const color = colors[levelIndex % colors.length];
          const material = new THREE.MeshBasicMaterial({ color });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(point.x, point.y, 0);
          constructionGroup.add(sphere);
        });
      });
    };

    // --- 현재 점 표시 ---
    const drawCurrentPoint = (currentPoint) => {
      if (currentPointMarker) {
        scene.remove(currentPointMarker);
      }

      if (currentPoint) {
        const geometry = new THREE.SphereGeometry(0.08, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        currentPointMarker = new THREE.Mesh(geometry, material);
        currentPointMarker.position.set(currentPoint.x, currentPoint.y, 0);
        scene.add(currentPointMarker);
      }
    };


    // --- 차수 상승 ---
    const elevateDegree = async () => {
      if (controlPoints.value.length >= 6) {
        console.warn('최대 차수(5차, 6점)에 도달했습니다.');
        return;
      }
      const result = await elevateDegreeAPI();
      if (result) {
        controlPoints.value = result;
        updateBezierCurve();
      }
    };

    // --- 프리셋 설정 ---
    const setPresetPoints = (preset) => {
      switch (preset) {
        case 'linear':
          controlPoints.value = [
            { x: -3, y: -1 },
            { x: 3, y: 1 }
          ];
          break;
        case 'quadratic':
          controlPoints.value = [
            { x: -3, y: -1 },
            { x: 0, y: 3 },
            { x: 3, y: -1 }
          ];
          break;
        case 'cubic':
          controlPoints.value = [
            { x: -3, y: -1 },
            { x: -1, y: 2 },
            { x: 1, y: 2 },
            { x: 3, y: -1 }
          ];
          break;
        case 'quintic':
          controlPoints.value = [
            { x: -4, y: 0 },
            { x: -2, y: 3 },
            { x: -1, y: -2 },
            { x: 1, y: 2 },
            { x: 2, y: -3 },
            { x: 4, y: 0 }
          ];
          break;
      }
      updateBezierCurve();
    };

    // --- 애니메이션 ---
    const startAnimation = () => {
      if (isAnimating.value) return;
      isAnimating.value = true;
      
      let animationT = 0;
      const step = 0.01;
      
      const animateStep = async () => {
        if (!isAnimating.value) return;
        
        tParameter.value = animationT;
        await updateBezierCurve();
        
        animationT += step;
        
        if (animationT > 1) {
          animationT = 0;
        }
        
        setTimeout(animateStep, animationSpeed.value);
      };
      
      animateStep();
    };

    const stopAnimation = () => {
      isAnimating.value = false;
    };

    const resetCurve = () => {
      stopAnimation();
      tParameter.value = 0.5;
      showConstructionLines.value = true;
      setPresetPoints('cubic');
    };

    // --- 애니메이션 루프 ---
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    // --- 정리 함수 ---
    const cleanup = () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer && threeContainer.value) {
        threeContainer.value.removeChild(renderer.domElement);
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    };

    // --- Lifecycle Hooks ---
    onMounted(() => {
      initThreeScene();
    });

    onBeforeUnmount(() => {
      cleanup();
    });

    // --- Watchers ---
    watch([tParameter, showConstructionLines], () => {
      if (!isAnimating.value) {
        updateBezierCurve();
      }
    });

    return {
      threeContainer,
      controlPoints,
      resolution,
      tParameter,
      showConstructionLines,
      animationSpeed,
      isAnimating,
      bezierResult,
      curveLength,
      setPresetPoints,
      startAnimation,
      stopAnimation,
      resetCurve,
      elevateDegree
    };
  }
};
</script>

<style scoped>
.tit {
  font-weight: 600;
  border-bottom: 5px solid #777;
  width: fit-content;
  margin-bottom: 25px;
}

.bezier-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.container-wrap {
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: 1fr;
}

.sub-section {
  min-height: 800px;
}

.controls {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.controls h3 {
  margin-top: 0;
  color: #1976d2;
}

.control-builder {
  display: grid;
  gap: 15px;
}

.control-component {
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border-left: 4px solid #4caf50;
}

.control-component label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.controls input[type="range"] {
  width: 100%;
  margin: 5px 0;
}

.controls input[type="checkbox"] {
  margin: 5px;
  transform: scale(1.2);
}

.controls select {
  width: 100%;
  padding: 5px;
  margin-top: 5px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-top: 10px;
}

.preset-buttons button {
  padding: 8px 12px;
  font-size: 12px;
}

.help-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 5px;
}

.visualization-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 20px;
  min-height: 600px;
}

.explanation-panel {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
  border: 1px solid #e9ecef;
}

.explanation-panel h4 {
  margin-top: 0;
  color: #495057;
  border-bottom: 2px solid #6c757d;
  padding-bottom: 8px;
}

.explanation-content {
  line-height: 1.6;
  color: #495057;
}

.math-formula {
  background-color: #e7f3ff;
  padding: 12px;
  border-radius: 4px;
  margin: 10px 0;
  border-left: 4px solid #007bff;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.explanation-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.explanation-content li {
  margin: 8px 0;
  line-height: 1.5;
}

.explanation-content strong {
  color: #343a40;
  font-weight: 600;
}

.grid-fr {
  grid-column: 1 / 3;
}

.viz-panel {
  background-color: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.viz-panel h4 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #2196f3;
  padding-bottom: 8px;
}

.three-container {
  width: 100%;
  height: 500px;
  min-height: 500px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.results-panel {
  background-color: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
  margin-bottom: 20px;
}

.results-panel h3 {
  margin-top: 0;
  color: #1976d2;
}

.result-content p {
  margin: 8px 0;
}

.advanced-controls {
  background-color: #fff3e0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.advanced-controls h3 {
  margin-top: 0;
  color: #e65100;
}

.section-r {
  margin-left: 20px;
}

button {
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  margin: 5px;
}

button:hover:not(:disabled) {
  background-color: #1976d2;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.advanced-controls button {
  background-color: #ff9800;
  margin: 3px;
  padding: 6px 12px;
  font-size: 12px;
}

.advanced-controls button:hover:not(:disabled) {
  background-color: #e65100;
}

label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}

@media (max-width: 768px) {
  .container-wrap {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, auto);
  }
  
  .section-r {
    margin-left: 0;
    margin-top: 20px;
  }
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
}
</style>