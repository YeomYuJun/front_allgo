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
              <select v-model="selectedFunction" :disabled="isSimulationRunning">
                <option value="square">원: x² + y² ≤ 4 (반지름=2, 4π 추정)</option>
                <option value="sin_product">영역: sin(x*y) ≥ 0</option>
                <option value="ellipse">타원: x²/4 + y² ≤ 1</option>
                <option value="diamond">다이아몬드: |x| + |y| ≤ 2</option>
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
              <input type="range" v-model.number="iterations" min="100" max="3000" step="100" />
            </div>
            <div class="control-component">
              <label>애니메이션 속도: {{ animationSpeed }}ms</label>
              <input type="range" v-model.number="animationSpeed" min="10" max="50" step="10" />
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
    const animationSpeed = ref(10);
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
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/monte-carlo`;

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

      // 좌표축 추가 (XY 평면에 맞게)
      const axesHelper = new THREE.AxesHelper(3);
      scene.add(axesHelper);

      // XY 평면 그리드 생성
      const gridSize = 6;
      const gridDivisions = 20;
      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
      const gridGroup = new THREE.Group();

      // X축 방향 선들 (수평선들)
      for (let i = 0; i <= gridDivisions; i++) {
        const y = -gridSize / 2 + (gridSize / gridDivisions) * i;
        const points = [
          new THREE.Vector3(-gridSize / 2, y, 0),
          new THREE.Vector3(gridSize / 2, y, 0)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, gridMaterial.clone());
        gridGroup.add(line);
      }

      // Y축 방향 선들 (수직선들)
      for (let i = 0; i <= gridDivisions; i++) {
        const x = -gridSize / 2 + (gridSize / gridDivisions) * i;
        const points = [
          new THREE.Vector3(x, -gridSize / 2, 0),
          new THREE.Vector3(x, gridSize / 2, 0)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, gridMaterial.clone());
        gridGroup.add(line);
      }

      scene.add(gridGroup);

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

      // Create a group to hold all function visualization elements
      functionCurve = new THREE.Group();

      const steps = 50;
      const xMin = bounds.value.xMin;
      const xMax = bounds.value.xMax;
      const yMin = bounds.value.yMin;
      const yMax = bounds.value.yMax;

      // Draw function boundaries and special contours
      switch (selectedFunction.value) {

        case 'ellipse':
          // Draw ellipse x²/4 + y² ≤ 1 (horizontal radius=2, vertical radius=1)
          const ellipseGeom = new THREE.RingGeometry(0.98, 1.02, 64);
          ellipseGeom.scale(2, 1, 1); // Scale to make ellipse
          const ellipseMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
          const ellipseRing = new THREE.Mesh(ellipseGeom, ellipseMat);
          functionCurve.add(ellipseRing);
          
          // Draw filled ellipse
          const ellipseFillGeom = new THREE.CircleGeometry(1, 64);
          ellipseFillGeom.scale(2, 1, 1);
          const ellipseFillMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.1
          });
          const ellipseFill = new THREE.Mesh(ellipseFillGeom, ellipseFillMat);
          functionCurve.add(ellipseFill);
          break;

        case 'diamond':
          // Draw diamond |x| + |y| ≤ 2
          const diamondPoints = [
            new THREE.Vector3(2, 0, 0),   // right
            new THREE.Vector3(0, 2, 0),   // top
            new THREE.Vector3(-2, 0, 0),  // left
            new THREE.Vector3(0, -2, 0),  // bottom
            new THREE.Vector3(2, 0, 0)    // close
          ];
          const diamondGeom = new THREE.BufferGeometry().setFromPoints(diamondPoints);
          const diamondMat = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
          const diamondLine = new THREE.Line(diamondGeom, diamondMat);
          functionCurve.add(diamondLine);
          
          // Draw filled diamond using triangle geometry
          const diamondShape = new THREE.Shape();
          diamondShape.moveTo(2, 0);
          diamondShape.lineTo(0, 2);
          diamondShape.lineTo(-2, 0);
          diamondShape.lineTo(0, -2);
          diamondShape.lineTo(2, 0);
          
          const diamondFillGeom = new THREE.ShapeGeometry(diamondShape);
          const diamondFillMat = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.1
          });
          const diamondFill = new THREE.Mesh(diamondFillGeom, diamondFillMat);
          functionCurve.add(diamondFill);
          break;

        case 'sin_product':
          // Draw regions where sin(x*y) >= 0 (positive regions)
          const positivePoints = [];
          const negativePoints = [];
          const sampleStep = 0.1;
          
          for (let x = xMin; x <= xMax; x += sampleStep) {
            for (let y = yMin; y <= yMax; y += sampleStep) {
              const fValue = Math.sin(x * y);
              if (fValue >= 0) {
                positivePoints.push(new THREE.Vector3(x, y, 0));
              } else {
                negativePoints.push(new THREE.Vector3(x, y, 0));
              }
            }
          }
          
          // Draw positive regions (where sin(x*y) >= 0) - these are "inside"
          if (positivePoints.length > 0) {
            const posGeometry = new THREE.BufferGeometry().setFromPoints(positivePoints);
            const posMaterial = new THREE.PointsMaterial({ 
              color: 0x0000ff, 
              size: 0.05,
              transparent: true,
              opacity: 0.6
            });
            const posPoints = new THREE.Points(posGeometry, posMaterial);
            functionCurve.add(posPoints);
          }
          
          // Draw negative regions (where sin(x*y) < 0) - these are "outside" 
          if (negativePoints.length > 0) {
            const negGeometry = new THREE.BufferGeometry().setFromPoints(negativePoints);
            const negMaterial = new THREE.PointsMaterial({ 
              color: 0xff0000, 
              size: 0.03,
              transparent: true,
              opacity: 0.3
            });
            const negPoints = new THREE.Points(negGeometry, negMaterial);
            functionCurve.add(negPoints);
          }
          break;

        case 'square':
          // Draw threshold boundary for x^2 + y^2 <= 4
          const threshold = 4.0;
          const thresholdRadius = Math.sqrt(threshold);
          if (thresholdRadius <= Math.min(Math.abs(xMax), Math.abs(yMax))) {
            // Draw the main boundary circle (x^2 + y^2 = 4)
            const boundaryGeometry = new THREE.RingGeometry(thresholdRadius - 0.05, thresholdRadius + 0.05, 64);
            const boundaryMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x0000ff, 
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8
            });
            const boundaryRing = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            functionCurve.add(boundaryRing);

            // Draw inner filled circle to show the "inside" region
            const fillGeometry = new THREE.CircleGeometry(thresholdRadius, 64);
            const fillMaterial = new THREE.MeshBasicMaterial({ 
              color: 0x0000ff, 
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.1
            });
            const fillCircle = new THREE.Mesh(fillGeometry, fillMaterial);
            functionCurve.add(fillCircle);
          }
          break;

        default:
          // Fallback to simple line for y=0
          const points = [];
          for (let i = 0; i <= steps; i++) {
            const x = xMin + (xMax - xMin) * i / steps;
            const y = evaluateFunction(x, 0);
            points.push(new THREE.Vector3(x, y, 0));
          }
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
          const line = new THREE.Line(geometry, material);
          functionCurve.add(line);
          break;
      }

      scene.add(functionCurve);
    };

    // --- 함수 계산 ---
    const evaluateFunction = (x, y) => {
      switch (selectedFunction.value) {
        case 'square':
          return (x * x + y * y <= 4.0) ? 1 : 0;
        case 'sin_product':
          return Math.sin(x * y);
        case 'ellipse':
          return (x * x / 4.0 + y * y <= 1.0) ? 1 : 0;
        case 'diamond':
          return (Math.abs(x) + Math.abs(y) <= 2.0) ? 1 : 0;
        default:
          return (x * x + y * y <= 4.0) ? 1 : 0;
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

    // --- Function-specific bounds setup ---
    const adjustBoundsForFunction = (functionType) => {
      switch (functionType) {
        case 'square':
          // 원형 x² + y² ≤ 4, 반지름 2, [-2,2] x [-2,2]
          bounds.value = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
          break;
        case 'ellipse':
          // 타원  x²/4 + y² ≤ 1, [-2.5,2.5] x [-1.5,1.5]
          bounds.value = { xMin: -2.5, xMax: 2.5, yMin: -1.5, yMax: 1.5 };
          break;
        case 'diamond':
          // 다이아 모양, 절대 값 범위 |x| + |y| ≤ 2,  [-2.5,2.5] x [-2.5,2.5]
          bounds.value = { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };
          break;
        case 'sin_product':
          // 1사분면, 3사분면 렌더 
          bounds.value = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
          break;
        default:
          bounds.value = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
      }
    };

    // --- Watchers ---
    watch(selectedFunction, (newFunction) => {
      adjustBoundsForFunction(newFunction);
      drawFunctionCurve();
    });

    watch(bounds, () => {
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