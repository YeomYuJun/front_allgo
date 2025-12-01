<template>
  <section class="fractal-desc-container container">
    <div>
      <h2 class="tit">Fractal Visualization</h2>
    </div>
    <section class="container-wrap">
      <!-- 좌측: 프랙탈 시각화 -->
      <section class="sub-section section-l canvas-wrap">
        <div class="visualization-grid">
          <div class="viz-panel fractal-2d-panel grid-fr">
            <h4>프랙탈 그래프</h4>
            <div ref="fractalContainer" class="viz-container fractal-view">
              
            </div>
            <div v-if="isLoading" class="loading-overlay">
                <div class="spinner"></div>
                <p>프랙탈 계산 중...</p>
              </div>
          </div>
          <div class="explanation-panel">
            <h4>프랙탈이란?</h4>
            <div class="explanation-content">
              <div class="math-formula">
                <strong>만델브로트 집합:</strong> zₙ₊₁ = zₙ² + c, 수렴 테스트: |zₙ| ≤ 2
              </div>
              <p><strong>프랙탈의 특징:</strong></p>
              <ul>
                <li><strong>자기 유사성:</strong> 부분이 전체와 비슷한 구조를 가짐 (다양한 스케일에서 반복)</li>
                <li><strong>무한 복잡성:</strong> 아무리 확대해도 차이고 복잡한 세부 구조</li>
                <li><strong>분수 차원:</strong> 1차원과 2차원 사이의 비정수 차원</li>
                <li><strong>수학적 아름다움:</strong> 간단한 공식에서 무한한 아름다움</li>
              </ul>
              <p><strong>만델브로트 vs 줄리아 집합:</strong></p>
              <ul>
                <li><strong>만델브로트:</strong> c가 매개변수, 항상 z₀ = 0에서 시작</li>
                <li><strong>줄리아:</strong> c가 고정 상수, z₀가 매개변수</li>
                <li><strong>수렴 조건:</strong> 반복 시 |zₙ| ≤ 2 바운드 내에 머물는 지</li>
                <li><strong>색상 코딩:</strong> 발산 속도에 따라 색상 부여</li>
              </ul>
              <p><strong>컴퓨터 생성 방법:</strong></p>
              <ul>
                <li><strong>이스케이프 타임:</strong> 각 점에서 발산 속도 측정</li>
                <li><strong>복소평면 매핑:</strong> 2D 화면을 복소수 평면으로 매핑</li>
                <li><strong>매개변수 스카닝:</strong> 해상도만큼 복소수 평면을 샘플링</li>
              </ul>
              <p><strong>수학적 응용:</strong> 복소 동역학계, 처오스 이론, 물리 시뮬레이션, 컴퓨터 그래픽스</p>
            </div>
          </div>
        </div>
      </section>
      <!-- 우측: 컨트롤 및 정보 -->
      <section class="sub-section section-r controls-wrap">
        <div class="controls signal-controls">
          <h3>1. 프랙탈 설정</h3>
          <div class="signal-builder">
            <div class="signal-component">
              <label>프랙탈 타입:</label>
              <select v-model="selectedFractalType">
                <option value="mandelbrot">만델브로트 집합</option>
                <option value="julia">줄리아 집합</option>
              </select>
            </div>
            <div class="signal-component">
              <label>반복 횟수: {{ iterations }}</label>
              <input type="range" v-model.number="iterations" :min="getMinIterations" :max="getMaxIterations" :step="getIterationStep" />
            </div>
            <div class="signal-component">
              <label>기본 해상도: {{ baseResolution }}</label>
              <input type="range" v-model.number="baseResolution" min="100" max="800" step="50" />
            </div>
            <div v-if="selectedFractalType === 'julia'" class="signal-component julia-params">
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
            <div class="signal-component">
              <label>색상 스키마:</label>
              <select v-model="colorScheme">
                <option value="classic">클래식</option>
                <option value="rainbow">무지개</option>
                <option value="fire">화염</option>
                <option value="ocean">해양</option>
                <option value="grayscale">흑백</option>
              </select>
            </div>
            <div class="signal-component display-options">
              <label><input type="checkbox" v-model="showAxis" /> 좌표축 표시</label>
              <label><input type="checkbox" v-model="smoothShading" /> 부드러운 음영</label>
              <label><input type="checkbox" v-model="showInfo" /> 정보 표시</label>
              <label><input type="checkbox" v-model="autoQuality" /> 자동 품질 조정</label>
            </div>
            <div class="signal-component">
              <button @click="resetView" class="reset-button">뷰 초기화</button>
            </div>
          </div>
        </div>
        <div v-if="showInfo" class="insights-panel">
          <h3>프랙탈 정보</h3>
          <div class="insight-content">
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
    </section>
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
    const zoomLevel = ref(1);
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

    // API URL - 환경변수 기반
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/fractal`;
    
    // 줌 레벨에 따른 해상도 계산
    const calculateDynamicResolution = () => {
      if (!autoQuality.value) {
        return quantizeResolution(baseResolution.value);
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
      
      return quantizeResolution(Math.min(1200, Math.max(200, resolution)));
    };

    // 줌 레벨에 따른 반복 횟수 계산
    const calculateDynamicIterations = () => {
      if (!autoQuality.value) {
        return quantizeIterations(iterations.value);
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
      
      return quantizeIterations(Math.min(1000, dynamicIterations));
    };

    // 프랙탈 데이터 가져오기 - 중복 요청 방지 개선
    const fetchFractalData = async (forceUpdate = false) => {
      // 파라미터 정규화 및 양자화
      const normalizedParams = normalizeParameters();
      const paramHash = JSON.stringify(normalizedParams);
      
      // 중복 요청 방지 - 같은 파라미터로 이미 요청 중인 경우 무시
      if (!forceUpdate && isCurrentlyFetching && paramHash === lastFetchParams) {
        return;
      }
      
      // 캐시 확인
      if (!forceUpdate && fractalCache.has(paramHash)) {
        const cachedData = fractalCache.get(paramHash);
        // Cache HIT - 이미 캐시된 데이터 사용
        updateVisualization({ texture: cachedData.texture, info: cachedData.info });
        lastRenderTime.value = 0;
        return;
      }
      
      // 중복 요청 방지
      const requestId = Date.now() + Math.random();
      currentRequestId = requestId;
      isCurrentlyFetching = true;
      lastFetchParams = paramHash;
      isLoading.value = true;
      const startTime = performance.now();
      
      try {
        // 정규화된 파라미터 사용
        const params = new URLSearchParams();
        Object.entries(normalizedParams).forEach(([key, value]) => {
          params.append(key, value.toString());
        });
        
        // API 요청 시작
        
        // 이미지 URL 생성 (WebP 또는 PNG)
        const imageUrl = `${API_BASE_URL}/generate/image?${params}`;
        // 이미지를 fetch로 받아서 blob으로 변환
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const contentType = response.headers.get('content-type');

        // 이미지를 canvas에 그려서 ImageData 추출
        const img = await createImageBitmap(blob);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        // DataTexture로 변환
        const texture = new THREE.DataTexture(
          imageData.data,
          img.width,
          img.height,
          THREE.RGBAFormat
        );
        texture.needsUpdate = true;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        // 요청이 취소된 경우 무시
        if (currentRequestId !== requestId) {
          texture.dispose();
          return;
        }
        
        // 캐시 저장
        manageCacheSize();
        const cacheData = { texture: texture, info: {} };
        fractalCache.set(paramHash, cacheData);
        // Cache MISS - 새 데이터 캐시 저장
        
        // 시각화 업데이트
        updateVisualization({ texture: texture, info: {} }); 
        lastRenderTime.value = Math.round(performance.now() - startTime);
      } catch (error) {
        console.error('Error fetching fractal data:', error);
      } finally {
        isLoading.value = false;
        isCurrentlyFetching = false;
        lastFetchParams = null;
      }
    };

    // Three.js 초기화
    const initThreeScene = () => {ㄸ
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
      if (!data.texture) {
        console.error('No texture data received');
        return;
      }
      
      try {
        if (fractalMesh?.material?.map) {
          fractalMesh.material.map.dispose();
        }
        
        const texture = data.texture;
        
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

    // 파라미터 양자화 시스템 - 캐시 효율성 극대화 (좌표는 최소 0.01까지만)
    const getCoordinatePrecision = () => {
      if (zoomLevel.value <= 1) return 0.1;
      if (zoomLevel.value <= 10) return 0.05;
      if (zoomLevel.value <= 100) return 0.01; // 캐시 효율성을 위해 0.01까지만
      if (zoomLevel.value <= 1000) return 0.01; // 고줌에서도 0.01 유지
      return 0.01; // 모든 고줌 레벨에서 0.01 고정
    };
    
    const roundToGridPrecision = (value) => {
      const precision = getCoordinatePrecision();
      const rounded = Math.round(value / precision) * precision;
      
      // 캐시 효율성을 위해 소수점 둘째 자리까지만 (0.01 단위)
      return Math.round(rounded * 100) / 100;
    };
    
    // 반복횟수 양자화
    const quantizeIterations = (iterations) => {
      if (iterations <= 50) return Math.ceil(iterations / 10) * 10;
      if (iterations <= 200) return Math.ceil(iterations / 25) * 25;
      if (iterations <= 500) return Math.ceil(iterations / 50) * 50;
      return Math.ceil(iterations / 100) * 100;
    };
    
    // 해상도 양자화
    const quantizeResolution = (resolution) => {
      const standardResolutions = [200, 300, 400, 500, 600, 800, 1000, 1200];
      return standardResolutions.reduce((prev, curr) => 
        Math.abs(curr - resolution) < Math.abs(prev - resolution) ? curr : prev
      );
    };
    
    // 줌 레벨 양자화 개선 - 중복 요청 방지
    const quantizeZoom = (zoom) => {
      if (zoom <= 1) return 1;
      if (zoom <= 2) return Math.round(zoom * 4) / 4; // 0.25 단위
      if (zoom <= 8) return Math.pow(2, Math.round(Math.log2(zoom)));
      if (zoom <= 64) return Math.ceil(zoom / 4) * 4;
      if (zoom <= 512) return Math.ceil(zoom / 16) * 16;
      if (zoom <= 4096) return Math.ceil(zoom / 64) * 64;
      return 4096; // 최대값 고정
    };
    
    // 캐시 시스템 및 중복 요청 방지
    const fractalCache = new Map();
    const MAX_CACHE_SIZE = 50;
    let currentRequestId = null;
    let updateTimeout = null;
    let renderTimeout = null;
    let lastFetchParams = null;
    let isCurrentlyFetching = false;
    
    // 파라미터 정규화
    const normalizeParameters = () => {
      return {
        type: selectedFractalType.value,
        iterations: quantizeIterations(currentIterations.value),
        resolution: quantizeResolution(currentResolution.value),
        colorScheme: colorScheme.value,
        smooth: smoothShading.value,
        centerX: roundToGridPrecision(viewCenter.value.x),
        centerY: roundToGridPrecision(viewCenter.value.y),
        zoom: quantizeZoom(zoomLevel.value),
        ...(selectedFractalType.value === 'julia' && {
          juliaReal: Math.round(juliaReal.value * 100) / 100,
          juliaImag: Math.round(juliaImag.value * 100) / 100
        })
      };
    };
    
    // 캐시 관리
    const manageCacheSize = () => {
      if (fractalCache.size >= MAX_CACHE_SIZE) {
        const firstKey = fractalCache.keys().next().value;
        const cachedData = fractalCache.get(firstKey);
        if (cachedData?.texture) cachedData.texture.dispose();
        fractalCache.delete(firstKey);
      }
    };

    // 이벤트 리스너 설정
    const setupEventListeners = () => {
      let isDragging = false;
      let lastMouseX = 0;
      let lastMouseY = 0;
      let dragStartTime = 0;
      let hasMoved = false;
      let accumulatedDeltaX = 0;
      let accumulatedDeltaY = 0;

      // 마우스 다운
      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasMoved = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        dragStartTime = performance.now();
        accumulatedDeltaX = 0;
        accumulatedDeltaY = 0;

        // 드래그 시작 시 커서 변경
        renderer.domElement.style.cursor = 'grabbing';

        // 기존 타이머 취소
        clearTimeouts();
      });

      // 마우스 이동
      renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // 최소 이동 임계값 (너무 민감하지 않게)
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

        hasMoved = true;
        accumulatedDeltaX += deltaX;
        accumulatedDeltaY += deltaY;

        // 현재 표시 범위 계산
        const rangeX = viewBounds.value.xMax - viewBounds.value.xMin;
        const rangeY = viewBounds.value.yMax - viewBounds.value.yMin;

        // 픽셀 이동을 복소평면 좌표로 변환 (양자화 없이 부드럽게)
        const moveX = -deltaX / fractalContainer.value.clientWidth * rangeX;
        const moveY = deltaY / fractalContainer.value.clientHeight * rangeY;

        viewCenter.value.x += moveX;
        viewCenter.value.y += moveY;

        // 경계 업데이트
        updateViewBounds();

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // 드래그 중에는 시각적 피드백 없이 좌표만 업데이트
        // (드래그 끝날 때 새로운 프랙탈 렌더링)
      });

      // 마우스 업 핸들러
      const handleMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          renderer.domElement.style.cursor = 'grab';

          if (hasMoved) {
            // 드래그 끝난 후 좌표 양자화 적용 (캐시 효율성)
            viewCenter.value.x = roundToGridPrecision(viewCenter.value.x);
            viewCenter.value.y = roundToGridPrecision(viewCenter.value.y);
            updateViewBounds();

            // 새로운 프랙탈 데이터 즉시 요청
            fetchFractalData();
          }
        }
      };

      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      // canvas 밖에서 mouseup 처리
      document.addEventListener('mouseup', handleMouseUp);

      // 마우스 진입/이탈 시 커서 변경
      renderer.domElement.addEventListener('mouseenter', () => {
        if (!isDragging) {
          renderer.domElement.style.cursor = 'grab';
        }
      });

      renderer.domElement.addEventListener('mouseleave', () => {
        renderer.domElement.style.cursor = 'default';
      });

      // 초기 커서 설정
      renderer.domElement.style.cursor = 'grab';

      // 마우스 휠 (줌)
      renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
        const newZoom = Math.max(1, Math.min(4096, Math.round(zoomLevel.value * zoomFactor)));
        
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
          
          // 좌표 정밀도 적용
          viewCenter.value.x = roundToGridPrecision(viewCenter.value.x);
          viewCenter.value.y = roundToGridPrecision(viewCenter.value.y);
          
          if (updateTimeout) clearTimeout(updateTimeout);
          if (renderTimeout) clearTimeout(renderTimeout);
          
          renderTimeout = setTimeout(() => {
            fetchFractalData();
          }, 100);
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
        
        zoomLevel.value = Math.max(1, Math.min(4096, Math.round(zoomLevel.value * (e.shiftKey ? 0.5 : 2))));
        updateViewBounds();
        
        currentResolution.value = calculateDynamicResolution();
        currentIterations.value = calculateDynamicIterations();
        
        // 좌표 정밀도 적용
        viewCenter.value.x = roundToGridPrecision(viewCenter.value.x);
        viewCenter.value.y = roundToGridPrecision(viewCenter.value.y);
        
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
          zoomLevel.value = Math.max(1, Math.min(4096, Math.round(zoomLevel.value * scale)));
          touchStartDistance = distance;
          
          updateViewBounds();
          
          // 좌표 정밀도 적용
          viewCenter.value.x = roundToGridPrecision(viewCenter.value.x);
          viewCenter.value.y = roundToGridPrecision(viewCenter.value.y);
          
          if (updateTimeout) clearTimeout(updateTimeout);
          if (renderTimeout) clearTimeout(renderTimeout);
          
          renderTimeout = setTimeout(() => {
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
      zoomLevel.value = 1;
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

    // 타이머 정리 함수
    const clearTimeouts = () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
      }
      if (renderTimeout) {
        clearTimeout(renderTimeout);
        renderTimeout = null;
      }
    };
    
    // 디바운싱된 프랙탈 데이터 가져오기
    const debouncedFetchFractalData = () => {
      clearTimeouts();
      updateTimeout = setTimeout(() => {
        fetchFractalData();
      }, 150);
    };
    
    // 정리 함수
    const cleanup = () => {
      clearTimeouts();
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
      clearTimeouts();
      cleanup();
      window.removeEventListener('resize', handleResize);
    });

    // 감시자
    watch([selectedFractalType], () => {
      // 프랙탈 타입 변경 시 뷰 초기화
      resetView();
    });

    // 파라미터 변경 시 디바운싱 적용
    watch([iterations, baseResolution, colorScheme, smoothShading, juliaReal, juliaImag], () => {
      currentResolution.value = calculateDynamicResolution();
      currentIterations.value = calculateDynamicIterations();
      debouncedFetchFractalData();
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
.tit {
  font-weight: 600;
  border-bottom: 5px solid #777;
  width: fit-content;
  margin-bottom: 25px;
}
.fractal-desc-container {
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
.signal-controls h3 {
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
.fractal-view {
  width: 100%;
  height: 470px;
  min-height: 470px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
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
  .sub-section {
    min-height: auto;
  }
  .section-r {
    margin : 0;
  }
}

/* insights-panel 개선 */
.insights-panel {
  background: #f7fbff;
  padding: 24px 24px 18px 24px;
  border-radius: 12px;
  border-left: 5px solid #2196f3;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(33,150,243,0.07);
  font-size: 15px;
}
.insights-panel h3 {
  margin-top: 0;
  color: #1976d2;
  font-size: 1.25em;
  margin-bottom: 18px;
}
.insight-content > div,
.insight-content > .view-info,
.insight-content > .controls-help {
  background: #eaf4fb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(33,150,243,0.04);
}
.insight-content h4 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 1.1em;
}
.insight-content p,
.insight-content ul {
  margin: 4px 0 4px 0;
  font-size: 15px;
}
.insight-content strong {
  min-width: 90px;
  display: inline-block;
  color: #1565c0;
  font-weight: 600;
}
.insight-content .small {
  font-size: 13px;
  color: #666;
}

/* display-options 개선 */
.display-options {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 24px;
  margin-top: 8px;
  align-items: center;
}
.display-options label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 0;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}
.display-options input[type="checkbox"] {
  accent-color: #2196f3;
  width: 18px;
  height: 18px;
  margin: 0;
}
@media (max-width: 900px) {
  .display-options {
    flex-wrap: wrap;
    gap: 10px 16px;
  }
}

li {
  list-style-type: none;
}
</style> 