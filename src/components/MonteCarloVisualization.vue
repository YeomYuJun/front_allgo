<template>
  <section class="monte-carlo-container container">
    <div>
      <h2 class="tit">Monte Carlo Integration 시각화</h2>
    </div>
    <section class="container-wrap">
      <!-- 좌측: 2D 시각화 -->
      <section class="sub-section section-l canvas-wrap">
        <div class="visualization-grid">
          <div class="viz-panel monte-carlo-2d-panel grid-fr">
            <h4>Monte Carlo Integration 시뮬레이션</h4>
            <div ref="threeContainer" class="viz-container three-container"></div>
          </div>
        </div>
      </section>
      <!-- 우측: 컨트롤 및 정보 -->
      <section class="sub-section section-r controls-wrap">
        <div class="controls function-controls">
          <h3>1. 함수 설정</h3>
          <div class="control-builder">
            <div class="control-component">
              <label>함수 타입:</label>
              <select v-model="selectedFunction">
                <option value="square">f(x,y) = x² + y²</option>
                <option value="sin_product">f(x,y) = sin(x*y)</option>
                <option value="circle">f(x,y) = √(1 - x² - y²)</option>
              </select>
            </div>
            <div class="control-component">
              <label>X 범위: [{{ bounds.xMin }}, {{ bounds.xMax }}]</label>
              <input type="range" v-model.number="bounds.xMin" min="-3" max="0" step="0.1" />
              <input type="range" v-model.number="bounds.xMax" min="0" max="3" step="0.1" />
            </div>
            <div class="control-component">
              <label>Y 범위: [{{ bounds.yMin }}, {{ bounds.yMax }}]</label>
              <input type="range" v-model.number="bounds.yMin" min="-3" max="0" step="0.1" />
              <input type="range" v-model.number="bounds.yMax" min="0" max="3" step="0.1" />
            </div>
          </div>
        </div>
        <div class="controls simulation-controls">
          <h3>2. 시뮬레이션 설정</h3>
          <div class="control-builder">
            <div class="control-component">
              <label>점 개수: {{ iterations }}</label>
              <input type="range" v-model.number="iterations" min="100" max="5000" step="100" />
            </div>
            <div class="control-component">
              <label>애니메이션 속도: {{ animationSpeed }}ms</label>
              <input type="range" v-model.number="animationSpeed" min="10" max="500" step="10" />
            </div>
            <div class="control-component">
              <button @click="startSimulation" :disabled="isSimulationRunning">
                {{ isSimulationRunning ? '시뮬레이션 진행 중...' : 'Monte Carlo 시작' }}
              </button>
              <button @click="resetSimulation" :disabled="isSimulationRunning">
                리셋
              </button>
            </div>
          </div>
        </div>
        <div class="results-panel">
          <h3>결과</h3>
          <div class="result-content" v-if="monteCarloResult">
            <p><strong>총 점 개수:</strong> {{ monteCarloResult.totalCount }}</p>
            <p><strong>영역 내부 점:</strong> {{ monteCarloResult.insideCount }}</p>
            <p><strong>추정값:</strong> {{ monteCarloResult.estimate.toFixed(6) }}</p>
            <p v-if="!isNaN(monteCarloResult.actualValue)">
              <strong>실제값:</strong> {{ monteCarloResult.actualValue.toFixed(6) }}
            </p>
            <p v-if="!isNaN(monteCarloResult.actualValue)">
              <strong>오차:</strong> {{ Math.abs(monteCarloResult.estimate - monteCarloResult.actualValue).toFixed(6) }}
            </p>
            <div class="convergence-info" v-if="monteCarloResult.convergenceHistory && monteCarloResult.convergenceHistory.length > 0">
              <h4>수렴 과정:</h4>
              <div class="convergence-chart">
                <!-- 간단한 수렴 차트를 위한 공간 -->
                <canvas ref="convergenceCanvas" width="300" height="150"></canvas>
              </div>
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
    const convergenceCanvas = ref(null);
    const selectedFunction = ref('square');
    const bounds = ref({
      xMin: -2,
      xMax: 2,
      yMin: -2,
      yMax: 2
    });
    const iterations = ref(1000);
    const animationSpeed = ref(50);
    const isSimulationRunning = ref(false);
    const monteCarloResult = ref(null);

    // --- Three.js 관련 객체 ---
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let animationId = null;
    let pointsGroup = null;
    let functionCurve = null;

    // API URL
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/monte-carlo`;

    // --- API 호출 함수 ---
    const performMonteCarloIntegration = async () => {
      try {
        const requestData = {
          iterations: iterations.value,
          bounds: bounds.value,
          functionType: selectedFunction.value
        };

        const response = await fetch(`${API_BASE_URL}/integrate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error performing Monte Carlo integration:', error);
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
      camera.position.set(0, 0, 8);

      // Renderer 생성
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
      threeContainer.value.appendChild(renderer.domElement);

      // Controls 생성
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;

      // 좌표축 추가
      const axesHelper = new THREE.AxesHelper(3);
      scene.add(axesHelper);

      // 그리드 추가
      const gridHelper = new THREE.GridHelper(6, 20);
      gridHelper.rotateX(Math.PI / 2);
      scene.add(gridHelper);

      // Points group 초기화
      pointsGroup = new THREE.Group();
      scene.add(pointsGroup);

      // 함수 곡선 그리기
      drawFunctionCurve();

      // 애니메이션 루프 시작
      animate();
    };

    // --- 함수 곡선 그리기 ---
    const drawFunctionCurve = () => {
      if (functionCurve) {
        scene.remove(functionCurve);
      }

      const geometry = new THREE.BufferGeometry();
      const points = [];

      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const x = bounds.value.xMin + (bounds.value.xMax - bounds.value.xMin) * i / steps;
        const y = evaluateFunction(x, 0);
        points.push(new THREE.Vector3(x, y, 0));
      }

      geometry.setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
      functionCurve = new THREE.Line(geometry, material);
      scene.add(functionCurve);
    };

    // --- 함수 계산 ---
    const evaluateFunction = (x, y) => {
      switch (selectedFunction.value) {
        case 'square':
          return x * x + y * y;
        case 'sin_product':
          return Math.sin(x * y);
        case 'circle':
          const r = Math.sqrt(x * x + y * y);
          return r <= 1 ? Math.sqrt(1 - x * x - y * y) : 0;
        default:
          return x * x + y * y;
      }
    };

    // --- 시뮬레이션 시작 ---
    const startSimulation = async () => {
      if (isSimulationRunning.value) return;
      isSimulationRunning.value = true;

      // 기존 점들 제거
      pointsGroup.clear();

      try {
        const result = await performMonteCarloIntegration();
        if (result) {
          monteCarloResult.value = result;
          await animatePoints(result.points);
          drawConvergenceChart(result.convergenceHistory);
        }
      } catch (error) {
        console.error('Simulation error:', error);
      } finally {
        isSimulationRunning.value = false;
      }
    };

    // --- 점들 애니메이션 ---
    const animatePoints = (points) => {
      return new Promise((resolve) => {
        let index = 0;
        const addNextPoint = () => {
          if (index >= points.length) {
            resolve();
            return;
          }

          const point = points[index];
          const geometry = new THREE.SphereGeometry(0.02, 8, 8);
          const material = new THREE.MeshBasicMaterial({
            color: point.inside ? 0xff0000 : 0x0000ff
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(point.x, point.y, 0);
          pointsGroup.add(sphere);

          index++;
          setTimeout(addNextPoint, animationSpeed.value);
        };

        addNextPoint();
      });
    };

    // --- 수렴 차트 그리기 ---
    const drawConvergenceChart = (convergenceHistory) => {
      if (!convergenceCanvas.value || !convergenceHistory) return;

      const canvas = convergenceCanvas.value;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (convergenceHistory.length === 0) return;

      const minValue = Math.min(...convergenceHistory);
      const maxValue = Math.max(...convergenceHistory);
      const range = maxValue - minValue;

      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < convergenceHistory.length; i++) {
        const x = (i / (convergenceHistory.length - 1)) * width;
        const y = height - ((convergenceHistory[i] - minValue) / range) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    // --- 시뮬레이션 리셋 ---
    const resetSimulation = () => {
      pointsGroup.clear();
      monteCarloResult.value = null;
      if (convergenceCanvas.value) {
        const ctx = convergenceCanvas.value.getContext('2d');
        ctx.clearRect(0, 0, convergenceCanvas.value.width, convergenceCanvas.value.height);
      }
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
      if (renderer) {
        threeContainer.value?.removeChild(renderer.domElement);
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
    watch([selectedFunction, bounds], () => {
      drawFunctionCurve();
    });

    return {
      threeContainer,
      convergenceCanvas,
      selectedFunction,
      bounds,
      iterations,
      animationSpeed,
      isSimulationRunning,
      monteCarloResult,
      startSimulation,
      resetSimulation
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

.monte-carlo-container {
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

.controls select {
  width: 100%;
  padding: 5px;
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
  margin-top: 20px;
}

.results-panel h3 {
  margin-top: 0;
  color: #1976d2;
}

.result-content p {
  margin: 8px 0;
}

.convergence-chart {
  margin-top: 10px;
}

.convergence-chart canvas {
  border: 1px solid #ddd;
  border-radius: 4px;
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
}
</style>