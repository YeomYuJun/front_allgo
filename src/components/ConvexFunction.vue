<template>
  <section class="convex-desc-container container">
    <div>
      <h2 class="tit">볼록 함수 3D 시각화</h2>
    </div>
    <section class="container-wrap">
      <!-- 좌측: 3D 시각화 -->
      <section class="sub-section section-l canvas-wrap">
        <div class="visualization-grid">
          <div class="viz-panel convex-3d-panel grid-fr">
            <h4>3D 함수 그래프</h4>
            <div ref="threeContainer" class="viz-container three-container"></div>
          </div>
        </div>
      </section>
      <!-- 우측: 컨트롤 및 정보 -->
      <section class="sub-section section-r controls-wrap">
        <div class="controls signal-controls">
          <h3>1. 함수/표면 설정</h3>
          <div class="signal-builder">
            <div class="signal-component">
              <label>범위: ±{{ range }}</label>
              <input type="range" v-model.number="range" min="2" max="10" step="1" />
            </div>
            <div class="signal-component">
              <label>해상도: {{ resolution }}</label>
              <input type="range" v-model.number="resolution" min="10" max="50" step="5" />
            </div>
            <div class="signal-component">
              <label>함수 타입:</label>
              <select v-model="selectedFunction">
                <option value="quadratic">f(x,y) = x² + y²</option>
                <option value="quartic">f(x,y) = x⁴ + y⁴ + x²y²</option>
                <option value="exponential">f(x,y) = e^(0.1*(x² + y²)) - 1</option>
                <option value="rosenbrock">f(x,y) = 100(y - x²)² + (1 - x)²</option>
                <option value="himmelblau">f(x,y) = (x² + y - 11)² + (x + y² - 7)²</option>
              </select>
            </div>
            <div class="signal-component">
              <label>표시 모드:</label>
              <div class="display-options">
                <label><input type="checkbox" v-model="showWireframe" /> 와이어프레임</label>
                <label><input type="checkbox" v-model="showAxes" /> 좌표축</label>
                <label><input type="checkbox" v-model="showMinimumPoint" /> 최소점</label>
              </div>
            </div>
          </div>
        </div>
        <div class="controls gradient-controls">
          <h3>2. 경사 하강법 시뮬레이션</h3>
          <div class="signal-builder">
            <div class="signal-component">
              <label for="startX">시작 X: {{ startX.toFixed(2) }}</label>
              <input type="range" id="startX" v-model.number="startX" :min="-range" :max="range" step="0.1" />
            </div>
            <div class="signal-component">
              <label for="startY">시작 Y: {{ startY.toFixed(2) }}</label>
              <input type="range" id="startY" v-model.number="startY" :min="-range" :max="range" step="0.1" />
            </div>
            <div class="signal-component">
              <label for="learningRate">학습률: {{ learningRate.toFixed(3) }}</label>
              <input type="range" id="learningRate" v-model.number="learningRate" min="0.001" max="0.5" step="0.001" />
            </div>
            <div class="signal-component">
              <label for="maxIterations">최대 반복: {{ maxIterations }}</label>
              <input type="range" id="maxIterations" v-model.number="maxIterations" min="10" max="200" step="10" />
            </div>
            <div class="signal-component">
              <label for="tolerance">수렴 허용 오차: {{ tolerance.toExponential(2) }}</label>
              <input type="range" id="tolerance" v-model.number="tolerance" min="1e-8" max="1e-4" step="1e-8" />
            </div>
            <div class="signal-component">
              <button @click="startGradientDescent" :disabled="isGradientDescentRunning">
                {{ isGradientDescentRunning ? '실행 중...' : '경사 하강 시작' }}
              </button>
            </div>
          </div>
        </div>
        <div class="insights-panel">
          <h3>함수 정보</h3>
          <div class="insight-content">
            <p><strong>함수 방정식:</strong> {{ functionEquation }}</p>
            <div v-if="functionAnalysis">
              <p><strong>이론적 최소점:</strong> ({{ theoreticalMinimum.join(', ') }})</p>
              <p><strong>엄밀 볼록성:</strong> {{ functionAnalysis.isStrictlyConvex ? '예' : '아니오' }}</p>
              <p><strong>헤시안 고유값:</strong> {{ eigenvalues.join(', ') }}</p>
            </div>
            <div v-if="gradientPathData.length > 0" class="gradient-info">
              <h4>경사 하강법 결과:</h4>
              <p>총 단계: {{ gradientPathData.length - 1 }}</p>
              <p>수렴 여부: {{ minimumResult.converged ? '수렴' : '미수렴' }}</p>
              <p>최종 위치: 
                X={{ minimumResult.x.toFixed(3) }}, 
                Y={{ minimumResult.y.toFixed(3) }}, 
                Z={{ minimumResult.value.toFixed(3) }}
              </p>
              <p>최종 그래디언트 크기: {{ gradientMagnitude.toExponential(3) }}</p>
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

import SceneManager from '../three/SceneManager';
import MathVisualization from '../three/MathVisualization';
import GradientDescent from '../three/GradientDescent';

export default {
  setup() {
    // --- 상태 변수들 ---
    const threeContainer = ref(null);
    const range = ref(5);
    const resolution = ref(30);
    const selectedFunction = ref('quadratic');
    const showWireframe = ref(true);
    const showAxes = ref(true);
    const showMinimumPoint = ref(true);

    // --- 경사 하강법 관련 상태 변수 ---
    const startX = ref(2.0);
    const startY = ref(2.0);
    const learningRate = ref(0.1);
    const maxIterations = ref(100);
    const tolerance = ref(1e-6);
    const isGradientDescentRunning = ref(false);
    const gradientPathData = ref([]);
    const minimumResult = ref({});
    const gradientMagnitude = ref(0);
    const functionAnalysis = ref(null);
    const theoreticalMinimum = ref([0, 0, 0]);
    const eigenvalues = ref([]);

    // --- Three.js 관련 객체 ---
    let sceneManager = null;
    let mathVisualization = null;
    let gradientDescent = null;

    // API URL
    const API_BASE_URL = '/api/convex';

    const functionEquation = computed(() => {
      switch(selectedFunction.value) {
        case 'quadratic': return 'f(x,y) = x² + y²';
        case 'quartic': return 'f(x,y) = x⁴ + y⁴ + x²y²';
        case 'exponential': return 'f(x,y) = e^(0.1*(x² + y²)) - 1';
        case 'rosenbrock': return 'f(x,y) = 100(y - x²)² + (1 - x)²';
        case 'himmelblau': return 'f(x,y) = (x² + y - 11)² + (x + y² - 7)²';
        default: return 'f(x,y) = x² + y²';
      }
    });

    // --- API 호출 함수 ---
    const fetchSurfaceData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/surface?xMin=-${range.value}&xMax=${range.value}&yMin=-${range.value}&yMax=${range.value}&resolution=${resolution.value}&functionType=${selectedFunction.value}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching surface data:', error);
        return [];
      }
    };

    const fetchFunctionAnalysis = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/analyze?functionType=${selectedFunction.value}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        functionAnalysis.value = data;
        theoreticalMinimum.value = [
          data.theoreticalMinimumX,
          data.theoreticalMinimumY,
          data.theoreticalMinimumZ
        ];
        eigenvalues.value = data.hessianEigenvalues;
        
        // 최소점 마커 업데이트
        if (showMinimumPoint.value && mathVisualization) {
          mathVisualization.addSpecialPointMarker(theoreticalMinimum.value);
        }
      } catch (error) {
        console.error('Error fetching function analysis:', error);
      }
    };

    const startGradientDescent = async () => {
      if (isGradientDescentRunning.value) return;
      isGradientDescentRunning.value = true;
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/find-minimum?startX=${startX.value}&startY=${startY.value}&functionType=${selectedFunction.value}&learningRate=${learningRate.value}&maxIterations=${maxIterations.value}&tolerance=${tolerance.value}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        gradientPathData.value = data.path;
        minimumResult.value = data.minimumFound;
        gradientMagnitude.value = data.gradientMagnitude;
        // 경사 하강 경로 시각화
        if (gradientDescent) {
          gradientDescent.visualizePath(data.path);
        }
      } catch (error) {
        console.error('Error during gradient descent:', error);
      } finally {
        isGradientDescentRunning.value = false;
      }
    };

    // --- 씬 업데이트 함수 ---
    const updateSceneObjects = async () => {
      if (!sceneManager || !mathVisualization) return;
      
      // 좌표축 업데이트
      if (showAxes.value) {
        sceneManager.addAxes(range.value);
      } else {
        if (sceneManager.axesHelper) {
          sceneManager.scene.remove(sceneManager.axesHelper);
          sceneManager.axesHelper = null;
          
          // 축 레이블 제거
          sceneManager.axisLabels.forEach(label => {
            sceneManager.scene.remove(label);
          });
          sceneManager.axisLabels = [];
        }
      }
      
      // 표면 데이터 가져오기
      const points = await fetchSurfaceData();
      
      // 표면 생성
      mathVisualization.createSurface(points, resolution.value, showWireframe.value, 'convex');
      
      // 함수 분석 정보 가져오기
      await fetchFunctionAnalysis();
      
      // 최소점 마커 업데이트
      if (showMinimumPoint.value && theoreticalMinimum.value) {
        mathVisualization.addSpecialPointMarker(theoreticalMinimum.value);
      }
      
      // 경사 하강 경로 제거 (파라미터 변경 시)
      if (gradientDescent) {
        gradientDescent.clearPath();
        gradientPathData.value = [];
        minimumResult.value = {};
      }
    };

    // --- 초기화 및 정리 함수 ---
    const initThreeScene = () => {
      if (!threeContainer.value) return;
      
      // 씬 매니저 초기화
      sceneManager = new SceneManager(threeContainer.value);
      
      // 카메라 위치 조정
      sceneManager.adjustCameraPosition(range.value * 2.5);
      
      // 수학 시각화 및 경사 하강 객체 초기화
      mathVisualization = new MathVisualization(sceneManager);
      gradientDescent = new GradientDescent(sceneManager);
      
      // 씬 업데이트
      updateSceneObjects();
    };

    const cleanup = () => {
      if (gradientDescent) {
        gradientDescent.dispose();
        gradientDescent = null;
      }
      
      if (mathVisualization) {
        mathVisualization.dispose();
        mathVisualization = null;
      }
      
      if (sceneManager) {
        sceneManager.clear();
        sceneManager = null;
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
    watch([range, resolution, selectedFunction, showWireframe, showAxes, showMinimumPoint], () => {
      updateSceneObjects();
    });

    // range 변경 시 카메라 위치 조정
    watch(range, (newRange) => {
      if (sceneManager) {
        sceneManager.adjustCameraPosition(newRange * 2.5);
      }
    });

    return {
      threeContainer,
      range,
      resolution,
      selectedFunction,
      showWireframe,
      showAxes,
      showMinimumPoint,
      startX,
      startY,
      learningRate,
      maxIterations,
      tolerance,
      isGradientDescentRunning,
      gradientPathData,
      minimumResult,
      gradientMagnitude,
      functionAnalysis,
      theoreticalMinimum,
      eigenvalues,
      functionEquation,
      startGradientDescent
      
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
.convex-desc-container {
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
  min-height: 1250px;
}
.controls {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}
.signal-controls h3,
.gradient-controls h3 {
  margin-top: 0;
  color: #1976d2;
}
.signal-builder {
  display: grid;
  gap: 15px;
  margin-bottom: 20px;
}
.signal-component {
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border-left: 4px solid #4caf50;
}
.signal-component label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.controls input[type="range"] {
  width: 100%;
  margin: 5px 0;
}
.display-options {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}
.visualization-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 20px;
  min-height: 600px;
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
.viz-container {
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}
.three-container {
  width: 100%;
  height: 470px;
  min-height: 470px;
  background-color: #f0f0f0;
}
.insights-panel {
  background-color: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
  margin-top: 20px;
}
.insights-panel h3 {
  margin-top: 0;
  color: #1976d2;
}
.insight-item {
  margin-bottom: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
}
.insight-item h4 {
  margin-top: 0;
  color: #1976d2;
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
}
button:hover:not(:disabled) {
  background-color: #1976d2;
}
button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
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
  .visualization-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(1, auto);
  }
  .signal-builder {
    grid-template-columns: 1fr;
  }
}
</style> 