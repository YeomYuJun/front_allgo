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
          <option value="koch">코흐 눈송이</option>
          <option value="barnsley">반슬리 고사리</option>
        </select>
      </div>
      
      <div class="control-group">
        <label>반복 횟수: {{ iterations }}</label>
        <input type="range" v-model.number="iterations" min="1" max="100" step="1" />
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

    // API URL
    const API_BASE_URL = 'http://localhost:8080/api/fractal';

    // API 호출 함수들
    const fetchFractalData = async () => {
      try {

        const dynamicResolution = getResolutionForZoom(zoomLevel.value);
        const dynamicIterations = getIterationsForZoom(zoomLevel.value);

        const params = new URLSearchParams({
          type: selectedFractalType.value,
          iterations: dynamicIterations,
          resolution: dynamicResolution,
          colorScheme: colorScheme.value,
          smooth: smoothShading.value,
          centerX: centerX.value,
          centerY: centerY.value,
          zoom: zoomLevel.value
        });
        
        if (selectedFractalType.value === 'julia') {
          params.append('juliaReal', juliaReal.value);
          params.append('juliaImag', juliaImag.value);
        }
        
        const response = await fetch(`${API_BASE_URL}/generate?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        fractalInfo.value = data.info;
        updateVisualization(data.pixels);
      } catch (error) {
        console.error('Error fetching fractal data:', error);
      }
    };
    // 줌 레벨에 따른 해상도 조정 함수
    const getResolutionForZoom = (zoom) => {
      // 기본 해상도
      const baseResolution = 500; // 기본값
      
      // 줌 레벨에 따라 해상도 스케일링
      if (zoom <= 1.0) {
        return baseResolution; // 기본 해상도
      } else if (zoom <= 2.0) {
        return Math.min(800, baseResolution * 1.5); // 50% 증가
      } else if (zoom <= 5.0) {
        return Math.min(1000, baseResolution * 2.0); // 100% 증가
      } else if (zoom <= 10.0) {
        return Math.min(1500, baseResolution * 3.0); // 200% 증가
      } else {
        return Math.min(2000, baseResolution * 4.0); // 300% 증가
      }
      
      // 참고: 브라우저 성능을 고려하여 최대값 제한
    };

    const getIterationsForZoom = (zoom) => {
      const baseIterations = iterations.value; // 사용자가 설정한 기본 반복 횟수
      
      if (zoom <= 1.0) {
        return baseIterations;
      } else if (zoom <= 3.0) {
        return Math.min(200, baseIterations * 1.5);
      } else if (zoom <= 10.0) {
        return Math.min(500, baseIterations * 2.0);
      } else {
        return Math.min(1000, baseIterations * 3.0);
      }
    };



    // Three.js 시각화 함수들
    const initThreeScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      
      renderer.setSize(fractalContainer.value.clientWidth, fractalContainer.value.clientHeight);
      fractalContainer.value.appendChild(renderer.domElement);
      
      // 컨트롤 초기화
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
      // 왼쪽 마우스 버튼으로 팬/이동하도록 변경
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };

      controls.addEventListener('change', () => {
        updateZoomAndCenter();
        fetchFractalData();
      });
      
      // 카메라 위치 설정
      camera.position.z = 5;
      // 기존 'change' 이벤트 핸들러 수정
      controls.addEventListener('change', () => {
        // 센터 좌표 업데이트
        centerX.value = controls.target.x;
        centerY.value = controls.target.y;
        
        // 현재 카메라 줌 가져오기
        let currentZoom = camera.zoom;
        
        // 0.1 단위로 반올림
        let roundedZoom = Math.round(currentZoom * 10) / 10;
        
        // 상태 변수가 변경된 경우에만 업데이트
        if (zoomLevel.value !== roundedZoom) {
          zoomLevel.value = roundedZoom;
          console.log("Zoom level updated to:", zoomLevel.value);
        }
        
        // 화면 업데이트
        renderer.render(scene, camera);
      });

      // 줌이 완료된 후에만 서버에 요청하기 위한 디바운스 처리
      const debouncedFetchData = debounce(() => {
        fetchFractalData();
      }, 300);

      // 'end' 이벤트에 디바운스된 함수 연결
      controls.addEventListener('end', debouncedFetchData);
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
      // 1. Base64 문자열을 디코딩하여 바이너리 데이터 얻기
    const binaryString = atob(pixelData);
    
      // 2. 바이너리 문자열을 Uint8Array로 변환
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 텍스처 생성
      const texture = new THREE.DataTexture(
        bytes,
        resolution.value,
        resolution.value,
        THREE.RGBAFormat
      );
      texture.needsUpdate = true;
      
      // 메시 생성 또는 업데이트
      if (!fractalMesh) {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        fractalMesh = new THREE.Mesh(geometry, material);
        scene.add(fractalMesh);
      } else {
        fractalMesh.material.map = texture;
        fractalMesh.material.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
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
      convergenceRatio
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
</style> 