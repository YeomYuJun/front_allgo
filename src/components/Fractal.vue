<template>
  <section class="fractal-container container">
    <h1>프랙탈 시각화</h1>

    <div class="controls">
      <div class="control-group">
        <label>프랙탈 타입:</label>
        <select v-model="selectedFractalType">
          <option value="mandelbrot">만델브로트 집합</option>
          <option value="julia">줄리아 집합</option>
          <!-- IFS 프랙탈 옵션 주석 처리
          <option value="sierpinski">시에르핀스키 삼각형</option>
          <option value="barnsley">반슬리 고사리</option>
          -->
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
        <label>기본 해상도: {{ baseResolution }}</label>
        <input type="range" v-model.number="baseResolution" min="100" max="800" step="50" />
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
        <label><input type="checkbox" v-model="autoQuality" /> 자동 품질 조정</label>
      </div>
      
      <div class="control-group">
        <button @click="resetView" class="reset-button">뷰 초기화</button>
      </div>
    </div>

    <div class="visualization-container">
      <div ref="fractalContainer" class="fractal-view">
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <p>프랙탈 계산 중...</p>
        </div>
      </div>
      
      <div v-if="showInfo" class="info-panel">
        <h3>프랙탈 정보</h3>
        <div v-if="fractalInfo">
          <p><strong>프랙탈 차원:</strong> {{ fractalDimension }}</p>
          <p><strong>반복 깊이:</strong> {{ currentIterations }}</p>
          <p><strong>수렴 영역 비율:</strong> {{ convergenceRatio }}%</p>
          <p v-if="selectedFractalType === 'julia'">
            <strong>줄리아 상수:</strong> {{ juliaReal }} + {{ juliaImag }}i
          </p>
        </div>
        
        <div class="view-info">
          <h4>뷰 정보</h4>
          <p><strong>줌 레벨:</strong> {{ zoomLevel.toFixed(2) }}x</p>
          <p><strong>중심 좌표:</strong> ({{ viewCenter.x.toFixed(4) }}, {{ viewCenter.y.toFixed(4) }})</p>
          <p><strong>표시 범위:</strong></p>
          <p class="small">X: [{{ viewBounds.xMin.toFixed(4) }}, {{ viewBounds.xMax.toFixed(4) }}]</p>
          <p class="small">Y: [{{ viewBounds.yMin.toFixed(4) }}, {{ viewBounds.yMax.toFixed(4) }}]</p>
          <p><strong>렌더 해상도:</strong> {{ currentResolution }}px</p>
          <p><strong>렌더 시간:</strong> {{ lastRenderTime }}ms</p>
        </div>
        
        <div class="controls-help">
          <h4>조작 방법</h4>
          <ul>
            <li>마우스 휠: 확대/축소</li>
            <li>마우스 드래그: 이동</li>
            <li>더블 클릭: 해당 지점 확대</li>
            <li>Shift + 클릭: 해당 지점 축소</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue';
import * as THREE from 'three';

export default {
  setup() {
    // 상태 변수들
    const fractalContainer = ref(null);
    const selectedFractalType = ref('mandelbrot');
    const iterations = ref(50);
    const baseResolution = ref(400);
    const currentResolution = ref(400);
    const colorScheme = ref('classic');
    const showAxis = ref(true);
    const smoothShading = ref(true);
    const showInfo = ref(true);
    const autoQuality = ref(true);
    const isLoading = ref(false);
    
    // 줄리아 집합 파라미터
    const juliaReal = ref(-0.4);
    const juliaImag = ref(0.6);
    
    // 뷰 상태
    const zoomLevel = ref(1.0);
    const viewCenter = ref({ x: 0.0, y: 0.0 });
    const viewBounds = ref({
      xMin: -2.0,
      xMax: 2.0,
      yMin: -2.0,
      yMax: 2.0
    });
    
    // 프랙탈 정보
    const fractalInfo = ref(null);
    const currentIterations = ref(50);
    const lastRenderTime = ref(0);
    
    // Three.js 관련 변수
    let scene, camera, renderer;
    let fractalMesh, axisMesh;
    let renderRequested = false;
    let lastFetchParams = null;

    // IFS 렌더링용 추가 변수
    let pointsGeometry, pointsMaterial, pointsMesh;
    const isIFSFractal = ref(false);
    
    // 프랙탈 타입별 기본 범위 설정
    const fractalDefaultRanges = {
      mandelbrot: { xMin: -2.5, xMax: 1.0, yMin: -1.25, yMax: 1.25 },
      julia: { xMin: -2.0, xMax: 2.0, yMin: -2.0, yMax: 2.0 }
      /* IFS 프랙탈 범위 주석 처리
      sierpinski: { xMin: -1.5, xMax: 1.5, yMin: -1.0, yMax: 2.0 },
      barnsley: { xMin: -2.5, xMax: 2.5, yMin: -0.5, yMax: 9.5 }
      */
    };
    
    // 계산된 속성들
    const fractalDimension = computed(() => {
      if (!fractalInfo.value) return "계산 중...";
      return fractalInfo.value.dimension?.toFixed(3) || "N/A";
    });
    
    const convergenceRatio = computed(() => {
      if (!fractalInfo.value) return "계산 중...";
      return fractalInfo.value.convergenceRatio 
        ? (fractalInfo.value.convergenceRatio * 100).toFixed(2)
        : "N/A";
    });

    const getMinIterations = computed(() => {
      /* IFS 프랙탈 반복 횟수 주석 처리
      switch (selectedFractalType.value) {
        case 'sierpinski': return 10000;
        case 'barnsley': return 50000;
        default: return 10;
      }
      */
      return 10;
    });

    const getMaxIterations = computed(() => {
      /* IFS 프랙탈 반복 횟수 주석 처리
      switch (selectedFractalType.value) {
        case 'sierpinski': return 100000;
        case 'barnsley': return 1000000;
        default: return 500;
      }
      */
      return 500;
    });

    const getIterationStep = computed(() => {
      /* IFS 프랙탈 반복 횟수 주석 처리
      switch (selectedFractalType.value) {
        case 'sierpinski': return 1000;
        case 'barnsley': return 10000;
        default: return 10;
      }
      */
      return 10;
    });

    // API URL
    const API_BASE_URL = 'http://localhost:8080/api/fractal';

    // 줌 레벨에 따른 해상도 계산
    const calculateDynamicResolution = () => {
      if (!autoQuality.value) {
        return baseResolution.value;
      }
      
      /* IFS 프랙탈 해상도 계산 주석 처리
      if (selectedFractalType.value === 'sierpinski' || 
          selectedFractalType.value === 'barnsley') {
        return baseResolution.value;
      }
      */
      
      let resolution = baseResolution.value;
      
      if (zoomLevel.value > 1) {
        const scaleFactor = 1 + Math.log10(zoomLevel.value) * 0.5;
        resolution = Math.floor(resolution * scaleFactor);
      }
      
      return Math.min(1200, Math.max(100, resolution));
    };

    // 줌 레벨에 따른 반복 횟수 계산
    const calculateDynamicIterations = () => {
      if (!autoQuality.value) {
        return iterations.value;
      }
      
      /* IFS 프랙탈 반복 횟수 계산 주석 처리
      if (selectedFractalType.value === 'sierpinski' || 
          selectedFractalType.value === 'barnsley') {
        return Math.floor(iterations.value * Math.max(1, Math.sqrt(zoomLevel.value)));
      }
      */
      
      let dynamicIterations = iterations.value;
      
      if (zoomLevel.value > 1) {
        const scaleFactor = 1 + Math.log10(zoomLevel.value) * 0.6;
        dynamicIterations = Math.floor(iterations.value * scaleFactor);
      }
      
      return Math.min(1000, dynamicIterations);
    };

    // 프랙탈 데이터 가져오기
    const fetchFractalData = async (forceUpdate = false) => {
      // 동일한 파라미터로 중복 요청 방지
      const currentParams = {
        type: selectedFractalType.value,
        iterations: currentIterations.value,
        resolution: currentResolution.value,
        colorScheme: colorScheme.value,
        smooth: smoothShading.value,
        centerX: viewCenter.value.x,
        centerY: viewCenter.value.y,
        zoom: zoomLevel.value,
        juliaReal: juliaReal.value,
        juliaImag: juliaImag.value
      };
      
      if (!forceUpdate && lastFetchParams && 
          JSON.stringify(currentParams) === JSON.stringify(lastFetchParams)) {
        return;
      }
      
      lastFetchParams = currentParams;
      isLoading.value = true;
      const startTime = performance.now();
      
      try {
        const params = new URLSearchParams({
          type: selectedFractalType.value,
          iterations: currentIterations.value,
          resolution: currentResolution.value,
          colorScheme: colorScheme.value,
          smooth: smoothShading.value,
          centerX: viewCenter.value.x.toString(),
          centerY: viewCenter.value.y.toString(),
          zoom: zoomLevel.value.toString()
        });
        
        if (selectedFractalType.value === 'julia') {
          params.append('juliaReal', juliaReal.value.toString());
          params.append('juliaImag', juliaImag.value.toString());
        }

        if (isIFSFractal) {
          params.append('xMin', viewBounds.value.xMin.toString());
          params.append('xMax', viewBounds.value.xMax.toString());
          params.append('yMin', viewBounds.value.yMin.toString());
          params.append('yMax', viewBounds.value.yMax.toString());
        }
        
        const response = await fetch(`${API_BASE_URL}/generate?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        fractalInfo.value = data.info || {};  // null 체크 추가
        updateVisualization(data);
        
        lastRenderTime.value = Math.round(performance.now() - startTime);
      } catch (error) {
        console.error('Error fetching fractal data:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Three.js 초기화
    const initThreeScene = () => {
      if (!fractalContainer.value) return;
      
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      // 정사영 카메라 사용 (프랙탈 표시에 적합)
      const aspect = fractalContainer.value.clientWidth / fractalContainer.value.clientHeight;
      camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 10);
      camera.position.z = 1;
      
      renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        powerPreference: 'high-performance'
      });
      
      renderer.setSize(fractalContainer.value.clientWidth, fractalContainer.value.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      fractalContainer.value.appendChild(renderer.domElement);
      
      // 이벤트 리스너 설정
      setupEventListeners();
      
      // 초기 좌표축 설정
      updateAxisVisibility();
    };

    // 시각화 업데이트
    const updateVisualization = (data) => {
      // 프랙탈 타입 확인
      isIFSFractal.value = false; // IFS 프랙탈 비활성화
      renderComplexFractal(data);
    }

    const renderComplexFractal = (data) => {
      if (!data.pixels) {
        console.error('No pixel data received');
        return;
      }
      
      try {
        // Base64 디코딩
        const binaryString = atob(data.pixels);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        if (fractalMesh?.material?.map) {
          fractalMesh.material.map.dispose();
          fractalMesh.material.dispose();
        }
        
        const texture = new THREE.DataTexture(
          bytes,
          currentResolution.value,
          currentResolution.value,
          THREE.RGBAFormat,
          THREE.UnsignedByteType
        );
        
        texture.needsUpdate = true;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        
        if (!fractalMesh) {
          const geometry = new THREE.PlaneGeometry(2, 2);
          const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            side: THREE.DoubleSide
          });
          fractalMesh = new THREE.Mesh(geometry, material);
          scene.add(fractalMesh);
        } else {
          fractalMesh.material.map = texture;
          fractalMesh.material.needsUpdate = true;
        }
        
        render();
      } catch (error) {
        console.error('Error processing fractal texture:', error);
      }
    };

    /*
    const renderIFSFractal = (data) => {
      // IFS 렌더링 로직 전체 주석 처리
    };
    */

    /*
    const getIFSColor = (intensity) => {
      // IFS 색상 처리 로직 전체 주석 처리
    };
    */

    // 좌표축 업데이트
    const updateAxisVisibility = () => {
      if (axisMesh) {
        scene.remove(axisMesh);
        axisMesh.geometry.dispose();
        axisMesh.material.dispose();
        axisMesh = null;
      }
      
      if (showAxis.value) {
        const axisGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
          -1, 0, 0, 1, 0, 0,  // X축
          0, -1, 0, 0, 1, 0   // Y축
        ]);
        axisGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const axisMaterial = new THREE.LineBasicMaterial({ 
          color: 0x888888,
          linewidth: 1 
        });
        
        axisMesh = new THREE.LineSegments(axisGeometry, axisMaterial);
        scene.add(axisMesh);
      }
      
      render();
    };

    // 이벤트 리스너 설정
    const setupEventListeners = () => {
      let isDragging = false;
      let lastMouseX = 0;
      let lastMouseY = 0;
      let updateTimeout = null;
      
      // 마우스 다운
      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });
      
      // 마우스 이동
      renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        
        // 현재 표시 범위 계산
        const rangeX = viewBounds.value.xMax - viewBounds.value.xMin;
        const rangeY = viewBounds.value.yMax - viewBounds.value.yMin;
        
        // 픽셀 이동을 복소평면 좌표로 변환
        const moveX = -deltaX / fractalContainer.value.clientWidth * rangeX;
        const moveY = deltaY / fractalContainer.value.clientHeight * rangeY;
        
        // 중심 좌표 업데이트
        viewCenter.value.x += moveX;
        viewCenter.value.y += moveY;
        
        // 경계 업데이트
        updateViewBounds();
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          fetchFractalData();
        }, 200);
      });
      
      // 마우스 업
      renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
      });
      
      // 마우스 휠 (줌)
      renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(1000000, zoomLevel.value * zoomFactor));
        
        if (newZoom !== zoomLevel.value) {
          // 마우스 위치를 중심으로 줌
          const rect = renderer.domElement.getBoundingClientRect();
          const mouseX = (e.clientX - rect.left) / rect.width * 2 - 1;
          const mouseY = -(e.clientY - rect.top) / rect.height * 2 + 1;
          
          const rangeX = viewBounds.value.xMax - viewBounds.value.xMin;
          const rangeY = viewBounds.value.yMax - viewBounds.value.yMin;
          
          const worldX = viewCenter.value.x + mouseX * rangeX / 2;
          const worldY = viewCenter.value.y + mouseY * rangeY / 2;
          
          // 새로운 중심 계산 (마우스 위치 기준 줌)
          const t = 1 - 1 / zoomFactor;
          viewCenter.value.x = viewCenter.value.x + t * (worldX - viewCenter.value.x);
          viewCenter.value.y = viewCenter.value.y + t * (worldY - viewCenter.value.y);
          
          zoomLevel.value = newZoom;
          updateViewBounds();
          
          // 줌 레벨에 따른 품질 조정
          currentResolution.value = calculateDynamicResolution();
          currentIterations.value = calculateDynamicIterations();
          
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            fetchFractalData();
          }, 150);
        }
      });
      
      // 더블 클릭 (확대)
      renderer.domElement.addEventListener('dblclick', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width * 2 - 1;
        const mouseY = -(e.clientY - rect.top) / rect.height * 2 + 1;
        
        const rangeX = viewBounds.value.xMax - viewBounds.value.xMin;
        const rangeY = viewBounds.value.yMax - viewBounds.value.yMin;
        
        viewCenter.value.x = viewCenter.value.x + mouseX * rangeX / 2;
        viewCenter.value.y = viewCenter.value.y + mouseY * rangeY / 2;
        
        zoomLevel.value *= e.shiftKey ? 0.5 : 2;
        updateViewBounds();
        
        currentResolution.value = calculateDynamicResolution();
        currentIterations.value = calculateDynamicIterations();
        
        fetchFractalData();
      });
      
      // 터치 이벤트 (모바일 지원)
      let touchStartDistance = 0;
      
      renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        }
      });
      
      renderer.domElement.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const scale = distance / touchStartDistance;
          zoomLevel.value = Math.max(0.1, Math.min(1000000, zoomLevel.value * scale));
          touchStartDistance = distance;
          
          updateViewBounds();
          
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => {
            currentResolution.value = calculateDynamicResolution();
            currentIterations.value = calculateDynamicIterations();
            fetchFractalData();
          }, 200);
        }
      });
    };

    // 뷰 경계 업데이트
    const updateViewBounds = () => {
      const defaults = fractalDefaultRanges[selectedFractalType.value];
      const baseRangeX = defaults.xMax - defaults.xMin;
      const baseRangeY = defaults.yMax - defaults.yMin;
      
      const rangeX = baseRangeX / zoomLevel.value;
      const rangeY = baseRangeY / zoomLevel.value;
      
      viewBounds.value = {
        xMin: viewCenter.value.x - rangeX / 2,
        xMax: viewCenter.value.x + rangeX / 2,
        yMin: viewCenter.value.y - rangeY / 2,
        yMax: viewCenter.value.y + rangeY / 2
      };
    };

    // 렌더링
    const render = () => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    // 뷰 초기화
    const resetView = () => {
      const defaults = fractalDefaultRanges[selectedFractalType.value];
      viewCenter.value = {
        x: (defaults.xMin + defaults.xMax) / 2,
        y: (defaults.yMin + defaults.yMax) / 2
      };
      zoomLevel.value = 1.0;
      updateViewBounds();
      
      currentResolution.value = baseResolution.value;
      currentIterations.value = iterations.value;
      
      // IFS 프랙탈의 경우 기본 반복 횟수 조정
      if (selectedFractalType.value === 'sierpinski') {
        iterations.value = 50000;
      } else if (selectedFractalType.value === 'barnsley') {
        iterations.value = 100000;
      }
      
      fetchFractalData(true);
    };

    // 리사이즈 핸들러
    const handleResize = () => {
      if (!fractalContainer.value || !renderer || !camera) return;
      
      const width = fractalContainer.value.clientWidth;
      const height = fractalContainer.value.clientHeight;
      const aspect = width / height;
      
      camera.left = -aspect;
      camera.right = aspect;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      render();
    };

    // 정리 함수
    const cleanup = () => {
      if (fractalMesh) {
        if (fractalMesh.material.map) {
          fractalMesh.material.map.dispose();
        }
        fractalMesh.material.dispose();
        fractalMesh.geometry.dispose();
      }
      
      if (pointsMesh) {
        scene.remove(pointsMesh);
        pointsMesh = null;
      }
      if (pointsGeometry) {
        pointsGeometry.dispose();
        pointsGeometry = null;
      }
      if (pointsMaterial) {
        pointsMaterial.dispose();
        pointsMaterial = null;
      }
      
      if (axisMesh) {
        axisMesh.material.dispose();
        axisMesh.geometry.dispose();
      }
      
      if (renderer) {
        renderer.dispose();
        if (fractalContainer.value && renderer.domElement) {
          fractalContainer.value.removeChild(renderer.domElement);
        }
      }
    };

    // 라이프사이클 훅
    onMounted(() => {
      initThreeScene();
      resetView();
      window.addEventListener('resize', handleResize);
    });

    onBeforeUnmount(() => {
      cleanup();
      window.removeEventListener('resize', handleResize);
    });

    // 감시자
    watch([selectedFractalType], () => {
      // 프랙탈 타입 변경 시 뷰 초기화
      resetView();
    });

    watch([iterations, baseResolution, colorScheme, smoothShading, juliaReal, juliaImag], () => {
      currentResolution.value = calculateDynamicResolution();
      currentIterations.value = calculateDynamicIterations();
      fetchFractalData();
    });

    watch(showAxis, updateAxisVisibility);

    return {
      fractalContainer,
      selectedFractalType,
      iterations,
      baseResolution,
      currentResolution,
      colorScheme,
      showAxis,
      smoothShading,
      showInfo,
      autoQuality,
      isLoading,
      juliaReal,
      juliaImag,
      zoomLevel,
      viewCenter,
      viewBounds,
      fractalInfo,
      fractalDimension,
      convergenceRatio,
      currentIterations,
      lastRenderTime,
      getMinIterations,
      getMaxIterations,
      getIterationStep,
      resetView
    };
  }
};
</script>

<style scoped>
.fractal-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.controls {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-group label {
  font-weight: bold;
  color: #333;
}

.julia-params {
  border-top: 1px solid #ddd;
  padding-top: 15px;
  grid-column: span 2;
}

.julia-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.display-options {
  flex-direction: row;
  gap: 20px;
  align-items: center;
}

.display-options label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: normal;
}

.visualization-container {
  display: grid;
  grid-template-columns: 1fr 300px;
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