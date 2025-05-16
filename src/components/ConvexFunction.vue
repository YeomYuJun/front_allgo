<template>
  <section class="cmmncword-container container">
      <h1>볼록 함수 3D 시각화</h1>

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
                  <option value="quadratic">f(x,y) = x² + y²</option>
                  <option value="quartic">f(x,y) = x⁴ + y⁴ + x²y²</option>
                  <option value="exponential">f(x,y) = e^(0.1*(x² + y²)) - 1</option>
                  <option value="rosenbrock">f(x,y) = 100(y - x²)² + (1 - x)²</option>
                  <option value="himmelblau">f(x,y) = (x² + y - 11)² + (x + y² - 7)²</option>
              </select>
          </div>
          <div class="control-group">
              <label>표시 모드:</label>
              <div class="display-options">
                  <label><input type="checkbox" v-model="showWireframe" /> 와이어프레임</label>
                  <label><input type="checkbox" v-model="showAxes" /> 좌표축</label>
                  <label><input type="checkbox" v-model="showMinimumPoint" /> 최소점</label>
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
              <label for="tolerance">수렴 허용 오차: {{ tolerance.toExponential(2) }}</label>
              <input type="range" id="tolerance" v-model.number="tolerance" min="1e-8" max="1e-4" step="1e-8" />
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
                  Z={{ minimumResult.z.toFixed(3) }}
              </p>
              <p>최종 그래디언트 크기: {{ minimumResult.gradientMagnitude.toExponential(3) }}</p>
          </div>
      </div>
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
        const functionAnalysis = ref(null);
        const theoreticalMinimum = ref([0, 0, 0]);
        const eigenvalues = ref([]);

        // --- Three.js 관련 변수 ---
        let scene, camera, renderer, controls;
        let surfaceMesh, wireframeMesh, axesHelper, minimumPointSphere;
        let gradientPathLine;
        let animationFrameId;

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

        // API URL
        const API_BASE_URL = 'http://localhost:8080/api/convex';

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
                updateGradientPath();
            } catch (error) {
                console.error('Error during gradient descent:', error);
            } finally {
                isGradientDescentRunning.value = false;
            }
        };

        const initThree = () => {
            if (!threeContainer.value) return;
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            const width = threeContainer.value.clientWidth;
            const height = threeContainer.value.clientHeight;

            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.set(range.value * 2.5, range.value * 2.5, range.value * 2.5);
            camera.lookAt(0, 0, 0);
            
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio);
            threeContainer.value.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            
            addLights();
            updateSceneObjects();
            animate();
            window.addEventListener('resize', onWindowResize);
        };

        const addLights = () => {
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
            dirLight.position.set(5, 10, 7.5);
            scene.add(dirLight);
        };

        const updateSceneObjects = async () => {
            if (!scene) return;

            // 기존 객체들 제거
            if (surfaceMesh) { scene.remove(surfaceMesh); surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); }
            if (wireframeMesh) { scene.remove(wireframeMesh); wireframeMesh.geometry.dispose(); wireframeMesh.material.dispose(); }
            if (axesHelper) { scene.remove(axesHelper); axesHelper.dispose(); }
            if (minimumPointSphere) { scene.remove(minimumPointSphere); minimumPointSphere.geometry.dispose(); minimumPointSphere.material.dispose(); }
            if (gradientPathLine) { scene.remove(gradientPathLine); gradientPathLine.geometry.dispose(); gradientPathLine.material.dispose(); }

            // 축 레이블 제거
            scene.children.filter(child => child instanceof THREE.Sprite && child.userData.isAxisLabel).forEach(label => scene.remove(label));

            await createSurface();
            await fetchFunctionAnalysis();

            if (showAxes.value) {
                axesHelper = new THREE.AxesHelper(range.value + 2);
                scene.add(axesHelper);
                addAxisLabels();
            }

            if (showMinimumPoint.value && theoreticalMinimum.value) {
                const geometry = new THREE.SphereGeometry(0.15, 16, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                minimumPointSphere = new THREE.Mesh(geometry, material);
                minimumPointSphere.position.set(
                    theoreticalMinimum.value[0],
                    theoreticalMinimum.value[2],
                    theoreticalMinimum.value[1]
                );
                scene.add(minimumPointSphere);
            }
        };

        const createSurface = async () => {
            const points = await fetchSurfaceData();
            if (!points || points.length === 0) {
                console.warn("No points data for surface.");
                return;
            }

            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            const indices = [];
            const numGridPoints = resolution.value + 1;

            for (let i = 0; i < numGridPoints; i++) {
                for (let j = 0; j < numGridPoints; j++) {
                    const index = i * numGridPoints + j;
                    if (index < points.length) {
                        const p = points[index];
                        vertices.push(p.x, p.z, p.y);
                    }
                }
            }

            // 인덱스 생성
            for (let i = 0; i < resolution.value; i++) {
                for (let j = 0; j < resolution.value; j++) {
                    const a = i * numGridPoints + j;
                    const b = a + 1;
                    const c = (i + 1) * numGridPoints + j;
                    const d = c + 1;

                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            // 메인 서피스
            const material = new THREE.MeshPhongMaterial({
                color: 0x156289,
                side: THREE.DoubleSide,
                flatShading: true
            });
            surfaceMesh = new THREE.Mesh(geometry, material);
            scene.add(surfaceMesh);

            // 와이어프레임
            if (showWireframe.value) {
                const wireframeMaterial = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    linewidth: 1,
                    opacity: 0.25,
                    transparent: true
                });
                wireframeMesh = new THREE.LineSegments(
                    new THREE.WireframeGeometry(geometry),
                    wireframeMaterial
                );
                scene.add(wireframeMesh);
            }
        };

        const updateGradientPath = () => {
            if (!scene || !gradientPathData.value.length) return;

            if (gradientPathLine) {
                scene.remove(gradientPathLine);
                gradientPathLine.geometry.dispose();
                gradientPathLine.material.dispose();
            }

            const points = gradientPathData.value.map(point => 
                new THREE.Vector3(point.x, point.z, point.y)
            );

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            gradientPathLine = new THREE.Line(geometry, material);
            scene.add(gradientPathLine);
        };

        const addAxisLabels = () => {
            const makeTextSprite = (message, position) => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = 'Bold 60px Arial';
                context.fillStyle = 'rgba(0,0,0,1)';
                context.fillText(message, 0, 60);
                
                const texture = new THREE.CanvasTexture(canvas);
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.copy(position);
                sprite.scale.set(2, 2, 1);
                sprite.userData.isAxisLabel = true;
                return sprite;
            };

            const labelDistance = range.value + 1;
            scene.add(makeTextSprite('X', new THREE.Vector3(labelDistance, 0, 0)));
            scene.add(makeTextSprite('Y', new THREE.Vector3(0, labelDistance, 0)));
            scene.add(makeTextSprite('Z', new THREE.Vector3(0, 0, labelDistance)));
        };

        const onWindowResize = () => {
            if (!camera || !renderer || !threeContainer.value) return;
            
            const width = threeContainer.value.clientWidth;
            const height = threeContainer.value.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls?.update();
            renderer?.render(scene, camera);
        };

        // --- Lifecycle Hooks ---
        onMounted(() => {
            initThree();
        });

        onBeforeUnmount(() => {
            window.removeEventListener('resize', onWindowResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            
            // Three.js 리소스 정리
            if (renderer) {
                renderer.dispose();
                renderer.domElement.remove();
            }
            if (scene) {
                scene.traverse((object) => {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
        });

        // --- Watchers ---
        watch([range, resolution, selectedFunction, showWireframe, showAxes, showMinimumPoint], () => {
            updateSceneObjects();
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
    height: 600px;
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
    padding-top: 15px;
    border-top: 1px solid #ddd;
}

button {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

button:disabled {
    background-color: #cccccc;
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
</style> 