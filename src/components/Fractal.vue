<template>
  <section class="fractal-container container">
    <h1>프랙탈 시각화</h1>

    <div class="controls">
      <div class="control-group">
        <label>프랙탈 타입:</label>
        <select v-model="selectedFractalType">
          <option value="mandelbrot">만델브로트 집합</option>
          <option value="julia">줄리아 집합</option>
          <option value="sierpinski">시에르핀스키 삼각형</option>
          <option value="barnsley">반슬리 고사리</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>반복 횟수: {{ iterations }}</label>
        <input type="range" 
               v-model.number="iterations" 
               :min="getMinIterations" 
               :max="getMaxIterations" 
               :step="getIterationStep" />
      </div>
      
      <div class="control-group">
        <label>해상도: {{ resolution }}</label>
        <input type="range" v-model.number="resolution" min="100" max="1000" step="50" />
      </div>
      
      <div v-if="selectedFractalType === 'julia'" class="control-group julia-params">
        <label>줄리아 상수:</label>
        <div class="julia-inputs">
          <div>
            <label>실수부: {{ juliaReal }}</label>
            <input type="range" v-model.number="juliaReal" min="-2" max="2" step="0.01" />
          </div>
          <div>
            <label>허수부: {{ juliaImag }}</label>
            <input type="range" v-model.number="juliaImag" min="-2" max="2" step="0.01" />
          </div>
        </div>
      </div>
      
      <div class="control-group">
        <label>색상 스키마:</label>
        <select v-model="colorScheme">
          <option value="classic">클래식</option>
          <option value="rainbow">무지개</option>
          <option value="fire">화염</option>
          <option value="ocean">해양</option>
          <option value="grayscale">흑백</option>
        </select>
      </div>
      
      <div class="control-group display-options">
        <label><input type="checkbox" v-model="showAxis" /> 좌표축 표시</label>
        <label><input type="checkbox" v-model="smoothShading" /> 부드러운 음영</label>
        <label><input type="checkbox" v-model="showInfo" /> 정보 표시</label>
      </div>
    </div>

    <div class="visualization-container">
      <div ref="fractalContainer" class="fractal-view"></div>
      
      <div v-if="showInfo" class="info-panel">
        <h3>프랙탈 정보</h3>
        <div v-if="fractalInfo">
          <p><strong>프랙탈 차원:</strong> {{ fractalDimension }}</p>
          <p><strong>반복 깊이:</strong> {{ iterations }}</p>
          <p><strong>수렴 영역 비율:</strong> {{ convergenceRatio }}%</p>
          <p v-if="selectedFractalType === 'julia'">
            <strong>줄리아 상수:</strong> {{ juliaReal }} + {{ juliaImag }}i
          </p>
        </div>
        
        <div class="zoom-info">
          <p><strong>줌 레벨:</strong> {{ zoomLevel }}x</p>
          <p><strong>중심 좌표:</strong> ({{ centerX }}, {{ centerY }})</p>
        </div>
        
        <div class="controls-help">
          <h4>조작 방법</h4>
          <ul>
            <li>마우스 휠: 확대/축소</li>
            <li>마우스 드래그: 이동</li>
            <li>더블 클릭: 해당 지점으로 중심 이동</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
/*
TODO
1. 복소평면 좌표계와 OrbitControls 좌표계 간의 불일치, 줌 레벨이 높을수록 좌표계 간 미세한 차이???가 발생 -> 재 랜더링하면서 위치 뒤틀림?
  1-1. OrbitControls의 내부 상태가 서버에 전달되는 상태 불일치..? 계산상의 이유로 부동소수점 반올림 오차 발생일 수도
2. 드래그 이동 미끌림 현상을 디바운스에서 제외했지만 1번 상의 이유로 드래그 미흡.
3. 과한 연산으로 추후 캐싱 전략 필요해보임
*/
export default {
  setup() {
    // 상태 변수들
    const fractalContainer = ref(null);
    const selectedFractalType = ref('mandelbrot');
    const iterations = ref(50);
    const resolution = ref(500);
    const colorScheme = ref('classic');
    const showAxis = ref(true);
    const smoothShading = ref(true);
    const showInfo = ref(true);
    
    // 줄리아 집합 파라미터
    const juliaReal = ref(-0.4);
    const juliaImag = ref(0.6);
    
    // 시각화 상태
    const zoomLevel = ref(1.0);
    const centerX = ref(0.0);
    const centerY = ref(0.0);
    const fractalInfo = ref(null);
    
    // Three.js 관련 변수
    let scene, camera, renderer, controls;
    let fractalMesh;
    
    // 계산된 속성들
    const fractalDimension = computed(() => {
      if (!fractalInfo.value) return "계산 중...";
      return fractalInfo.value.dimension.toFixed(3);
    });
    
    const convergenceRatio = computed(() => {
      if (!fractalInfo.value) return "계산 중...";
      return (fractalInfo.value.convergenceRatio * 100).toFixed(2);
    });

    // 프랙탈 타입별 최적화된 반복 횟수 설정
    const getMinIterations = computed(() => {
      switch (selectedFractalType.value) {
        case 'sierpinski':
          return 1;
        default:
          return 10;
      }
    });

    const getMaxIterations = computed(() => {
      switch (selectedFractalType.value) {
        case 'sierpinski':
          return 10;
        case 'mandelbrot':
        case 'julia':
          return 100;
        case 'barnsley':
          return 100000;
        default:
          return 100;
      }
    });

    const getIterationStep = computed(() => {
      switch (selectedFractalType.value) {
        case 'sierpinski':
          return 1;
        default:
          return 5;
      }
    });

    // 성능 모니터링
    const performanceMetrics = ref({
      lastRenderTime: 0,
      averageRenderTime: 0,
      renderCount: 0
    });

    // API URL
    const API_BASE_URL = 'http://localhost:8080/api/fractal';

    // API 호출 함수들
    const fetchFractalData = async () => {
      const startTime = performance.now();
      
      try {
        // 줄 레벨과 해상도 계산
        const dynamicResolution = getResolutionForZoom(zoomLevel.value);
        const dynamicIterations = getIterationsForZoom(zoomLevel.value);

        // 실제 디버깅을 위한 파라미터 로깅
        console.log('Fetching fractal data with:', {
          type: selectedFractalType.value,
          iterations: dynamicIterations,
          resolution: dynamicResolution,
          zoom: zoomLevel.value,
          centerX: centerX.value,
          centerY: centerY.value
        });

        const params = new URLSearchParams({
          type: selectedFractalType.value,
          iterations: dynamicIterations,
          resolution: dynamicResolution,
          colorScheme: colorScheme.value,
          smooth: smoothShading.value,
          centerX: centerX.value.toString(),
          centerY: centerY.value.toString(),
          zoom: zoomLevel.value.toString()
        });
        
        if (selectedFractalType.value === 'julia') {
          params.append('juliaReal', juliaReal.value.toString());
          params.append('juliaImag', juliaImag.value.toString());
        }
        
        const response = await fetch(`${API_BASE_URL}/generate?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        fractalInfo.value = data.info;
        updateVisualization(data.pixels);

        // 성능 메트릭 업데이트
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        performanceMetrics.value.renderCount++;
        performanceMetrics.value.lastRenderTime = renderTime;
        performanceMetrics.value.averageRenderTime = 
          (performanceMetrics.value.averageRenderTime * (performanceMetrics.value.renderCount - 1) + renderTime) 
          / performanceMetrics.value.renderCount;

        // 성능 경고 표시
        if (renderTime > 1000) { // 1초 이상 걸리는 경우
          console.warn(`프랙탈 렌더링이 ${renderTime.toFixed(0)}ms 걸렸습니다. 성능 최적화가 필요할 수 있습니다.`);
        }

      } catch (error) {
        console.error('Error fetching fractal data:', error);
      }
    };
    // 줌 레벨에 따른 해상도 조정 함수 개선
    const getResolutionForZoom = (zoom) => {
      // 기본 해상도
      const baseResolution = resolution.value; // 사용자 설정값 사용
      
      // 줌 레벨에 따라 해상도를 보다 부드럽게 조정
      let scaledResolution;
      
      if (zoom <= 1.0) {
        scaledResolution = baseResolution; // 기본 해상도
      } else {
        // 로그 스케일을 사용하여 점진적으로 증가
        const scaleFactor = 1 + 0.4 * Math.log10(zoom + 0.1);
        scaledResolution = Math.floor(baseResolution * scaleFactor);
      }
      
      // 짝수 해상도로 맞추기 (텍스처 매핑 문제 방지)
      scaledResolution = Math.floor(scaledResolution / 2) * 2;
      
      // 성능 이슈를 방지하기 위해 최대값 제한
      return Math.min(1200, scaledResolution);
    };

    // 줌 레벨에 따른 반복 횟수 조정 함수 개선
    const getIterationsForZoom = (zoom) => {
      const baseIterations = iterations.value; // 사용자가 설정한 기본 반복 횟수
      
      // 줌 레벨에 따라 반복 횟수 계산
      let scaledIterations;
      
      if (zoom <= 1.0) {
        // 기본 줌 레벨에서는 기본 반복 횟수 사용
        scaledIterations = baseIterations;
      } else {
        // 로그 함수를 사용하여 부드럽게 증가
        const scaleFactor = 1 + Math.log10(zoom) * 0.8;
        scaledIterations = Math.floor(baseIterations * scaleFactor);
      }
      
      // 최대 반복 횟수 제한 (성능 고려)
      return Math.min(500, scaledIterations);
    };

    // Three.js 시각화 함수들
    const initThreeScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(fractalContainer.value.clientWidth, fractalContainer.value.clientHeight);
      fractalContainer.value.appendChild(renderer.domElement);
      
      // 컨트롤 초기화 - 성능 및 사용성 개선
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
      
      // 관성 설정 조정
      controls.enableDamping = false;  // 관성 비활성화
      //controls.dampingFactor = 0.05;  // 관성 값 낮게 설정
      controls.panSpeed = 0.5;         // 이동 속도 낮게 조정
      controls.zoomSpeed = 0.5;        // 줌 속도 낮게 조정
      
      // 마우스 이벤트 추가 - 직접 이벤트 핸들링
      renderer.domElement.addEventListener('mouseup', () => {
        // 센터 좌표 업데이트
        centerX.value = controls.target.x;
        centerY.value = controls.target.y;
        console.log("centerX.value:", centerX.value);
        console.log("centerY.value:", centerY.value);
        
        // 즉시 렌더링
        renderer.render(scene, camera);
        
        // 마우스 업 직후 즉시 데이터 업데이트
        fetchFractalData();
      }, { passive: true });
      
      // mousedown 이벤트도 추가
      renderer.domElement.addEventListener('mousedown', () => {
        // 마우스 다운 시 초기 상태 저장
        renderer.render(scene, camera);
      }, { passive: true });
      
      // 왼쪽 마우스 버튼으로 팬/이동하도록 설정
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
      
      // 카메라 위치 설정
      camera.position.z = 5;
      
      // 'change' 이벤트 핸들러 - 간소화
      controls.addEventListener('change', () => {
        // 센터 좌표 업데이트
        centerX.value = controls.target.x;
        centerY.value = controls.target.y;
        
        // 현재 카메라 줌 가져오기 (소수점 제한)
        let currentZoom = Math.floor(camera.zoom * 10) / 10; // 0.1 단위 반올림
        
        // 상태 변수가 변경된 경우에만 업데이트
        if (zoomLevel.value !== currentZoom) {
          zoomLevel.value = currentZoom;
          console.log("Zoom level updated to:", zoomLevel.value);
        }
        
        // 즉시 렌더링 (디바운스 제거)
        renderer.render(scene, camera);
      });
      
      // 디바운스된 API 호출 함수 - 줌을 위해 유지
      const debouncedFetchData = debounce(() => {
        fetchFractalData();
      }, 100); // 디바운스 시간 단축
      
      // 영구적인 렌더링을 위한 애니메이션 루프 제거
      // 관성을 사용하지 않기 때문에 불필요
      // function animate() {
      //   requestAnimationFrame(animate);
      //   controls.update(); // 관성 적용을 위해 반드시 필요
      //   renderer.render(scene, camera);
      // }
      // animate();
      
      // 줌 이벤트를 위한 특정 처리
      renderer.domElement.addEventListener('wheel', () => {
        // 줌 레벨 업데이트
        let currentZoom = Math.floor(camera.zoom * 10) / 10;
        if (zoomLevel.value !== currentZoom) {
          zoomLevel.value = currentZoom;
          // 줌 후 즉시 데이터 갱신
          setTimeout(() => {
            fetchFractalData();
          }, 50); // 짧은 지연 후 실행
        }
      }, { passive: true });
      
      // 'end' 이벤트에는 추가 처리 없음 (마우스업과 휠 이벤트에서 처리함)
      // controls.addEventListener('end', debouncedFetchData);
      // 좌표축 추가 (if enabled)
      updateAxisVisibility();
    };

    //디바운스 추가
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };
    


    const updateVisualization = (pixelData) => {
      if(!pixelData){
        console.error('No pixel data received'); 
        return;
      }
      
      try {
        // 1. Base64 문자열을 디코딩하여 바이너리 데이터 얻기
        const binaryString = atob(pixelData);
        
        // 2. 바이너리 문자열을 Uint8Array로 변환
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 디버깅: 바이트 데이터 확인
        console.log(`Received pixel data: ${bytes.length} bytes, resolution: ${getResolutionForZoom(zoomLevel.value)}`);
        
        // 3. 실제 동적 해상도 값 확인 (API 호출 시 사용된 값)
        const actualResolution = getResolutionForZoom(zoomLevel.value);

        // 텍스처 생성 - 정확한 해상도와 타입 명시
        // 픽셀 데이터 포맷 확인
        console.log(`Texture dimensions: ${actualResolution}x${actualResolution}, Bytes length: ${bytes.length}`);
        
        // 필요한 바이트 수 확인 (RGBA 포맷은 픽셀당 4바이트)
        const expectedBytes = actualResolution * actualResolution * 4;
        if (bytes.length !== expectedBytes) {
          console.warn(`Bytes length mismatch! Expected: ${expectedBytes}, Got: ${bytes.length}`);
        }
        
        // 텍스처 생성
        const texture = new THREE.DataTexture(
          bytes,
          actualResolution,
          actualResolution,
          THREE.RGBAFormat,
          THREE.UnsignedByteType // 명시적으로 unsigned byte 타입 지정
        );
        
        // 추가 텍스처 설정
        texture.flipY = false; // Y축 뒤집지 않음
        texture.wrapS = THREE.ClampToEdgeWrapping; // 텍스처 매핑 방식 설정
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.magFilter = THREE.LinearFilter; // 확대/축소 필터 설정
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        
        // 메시 생성 또는 업데이트
        if (!fractalMesh) {
          const geometry = new THREE.PlaneGeometry(2, 2);
          const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            // 텍스처가 정확히 매핑되도록 설정
            side: THREE.DoubleSide
          });
          fractalMesh = new THREE.Mesh(geometry, material);
          scene.add(fractalMesh);
        } else {
          fractalMesh.material.map = texture;
          fractalMesh.material.needsUpdate = true;
        }
        
        // 렌더링
        renderer.render(scene, camera);
      } catch (error) {
        console.error('Error processing fractal texture:', error);
      }
    };

    const updateAxisVisibility = () => {
      if (showAxis.value) {
        const axesHelper = new THREE.AxesHelper(2);
        scene.add(axesHelper);
      } else {
        scene.children = scene.children.filter(child => !(child instanceof THREE.AxesHelper));
      }
      renderer.render(scene, camera);
    };

    const updateZoomAndCenter = () => {
      //camera position 이면 첫 고정값이기 때문에 OrthographicCamera의 zoom 속성을 사용 
      zoomLevel.value = camera.zoom;
      //const position = camera.position;
      //zoomLevel.value = 1 / controls.target.distanceTo(position);
      centerX.value = controls.target.x;
      centerY.value = controls.target.y;
    };

    // 이벤트 핸들러
    const handleResize = () => {
      if (!fractalContainer.value || !renderer || !camera) return;
      
      const width = fractalContainer.value.clientWidth;
      const height = fractalContainer.value.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    };

    // 라이프사이클 훅
    onMounted(() => {
      initThreeScene();
      fetchFractalData();
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      if (controls) {
        controls.dispose();
      }
    });

    // 감시자
    watch(
      [
        selectedFractalType,
        iterations,
        resolution,
        colorScheme,
        smoothShading,
        juliaReal,
        juliaImag
      ],
      () => {
        fetchFractalData();
      }
    );

    watch(showAxis, updateAxisVisibility);

    return {
      fractalContainer,
      selectedFractalType,
      iterations,
      resolution,
      colorScheme,
      showAxis,
      smoothShading,
      showInfo,
      juliaReal,
      juliaImag,
      zoomLevel,
      centerX,
      centerY,
      fractalInfo,
      fractalDimension,
      convergenceRatio,
      getMinIterations,
      getMaxIterations,
      getIterationStep,
      performanceMetrics
    };
  }
};
</script>

<style scoped>
.fractal-container {
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

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.julia-params {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.julia-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
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

.visualization-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.fractal-view {
  height: 600px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.info-panel {
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  height: 600px;
  overflow-y: auto;
}

.info-panel h3 {
  margin-top: 0;
}

.zoom-info {
  margin: 15px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
}

.controls-help {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.controls-help ul {
  padding-left: 20px;
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

@media (max-width: 768px) {
  .visualization-container {
    grid-template-columns: 1fr;
  }
  
  .fractal-view {
    height: 400px;
  }
  
  .info-panel {
    height: auto;
  }
}

.performance-warning {
  color: #ff4444;
  font-size: 0.9em;
  margin-top: 5px;
}
</style> 