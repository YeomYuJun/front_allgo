<template>
  <section class="gra-desc-container container">
    <div>
      <h2 class="tit">3D Function Visualization & Gradient Descent</h2>
    </div>
    <section class="container-wrap">
      <!-- 좌측: 3D 시각화 -->
      <section class="sub-section section-l canvas-wrap">
        <div class="visualization-grid">
          <div class="viz-panel gra-3d-panel grid-fr">
            <h4>3D 함수 그래프</h4>
            <div ref="threeContainer" class="viz-container three-container"></div>
          </div>
          <div class="explanation-panel">
            <h4>경사 하강법이란?</h4>
            <div class="explanation-content">
              <div class="math-formula">
                <strong>알고리즘:</strong> xₙ₊₁ = xₙ - α ∇f(xₙ), α = 학습률 (learning rate)
              </div>
              <p><strong>핵심 개념:</strong></p>
              <ul>
                <li><strong>그래디언트(∇f):</strong> 함수가 가장 빠르게 증가하는 방향의 벡터</li>
                <li><strong>반대 방향 이동:</strong> 최소값을 찾기 위해 그래디언트의 반대로 이돔</li>
                <li><strong>학습률 α:</strong> 각 단계에서 얼마나 멀리 이동할지 결정</li>
                <li><strong>반복 과정:</strong> 지역 최속가 수렴까지 반복</li>
              </ul>
              <p><strong>알고리즘 특성:</strong></p>
              <ul>
                <li><strong>좌지보편:</strong> 경사하강법은 현재 위치의 지역 정보만 사용</li>
                <li><strong>안장점 문제:</strong> f(x,y) = x² - y² 같은 함수에서 방향에 따라 다른 경사</li>
                <li><strong>학습률 의존성:</strong> 너무 크면 발산, 너무 작으면 느린 수렴</li>
                <li><strong>지역 최적화:</strong> 전역 최소값을 보장하지 않음</li>
              </ul>
              <p><strong>시각화 요소:</strong></p>
              <ul>
                <li><strong>주황색 경로:</strong> 경사하강법의 이동 경로</li>
                <li><strong>색상 코딩:</strong> 빨강(높음) ~ 파랑(낮음) 스팩트럼</li>
                <li><strong>빨간 점:</strong> 안장점 (0,0,0) 위치 표시</li>
              </ul>
              <p><strong>응용 분야:</strong> 딥러닝 모델 학습, 머신러닝, 최적화 문제, 리더십 문제</p>
            </div>
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
                <option value="standard">f(x,y) = x² - y² (기본 안장점)</option>
                <option value="paraboloid">f(x,y) = x² + y² (포물면)</option>
                <option value="rosenbrock">f(x,y) = (1-x)² + 100(y-x²)² (로젠브록)</option>
                <option value="himmelblau">f(x,y) = (x²+y-11)² + (x+y²-7)² (힘멜블라우)</option>
                <option value="beale">f(x,y) = (1.5-x+xy)² + (2.25-x+xy²)² (빌)</option>
                <option value="monkey">f(x,y) = x³ - 3xy² (몽키 새들)</option>
              </select>
            </div>
            <div class="signal-component">
              <label>표시 모드:</label>
              <div class="display-options">
                <label><input type="checkbox" v-model="showWireframe" /> 와이어프레임</label>
                <label><input type="checkbox" v-model="showAxes" /> 좌표축</label>
                <label><input type="checkbox" v-model="showSaddlePoint" /> 안장점 (0,0,0)</label>
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
            <div class="function-description">
              <p v-if="selectedFunction === 'standard'">
                <strong>특징:</strong> 기본적인 안장점 함수
                <ul>
                  <li style="list-style: none;"> - 중앙(0,0) 안장점, 등고선이 쌍곡선</li>
                  <li style="list-style: none;"> - 경사하강법 시 축 방향에 따라 상반된 거동</li>
                  <li style="list-style: none;"> - 시각화·학습에 적합, 스케일 안정적</li>
                </ul>
              </p>
              <p v-else-if="selectedFunction === 'paraboloid'">
                <strong>특징:</strong> 단순한 볼록 함수, 전역 최솟값 (0,0)
                <ul>
                  <li style="list-style: none;"> - 원형 등고선, 어디서 시작해도 (0,0)로 수렴</li>
                  <li style="list-style: none;"> - 학습률에 비교적 둔감, 안정적 수렴</li>
                  <li style="list-style: none;"> - 별도 스케일링 필요성 낮음</li>
                </ul>
              </p>
              <p v-else-if="selectedFunction === 'rosenbrock'">
                <strong>특징:</strong> 바나나 함수, 전역 최솟값 (1,1)
                <ul>
                  <li style="list-style: none;"> - 매우 좁고 길게 휘어진 골짜기(ill-conditioned)</li>
                  <li style="list-style: none;"> - 학습률·초기값에 민감, 수렴 경로가 길어지기 쉬움</li>
                  <li style="list-style: none;"> - z값 범위가 큼 → 동적 로그 스케일링 적용</li>
                </ul>
              </p>
              <p v-else-if="selectedFunction === 'himmelblau'">
                <strong>특징:</strong> 4개의 전역 최솟값을 가진 복잡한 함수
                <ul>
                  <li style="list-style: none;"> - 범위 5 이상 설정 권장</li>
                  <li style="list-style: none;"> - z축에 동적 스케일링 적용</li>
                </ul>
              </p>
              <p v-else-if="selectedFunction === 'beale'">
                <strong>특징:</strong> 좁은 골짜기, 전역 최솟값 (3,0.5)
                <ul>
                  <li style="list-style: none;"> - 항들의 차수 증가로 값 폭이 매우 큼</li>
                  <li style="list-style: none;"> - (3,0.5) 포함하도록 범위 설정 권장</li>
                  <li style="list-style: none;"> - z값 범위 큼 → 동적 로그 스케일링 적용</li>
                </ul>
              </p>
              <!-- <p v-else-if="selectedFunction === 'monkey'"><strong>특징:</strong> 몽키 새들 포인트, 3차 함수</p> -->
              <p v-else><strong>특징:</strong> 고차 다항식 함수</p>
            </div>
            <div v-if="gradientPathData.length > 0" class="gradient-info">
              <h4>경사 하강법 결과:</h4>
              <p>총 단계: {{ gradientPathData.length -1 }}</p>
              <p>최종 위치: 
                X={{ Number(gradientPathData[gradientPathData.length-1].x).toFixed(3) }}, 
                Y={{ Number(gradientPathData[gradientPathData.length-1].y).toFixed(3) }}, 
                Z={{ Number(gradientPathData[gradientPathData.length-1].z).toFixed(3) }}
              </p>
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
        // --- 기존 상태 변수들 ---
        const threeContainer = ref(null);
        const range = ref(5);
        const resolution = ref(30); // 기본 해상도 약간 높임
        const selectedFunction = ref('standard');
        const showWireframe = ref(true);
        const showAxes = ref(true);
        const showSaddlePoint = ref(true);
        
        // Z 스케일링 공용 변수 (표면/경로 일관성)
        let zScaleFactor = 0.3;

        // --- 경사 하강법 관련 상태 변수 ---
        const startX = ref(range.value * 0.8); // 시작 X 기본값 (범위 내)
        const startY = ref(range.value * 0.8); // 시작 Y 기본값
        const learningRate = ref(0.05);
        const maxIterations = ref(50);
        const isGradientDescentRunning = ref(false);
        const gradientPathData = ref([]); // API로부터 받은 경로 데이터 저장

        // --- Three.js 관련 변수 ---
        let scene, camera, renderer, controls;
        let surfaceMesh, wireframeMesh, axesHelper, saddlePointSphere;
        let gradientPathLine, gradientPathPoints = []; // 경사 하강 경로 시각화 객체
        let animationFrameId;

        const functionEquation = computed(() => {
            switch(selectedFunction.value) {
                case 'standard': return 'f(x,y) = x² - y² (기본 안장점 함수)';
                case 'paraboloid': return 'f(x,y) = x² + y² (단순한 볼록 함수)';
                case 'rosenbrock': return 'f(x,y) = (1-x)² + 100(y-x²)² (최적화 벤치마크)';
                case 'himmelblau': return "f(x,y) = (x²+y-11)² + (x+y²-7)² (4개의 최솟값)";
                case 'beale': return 'f(x,y) = (1.5-x+xy)² + (2.25-x+xy²)² (복잡한 골짜기)';
                case 'monkey': return 'f(x,y) = x³ - 3xy² (몽키 새들 포인트)';
                // 레거시 호환성
                case 'cubic': return 'f(x,y) = x⁴ - y⁴';
                case 'triangle': return 'f(x,y) = x⁵ - y⁵';
                default: return 'f(x,y) = x² - y²';
            }
        });

        // API URL - 환경변수 기반
        const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/gdd`;

        const calculateZ_local = (x, y, type) => {
            switch(type) {
                case 'standard': return Math.pow(x, 2) - Math.pow(y, 2);
                case 'paraboloid': return Math.pow(x, 2) + Math.pow(y, 2);
                case 'rosenbrock': return Math.pow(1-x, 2) + 100 * Math.pow(y - Math.pow(x, 2), 2);
                case 'himmelblau': return Math.pow(Math.pow(x, 2) + y - 11, 2) + Math.pow(x + Math.pow(y, 2) - 7, 2);
                case 'beale': return Math.pow(1.5 - x + x*y, 2) + Math.pow(2.25 - x + x*Math.pow(y, 2), 2) + Math.pow(2.625 - x + x*Math.pow(y, 3), 2);
                case 'monkey': return Math.pow(x, 3) - 3 * x * Math.pow(y, 2);
                // 레거시 호환성
                case 'cubic': return Math.pow(x, 4) - Math.pow(y, 4);
                case 'triangle': return Math.pow(x, 5) - Math.pow(y, 5);
                default: return Math.pow(x, 2) - Math.pow(y, 2);
            }
        };
        
        const fetchSurfaceData = async () => { // 함수 이름 명확화
            try {
                const response = await fetch(
                    `${API_BASE_URL}/anjang?xMin=-${range.value}&xMax=${range.value}&yMin=-${range.value}&yMax=${range.value}&resolution=${resolution.value}&functionType=${selectedFunction.value}`
                );
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Error fetching surface data:', error);
                return generateLocalSurfaceData(); // API 실패 시 로컬 데이터 생성
            }
        };

        const generateLocalSurfaceData = () => { // 함수 이름 명확화
            const points = [];
            const xStep = (2 * range.value) / resolution.value;
            const yStep = (2 * range.value) / resolution.value;
            for (let i = 0; i <= resolution.value; i++) {
                for (let j = 0; j <= resolution.value; j++) {
                    const x = -range.value + i * xStep;
                    const y = -range.value + j * yStep;
                    const z = calculateZ_local(x, y, selectedFunction.value);
                    points.push({ x, y, z });
                }
            }
            return points;
        };

        const initThree = () => {
            if (!threeContainer.value) return;
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            const width = threeContainer.value.clientWidth;
            const height = threeContainer.value.clientHeight;

            console.log('initThree - Container dimensions: width=', width, 'height=', height); // 여기에 로그 추가
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.set(range.value * 2.5, range.value * 2.5, range.value * 2.5); // range에 따라 카메라 위치 조절
            camera.lookAt(0, 0, 0);
            
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(window.devicePixelRatio);
            threeContainer.value.appendChild(renderer.domElement);
            
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05; // DampingFactor 약간 줄임
            
            addLights();
            updateSceneObjects(); // 함수 이름 변경
            animate();
            window.addEventListener('resize', onWindowResize);
        };

        const addLights = () => {
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
            dirLight.position.set(5, 10, 7.5);
            scene.add(dirLight);
        };

        const updateSceneObjects = async () => { // async 추가 및 이름 변경
            if (!scene) return;

            // 기존 표면 관련 객체 제거
            if (surfaceMesh) { scene.remove(surfaceMesh); surfaceMesh.geometry.dispose(); surfaceMesh.material.dispose(); surfaceMesh = null;}
            if (wireframeMesh) { scene.remove(wireframeMesh); wireframeMesh.geometry.dispose(); wireframeMesh.material.dispose(); wireframeMesh = null;}
            
            // 기존 기타 객체 제거
            if (axesHelper) { scene.remove(axesHelper); axesHelper.dispose(); axesHelper = null;}
            if (saddlePointSphere) { scene.remove(saddlePointSphere); saddlePointSphere.geometry.dispose(); saddlePointSphere.material.dispose(); saddlePointSphere = null;}
            // 기존 축 레이블 제거 (createTextLabel에서 scene.add 하므로, 제거 로직 필요)
            scene.children.filter(child => child instanceof THREE.Sprite && child.userData.isAxisLabel).forEach(label => scene.remove(label));


            await createSurface(); // await 추가

            if (showAxes.value) {
                axesHelper = new THREE.AxesHelper(range.value + 2); // 크기 약간 키움
                scene.add(axesHelper);
                addAxisLabels();
            }
            if (showSaddlePoint.value) {
                const geometry = new THREE.SphereGeometry(0.15, 16, 16); // 크기 약간 줄임
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                saddlePointSphere = new THREE.Mesh(geometry, material);
                saddlePointSphere.position.set(0, 0, 0); // API의 z가 three의 y로 매핑됨을 유의
                scene.add(saddlePointSphere);
            }
        };

        const createSurface = async () => {
            let points = await fetchSurfaceData();
            if (!points || points.length === 0) {
                console.warn("No points data for surface.");
                return;
            }

            // 힘멜블라우 전용 동적 스케일링 (로그 스케일)
            const needsLogScale = ['himmelblau', 'rosenbrock', 'beale'].includes(selectedFunction.value);
            if (needsLogScale) {
                const maxZ = points.reduce((m, p) => Math.max(m, p.z), 0);
                const targetHeight = range.value * 0.6; // 원하는 최대 높이
                const denom = Math.log1p(Math.max(maxZ, 1e-6));
                zScaleFactor = targetHeight / denom;
            } else {
                zScaleFactor = 0.3; // 기존 스케일 유지
            }

            const geometry = new THREE.BufferGeometry();
            const vertices = [];
            const colors = [];
            const indices = [];
            const numGridPoints = resolution.value + 1;

            for (let i = 0; i < numGridPoints; i++) {
                for (let j = 0; j < numGridPoints; j++) {
                    const index = i * numGridPoints + j;
                    if (index < points.length) {
                        const p = points[index];
                        // 로그 스케일 필요 함수에만 적용
                        const baseZ = needsLogScale ? Math.log1p(p.z) : p.z;
                        const scaledZ = baseZ * zScaleFactor;
                        vertices.push(p.x, scaledZ, p.y);

                        // 색상도 스케일 적용된 z를 기준으로
                        const zValue = scaledZ;
                        let r=0, g=0, b=0;
                        const normalizedZ = (zValue - (-range.value * range.value)) / (2 * range.value * range.value);
                        
                        if (zValue < 0) { // 파란색 계열
                            b = Math.min(1, Math.abs(zValue) / (range.value * Math.abs(range.value) / 2 + 1e-5));
                            r = 0.2 * (1-b); g = 0.5 * (1-b);
                        } else { // 빨간색 계열
                            r = Math.min(1, zValue / (range.value * Math.abs(range.value) / 2 + 1e-5));
                            g = 0.2 * (1-r); b = 0.2 * (1-r);
                        }
                        colors.push(r, g, b);
                    }
                }
            }

            for (let i = 0; i < resolution.value; i++) {
                for (let j = 0; j < resolution.value; j++) {
                    const a = i * numGridPoints + j;
                    const b = i * numGridPoints + (j + 1);
                    const c = (i + 1) * numGridPoints + j;
                    const d = (i + 1) * numGridPoints + (j + 1);
                    indices.push(a, c, b); // 삼각형 순서 변경 (법선 방향 고려)
                    indices.push(b, c, d);
                }
            }

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            const material = new THREE.MeshPhongMaterial({
                side: THREE.DoubleSide,
                vertexColors: true,
                shininess: 30, // 광택 줄임
            });
            surfaceMesh = new THREE.Mesh(geometry, material);
            scene.add(surfaceMesh);

            if (showWireframe.value) {
                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x333333, wireframe: true, transparent: true, opacity: 0.15
                });
                wireframeMesh = new THREE.Mesh(geometry.clone(), wireframeMaterial); // geometry 공유 가능
                scene.add(wireframeMesh);
            }
        };
        
        const addAxisLabels = () => {
            const labelSize = range.value * 0.1; // 레이블 크기를 range에 비례하게
            const labelDist = range.value + labelSize;

            // 기존 레이블 제거 (중복 방지)
            scene.children.filter(child => child.userData.isAxisLabel).forEach(label => scene.remove(label));

            // API의 (x,y,z)가 Three.js에서 (x, y_three, z_three)로 어떻게 매핑되는지 고려해야 합니다.
            // 현재 createSurface에서 vertices.push(p.x, p.y, p.z)로 했다면, API의 y가 Three.js의 y(수평), z가 Three.js의 z(높이)가 됩니다.
            // 하지만 일반적으로 수학에서 f(x,y)=z 이고, 3D 시각화 시 z를 높이로 씁니다.
            // API의 z를 Three.js의 Y (높이)로 쓰고 싶다면, vertices.push(p.x, p.z, p.y)가 맞습니다. (기존 코드)
            // 여기서는 축 레이블이 Three.js 좌표계 기준이므로,
            // 만약 API의 x,y가 수평면이고 API의 z가 높이라면:
            // X축 (빨강): (range, 0, 0)
            // Y축 (초록): (0, range, 0) -> 이것이 수평축이 될 것
            // Z축 (파랑): (0, 0, range) -> 이것이 높이축이 될 것
            // API x -> Three.js X
            // API z -> Three.js Y (높이)
            // API y -> Three.js Z (깊이)

            // 만약 API의 x가 X, API의 y가 Z(깊이), API의 z가 Y(높이) (기존 코드 방식 vertices.push(p.x, p.z, p.y)) 라면:
            createTextLabel('X', new THREE.Vector3(labelDist, 0, 0), 0xff0000, labelSize, true);
            createTextLabel('Y', new THREE.Vector3(0, 0, labelDist), 0x0000ff, labelSize, true); // API의 Y (Three.js의 Z축)
            createTextLabel('Z', new THREE.Vector3(0, labelDist, 0), 0x00ff00, labelSize, true); // API의 Z (Three.js의 Y축 - 높이)

        };

        const createTextLabel = (text, position, color, size, isAxisLabel = false) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const fontFace = "Arial";
            const fontSize = 64;
            context.font = `Bold ${fontSize}px ${fontFace}`;
            const textWidth = context.measureText(text).width;

            canvas.width = textWidth + 20; // 텍스트 너비에 맞게 조절
            canvas.height = fontSize + 20; // 폰트 크기에 맞게 조절

            // 다시 폰트 설정 (캔버스 크기 변경 후 초기화될 수 있음)
            context.font = `Bold ${fontSize}px ${fontFace}`;
            context.fillStyle = `rgba(${new THREE.Color(color).r*255}, ${new THREE.Color(color).g*255}, ${new THREE.Color(color).b*255}, 1.0)`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.SpriteMaterial({ map: texture, depthTest: false }); // depthTest false로 항상 보이게
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            
            // 화면 크기에 관계없이 일정한 크기를 유지하도록 스케일 조절 (또는 카메라 거리에 따라 조절)
            sprite.scale.set(size * (canvas.width/canvas.height) , size, 1);
            if (isAxisLabel) sprite.userData.isAxisLabel = true;
            scene.add(sprite);
        };


        // --- 경사 하강법 시각화 함수 ---
        const startGradientDescent = async () => {
            if (isGradientDescentRunning.value) return;
            isGradientDescentRunning.value = true;
            gradientPathData.value = [];
            clearGradientPathVisuals();

            try {
                // API 호출 시 selectedFunction.value를 사용해야 합니다.
                const params = new URLSearchParams({
                    startX: startX.value,
                    startY: startY.value, // API는 startY로 받음 (수평면 좌표)
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
                drawGradientPath(pathData);
            } catch (error) {
                console.error('Error running gradient descent:', error);
                alert(`경사 하강법 실행 오류: ${error.message}`);
            } finally {
                isGradientDescentRunning.value = false;
            }
        };

        const drawGradientPath = (pathData) => {
          console.log('Attempting to draw gradient path with data:', JSON.stringify(pathData, null, 2)); // 함수 호출 및 데이터 확인
            if (!scene || !pathData || pathData.length === 0) {
                console.warn('Scene not ready or no path data to draw.');
                return;
            }

            const points = [];
            pathData.forEach(stepRaw => {
                const step = {
                  x: Number(stepRaw.x),
                  y: Number(stepRaw.y),
                  z: Number(stepRaw.z)
                };
                if (!isFinite(step.x) || !isFinite(step.y) || !isFinite(step.z)) return; // 잘못된 점 무시
                // 표면과 동일 스케일 적용
                const baseZ = ['himmelblau', 'rosenbrock', 'beale'].includes(selectedFunction.value) ? Math.log1p(step.z) : step.z;
                if (!isFinite(baseZ)) return;
                const scaledStepZ = baseZ * zScaleFactor; 
                if (!isFinite(scaledStepZ)) return;
                points.push(new THREE.Vector3(step.x, scaledStepZ, step.y));
            });

            if (points.length === 0) {
                console.warn('No valid points to draw for gradient path.');
                return;
            }

            // 경로 선 생성
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8800, linewidth: 3 }); // linewidth는 WebGL2에서만 잘 작동
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            gradientPathLine = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(gradientPathLine);

            // 경로 점 생성
            const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
            gradientPathPoints = []; // 이전 포인트들 제거를 위해 배열 관리
            points.forEach((point, index) => {
                const pointGeometry = new THREE.SphereGeometry(0.1, 12, 12); // 점 크기 조절
                const sphere = new THREE.Mesh(pointGeometry, pointMaterial);
                sphere.position.copy(point);
                scene.add(sphere);
                gradientPathPoints.push(sphere);
            });
        };

        const clearGradientPathVisuals = () => {
            if (gradientPathLine) {
                scene.remove(gradientPathLine);
                gradientPathLine.geometry.dispose();
                gradientPathLine.material.dispose();
                gradientPathLine = null;
            }
            gradientPathPoints.forEach(p => {
                scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            });
            gradientPathPoints = [];
            // 경로 레이블도 제거해야 한다면 추가 로직 필요
             scene.children.filter(child => child.userData.isGradientStepLabel).forEach(label => scene.remove(label));
        };


        const onWindowResize = () => {
            // ... (기존 코드)
             if (!threeContainer.value || !camera || !renderer) return;
            const width = threeContainer.value.clientWidth;
            const height = threeContainer.value.clientHeight;
            console.log('onWindowResize - Container dimensions: width=', width, 'height=', height); // 여기에 로그 추가
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };

        const animate = () => {
            // ... (기존 코드)
            animationFrameId = requestAnimationFrame(animate);
            if (controls) controls.update();
            if (renderer && scene && camera) renderer.render(scene, camera);
        };

        const cleanup = () => {
            // ... (기존 코드)
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            clearGradientPathVisuals(); // 경사 하강 경로 객체들도 정리
            if (threeContainer.value && renderer && renderer.domElement) {
                 if (threeContainer.value.contains(renderer.domElement)) {
                    threeContainer.value.removeChild(renderer.domElement);
                 }
            }
            if (renderer) renderer.dispose(); // 렌더러 자체도 dispose

            // surfaceMesh, wireframeMesh 등은 updateSceneObjects에서 관리
        };

        // UI 변경에 따른 씬 업데이트
        watch([range, resolution, selectedFunction, showWireframe, showAxes, showSaddlePoint], () => {
            // 표면 관련 파라미터 변경 시 경사 하강 경로도 초기화
            clearGradientPathVisuals();
            gradientPathData.value = [];
            updateSceneObjects();
        });
        
        // 시작점 범위가 range에 따라 동적으로 변경되도록 watch 추가
        watch(range, (newRange) => {
            if (startX.value > newRange) startX.value = newRange;
            if (startX.value < -newRange) startX.value = -newRange;
            if (startY.value > newRange) startY.value = newRange;
            if (startY.value < -newRange) startY.value = -newRange;
        });

        onMounted(() => {
            // setTimeout으로 DOM 렌더링 이후 initThree 호출하는 것 유지
             setTimeout(() => {
                if (threeContainer.value) { // 컨테이너가 실제로 존재하는지 확인
                    initThree();
                } else {
                    console.error("Three.js container not found on mount.");
                }
            }, 0);
        });

        onBeforeUnmount(() => {
            cleanup();
        });

        return {
            threeContainer,
            range,
            resolution,
            selectedFunction,
            showWireframe,
            showAxes,
            showSaddlePoint,
            functionEquation,
            // 경사 하강법 관련
            startX,
            startY,
            learningRate,
            maxIterations,
            startGradientDescent,
            isGradientDescentRunning,
            gradientPathData
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
.gra-desc-container {
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