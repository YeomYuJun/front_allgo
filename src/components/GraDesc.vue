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
                  <option value="triangle">f(x,y) = x⁵ - y⁵</option> {/* API 컨트롤러와 이름 일치 확인 */}
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
          <p v-if="selectedFunction !== 'monkey'"><strong>안장점 위치 (예상):</strong> (0, 0, 0)</p>
          <p v-else><strong>멍키 새들 포인트 (예상):</strong> (0, 0, 0)</p>
          <p class="description">
              선택된 함수에 대한 간략한 설명입니다.
          </p>
          <div v-if="gradientPathData.length > 0" class="gradient-info">
              <h4>경사 하강법 결과:</h4>
              <p>총 단계: {{ gradientPathData.length -1 }}</p>
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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// 만약 apiClient를 사용한다면 import 해주세요. 여기서는 fetch를 직접 사용합니다.
// import apiClient from '@/services/api'; 

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
                case 'standard': return 'f(x,y) = x² - y²';
                case 'monkey': return 'f(x,y) = x³ - 3xy²';
                case 'cubic': return 'f(x,y) = x⁴ - y⁴';
                case 'triangle': return 'f(x,y) = x⁵ - y⁵'; // API 컨트롤러의 functionType과 일치하는지 확인
                default: return 'f(x,y) = x² - y²';
            }
        });

        // API URL (백엔드 주소에 맞게 수정)
        const API_BASE_URL = 'http://localhost:8080/api/gdd';

        const calculateZ_local = (x, y, type) => { // 로컬 계산용 함수 이름 변경 (API와 구분)
            switch(type) {
                case 'standard': return Math.pow(x, 2) - Math.pow(y, 2);
                case 'monkey':   return Math.pow(x, 3) - 3 * x * Math.pow(y, 2);
                case 'cubic':    return Math.pow(x, 4) - Math.pow(y, 4);
                case 'triangle': return Math.pow(x, 5) - Math.pow(y, 5);
                default:         return Math.pow(x, 2) - Math.pow(y, 2);
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
                        // API (x,y,z) -> Three.js (x, z_api, y_api) 매핑은 여기서 고민
                        // 현재 질문자님의 코드는 API의 z값을 Three.js의 y(높이)로 사용
                        // vertices.push(p.x, p.z, p.y); // 기존 방식 유지
                        // 만약 API의 y가 수평축, z가 수직축(높이)이라면:
                        vertices.push(p.x, p.z,  p.y); // API의 x,y를 수평면, z를 높이로 가정하고 수정 (세로로 길게 나오는 현상 관련)
                                                      // 이 부분을 API 데이터 구조에 맞게 정확히 해야 합니다.
                                                      // 아래 색상 계산도 p.z를 기준으로 합니다.

                        const zValue = p.z; // 높이 값으로 사용할 z (위에서 vertices.push의 세 번째 값)
                        let r=0, g=0, b=0;
                        const normalizedZ = (zValue - (-range.value * range.value)) / (2 * range.value * range.value); // 대략적인 정규화
                        
                        if (zValue < 0) { // 파란색 계열
                            b = Math.min(1, Math.abs(zValue) / (range.value * Math.abs(range.value) / 2 + 1e-5)); // 0으로 나누기 방지
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
            pathData.forEach(step => {
                // API의 (x,y,z)를 Three.js 좌표계에 맞게 변환
                // createSurface와 동일한 방식으로 매핑해야 함
                // vertices.push(p.x, p.z, p.y) 였다면:
                // points.push(new THREE.Vector3(step.x, step.z, step.y)); 
                // vertices.push(p.x, p.y, p.z) 였다면:
                points.push(new THREE.Vector3(step.x, step.z, step.y ));
            });

            // 경로 선 생성
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff8800, linewidth: 3 }); // linewidth는 WebGL2에서만 잘 작동
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            gradientPathLine = new THREE.Line(lineGeometry, lineMaterial);
            scene.add(gradientPathLine);

            // 경로 점 생성
            const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
            gradientPathPoints = []; // 이전 포인트들 제거를 위해 배열 관리
            points.forEach((point, index) => {
                //const pointGeometry = new THREE.SphereGeometry(0.08, 12, 12); // 점 크기 조절
                const pointGeometry = new THREE.SphereGeometry(0.1, 12, 12); // 점 크기 조절
                const sphere = new THREE.Mesh(pointGeometry, pointMaterial);
                sphere.position.copy(point);
                scene.add(sphere);
                gradientPathPoints.push(sphere);

                // (선택적) 각 스텝에 레이블 추가
                // createTextLabel(`S${index}`, point.clone().add(new THREE.Vector3(0, 0.1, 0)), 0xff8800, 0.2);
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
/* ... (기존 스타일) ... */
.controls.gradient-controls {
    margin-top: 15px;
    background-color: #e8f0fe; /* 다른 컨트롤과 색상 구분 */
    padding-bottom: 20px; /* 버튼 공간 확보 */
}
.gradient-controls h2 {
    width: 100%;
    text-align: center;
    margin-bottom: 15px;
    font-size: 1.2em;
    color: #1976D2; /* Vuetify primary color 느낌 */
}
.gradient-controls .control-group {
    align-items: center; /* 내부 요소들 중앙 정렬 */
}
.gradient-controls button {
    padding: 8px 15px;
    background-color: #1976D2; /* Vuetify primary */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 0.9em;
}
.gradient-controls button:hover:not(:disabled) {
    background-color: #1565C0; /* Darker primary */
}
.gradient-controls button:disabled {
    background-color: #90CAF9; /* Lighter primary, disabled */
    cursor: not-allowed;
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
.three-container {
    width: 100%;
    height: 500px;
    min-height: 500px; /* 추가 */
    background-color: #f0f0f0;
    /* ... 이하 동일 ... */
}
</style>