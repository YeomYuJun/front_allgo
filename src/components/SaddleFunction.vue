<template>
    <section class="cmmncword-container container">
      <h1>안장점 함수 3D 시각화</h1>
  
      <div class="controls">
        <div class="control-group">
          <label>범위: ±{{ range }}</label>
          <input type="range" v-model.number="range" min="2" max="10" step="1" />
        </div>
        <div class="control-group">
          <label>해상도: {{ resolution }}</label>
          <input type="range" v-model.number="resolution" min="10" max="50" step="5" />
        </div>
        <div class="control-group">
          <label>함수 타입:</label>
          <select v-model="selectedFunction">
            <option value="standard">f(x,y) = x² - y²</option>
            <option value="monkey">f(x,y) = x³ - 3xy²</option>
            <option value="cubic">f(x,y) = x⁴ - y⁴</option>
            <option value="triangle">f(x,y) = x⁵ - y⁵</option>
          </select>
        </div>
        <div class="control-group">
          <label>표시 모드:</label>
          <div class="display-options">
            <label><input type="checkbox" v-model="showWireframe" /> 와이어프레임</label>
            <label><input type="checkbox" v-model="showAxes" /> 좌표축</label>
            <label><input type="checkbox" v-model="showSaddlePoint" /> 안장점 (0,0,0)</label>
          </div>
        </div>
      </div>
  
      <div class="controls gradient-controls">
        <h2>경사 하강법 시뮬레이션</h2>
        <div class="control-group">
          <label for="startX">시작 X: {{ startX.toFixed(2) }}</label>
          <input type="range" id="startX" v-model.number="startX" :min="-range" :max="range" step="0.1" />
        </div>
        <div class="control-group">
          <label for="startY">시작 Y: {{ startY.toFixed(2) }}</label>
          <input type="range" id="startY" v-model.number="startY" :min="-range" :max="range" step="0.1" />
        </div>
        <div class="control-group">
          <label for="learningRate">학습률: {{ learningRate.toFixed(3) }}</label>
          <input type="range" id="learningRate" v-model.number="learningRate" min="0.001" max="0.5" step="0.001" />
        </div>
        <div class="control-group">
          <label for="maxIterations">최대 반복: {{ maxIterations }}</label>
          <input type="range" id="maxIterations" v-model.number="maxIterations" min="10" max="200" step="10" />
        </div>
        <div class="control-group">
          <button @click="startGradientDescent" :disabled="isGradientDescentRunning">
            {{ isGradientDescentRunning ? '실행 중...' : '경사 하강 시작' }}
          </button>
        </div>
      </div>
  
      <div ref="threeContainer" class="three-container"></div>
  
      <div class="info-panel">
        <h3>함수 정보</h3>
        <p><strong>함수 방정식:</strong> {{ functionEquation }}</p>
        <p><strong>안장점 위치 (예상):</strong> (0, 0, 0)</p>
        <p class="description">
          선택된 함수는 전형적인 {{ selectedFunction === 'monkey' ? '몽키 새들' : '안장점' }} 함수입니다. 
          안장점에서는 다른 방향에 따라 함수 값이 증가하거나 감소할 수 있습니다.
        </p>
        <div v-if="gradientPathData.length > 0" class="gradient-info">
          <h4>경사 하강법 결과:</h4>
          <p>총 단계: {{ gradientPathData.length - 1 }}</p>
          <p>최종 위치: 
            X={{ gradientPathData[gradientPathData.length-1].x.toFixed(3) }}, 
            Y={{ gradientPathData[gradientPathData.length-1].y.toFixed(3) }}, 
            Z={{ gradientPathData[gradientPathData.length-1].z.toFixed(3) }}
          </p>
        </div>
      </div>
    </section>
  </template>
    
  <script>
  import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
  import SceneManager from '../three/SceneManager';
  import MathVisualization from '../three/MathVisualization';
  import GradientDescent from '../three/GradientDescent';
  
  export default {
    setup() {
      // --- 상태 변수들 ---
      const threeContainer = ref(null);
      const range = ref(5);
      const resolution = ref(30);
      const selectedFunction = ref('standard');
      const showWireframe = ref(true);
      const showAxes = ref(true);
      const showSaddlePoint = ref(true);
  
      // --- 경사 하강법 관련 상태 변수 ---
      const startX = ref(range.value * 0.8);
      const startY = ref(range.value * 0.8);
      const learningRate = ref(0.05);
      const maxIterations = ref(50);
      const isGradientDescentRunning = ref(false);
      const gradientPathData = ref([]);
  
      // --- Three.js 관련 객체 ---
      let sceneManager = null;
      let mathVisualization = null;
      let gradientDescent = null;
  
      // API URL - 환경변수 기반
      const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/gdd`;
  
      const functionEquation = computed(() => {
        switch(selectedFunction.value) {
          case 'standard': return 'f(x,y) = x² - y²';
          case 'monkey': return 'f(x,y) = x³ - 3xy²';
          case 'cubic': return 'f(x,y) = x⁴ - y⁴';
          case 'triangle': return 'f(x,y) = x⁵ - y⁵';
          default: return 'f(x,y) = x² - y²';
        }
      });
  
      // --- API 호출 함수 ---
      const fetchSurfaceData = async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/anjang?xMin=-${range.value}&xMax=${range.value}&yMin=-${range.value}&yMax=${range.value}&resolution=${resolution.value}&functionType=${selectedFunction.value}`
          );
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        } catch (error) {
          console.error('Error fetching surface data:', error);
          return generateLocalSurfaceData();
        }
      };
  
      // API 서버 오류 시 로컬에서 데이터 생성
      const generateLocalSurfaceData = () => {
        const points = [];
        const xStep = (2 * range.value) / resolution.value;
        const yStep = (2 * range.value) / resolution.value;
        
        for (let i = 0; i <= resolution.value; i++) {
          for (let j = 0; j <= resolution.value; j++) {
            const x = -range.value + i * xStep;
            const y = -range.value + j * yStep;
            const z = calculateZ(x, y, selectedFunction.value);
            points.push({ x, y, z });
          }
        }
        
        return points;
      };
  
      // 로컬 z값 계산 함수
      const calculateZ = (x, y, type) => {
        switch(type) {
          case 'standard': return Math.pow(x, 2) - Math.pow(y, 2);
          case 'monkey': return Math.pow(x, 3) - 3 * x * Math.pow(y, 2);
          case 'cubic': return Math.pow(x, 4) - Math.pow(y, 4);
          case 'triangle': return Math.pow(x, 5) - Math.pow(y, 5);
          default: return Math.pow(x, 2) - Math.pow(y, 2);
        }
      };
  
      const startGradientDescent = async () => {
        if (isGradientDescentRunning.value) return;
        isGradientDescentRunning.value = true;
        
        try {
          const params = new URLSearchParams({
            startX: startX.value,
            startY: startY.value,
            functionType: selectedFunction.value,
            learningRate: learningRate.value,
            maxIterations: maxIterations.value,
          });
          
          const response = await fetch(`${API_BASE_URL}/gradient-descent-path?${params.toString()}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "경사 하강 경로를 가져오는데 실패했습니다." }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
          
          const pathData = await response.json();
          gradientPathData.value = pathData;
          
          // 경사 하강 경로 시각화
          if (gradientDescent) {
            gradientDescent.visualizePath(pathData);
          }
        } catch (error) {
          console.error('Error running gradient descent:', error);
          alert(`경사 하강법 실행 오류: ${error.message}`);
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
        mathVisualization.createSurface(points, resolution.value, showWireframe.value, 'saddle');
        
        // 안장점 마커 업데이트
        if (showSaddlePoint.value) {
          mathVisualization.addSpecialPointMarker([0, 0, 0], 0.15, 0xff0000);
        } else {
          // 안장점 마커 제거
          if (mathVisualization.specialPointMarker) {
            sceneManager.scene.remove(mathVisualization.specialPointMarker);
            mathVisualization.specialPointMarker.geometry.dispose();
            mathVisualization.specialPointMarker.material.dispose();
            mathVisualization.specialPointMarker = null;
          }
        }
        
        // 경사 하강 경로 제거 (파라미터 변경 시)
        if (gradientDescent) {
          gradientDescent.clearPath();
          gradientPathData.value = [];
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
      watch([range, resolution, selectedFunction, showWireframe, showAxes, showSaddlePoint], () => {
        updateSceneObjects();
      });
  
      // range 변경 시 카메라 위치 조정
      watch(range, (newRange) => {
        if (sceneManager) {
          sceneManager.adjustCameraPosition(newRange * 2.5);
        }
        
        // 시작점 범위 조정
        if (startX.value > newRange) startX.value = newRange;
        if (startX.value < -newRange) startX.value = -newRange;
        if (startY.value > newRange) startY.value = newRange;
        if (startY.value < -newRange) startY.value = -newRange;
      });
  
      return {
        threeContainer,
        range,
        resolution,
        selectedFunction,
        showWireframe,
        showAxes,
        showSaddlePoint,
        startX,
        startY,
        learningRate,
        maxIterations,
        isGradientDescentRunning,
        gradientPathData,
        functionEquation,
        startGradientDescent
      };
    }
  };
  </script>
  
  <style scoped>
  .cmmncword-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .controls {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 8px;
  }
  
  .gradient-controls {
    margin-top: 20px;
    background-color: #e8f0fe;
    padding-bottom: 20px;
  }
  
  .gradient-controls h2 {
    width: 100%;
    text-align: center;
    margin-bottom: 15px;
    font-size: 1.2em;
    color: #1976D2;
  }
  
  .control-group {
    margin-bottom: 15px;
  }
  
  .control-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  .display-options {
    display: flex;
    gap: 20px;
  }
  
  .display-options label {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .three-container {
    width: 100%;
    height: 500px;
    min-height: 500px;
    background-color: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .info-panel {
    margin-top: 20px;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 8px;
  }
  
  .info-panel h3 {
    margin-top: 0;
  }
  
  .gradient-info {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #eee;
  }
  
  .gradient-info h4 {
    margin-bottom: 8px;
    color: #1976D2;
  }
  
  button {
    padding: 8px 15px;
    background-color: #1976D2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 0.9em;
  }
  
  button:hover:not(:disabled) {
    background-color: #1565C0;
  }
  
  button:disabled {
    background-color: #90CAF9;
    cursor: not-allowed;
  }
  
  input[type="range"] {
    width: 100%;
    max-width: 300px;
  }
  
  select {
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
  
  .description {
    font-style: italic;
    color: #666;
  }
  </style>