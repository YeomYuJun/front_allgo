<template>
  <section class="fft-container container">

    <div>
      <h2 class="tit">Fast Fourier Transform Visualization</h2>
    </div>

    <section class="container-wrap">
      <!-- 좌측 섹션 -->
      <section class="sub-section section-l canvas-wrap">
        <!-- 메인 시각화 영역 -->
        <div class="visualization-grid">
          <!-- 시간 도메인 (원본 신호) -->
          <div class="viz-panel time-domain grid-fr">
            <h4>시간 도메인 신호</h4>
            <div ref="timeDomainContainer" class="viz-container"></div>
            <div class="signal-equation">
              {{ signalEquation }}
            </div>
          </div>

          <!-- 복소평면 (신호 감기) -->
          <div class="viz-panel complex-plane">
            <h4>복소평면 - 신호 감기 ({{ windingFrequency.toFixed(2) }}Hz)</h4>
            <div ref="complexPlaneContainer" class="viz-container"></div>
            <div class="center-of-mass-info">
              <div v-if="currentWindingResult">
                <p><strong>질량 중심:</strong></p>
                <p>실수부: {{ currentWindingResult.centerOfMass.real.toFixed(3) }}</p>
                <p>허수부: {{ currentWindingResult.centerOfMass.imaginary.toFixed(3) }}</p>
                <p>크기: {{ currentWindingResult.centerOfMass.magnitude.toFixed(3) }}</p>
              </div>
            </div>
          </div>

          <!-- 주파수 도메인 (FFT 결과) -->
          <div class="viz-panel frequency-domain">
            <h4>주파수 도메인 (푸리에 변환)</h4>
            <div class="chart-wrapper">
              <!-- Y축 레이블 (크기) -->
              <div class="y-axis-labels">
                <div class="y-tick" v-for="tick in yAxisTicks" :key="tick.value" :style="{ top : tick.position }">
                  {{ tick.label }}
                </div>
              </div>
              <!-- 차트 컨테이너 -->
              <div class="chart-container">
                <div ref="frequencyDomainContainer" class="viz-container"></div>
                <!-- X축 레이블 (주파수) -->
                <div class="x-axis-labels">
                  <div class="x-tick" v-for="tick in xAxisTicks" :key="tick.value" :style="{ left: tick.position }">
                    {{ tick.label }}
                  </div>
                </div>
              </div>
            </div>
            <div class="frequency-peaks">
              <p><strong>주요 주파수 성분:</strong></p>
              <div v-for="peak in detectedPeaks" :key="peak.frequency">
                {{ peak.frequency.toFixed(1) }}Hz (크기: {{ peak.magnitude.toFixed(2) }})
              </div>
            </div>
          </div>
        </div>
      </section>
      <!--<좌>  <우>-->
      <!-- 우측 섹션 -->
      <section class="sub-section section-r controls-wrap">
        <!-- 신호 생성 컨트롤 -->
        <div class="controls signal-controls">
          <h3>1. 신호 생성</h3>
          <div class="signal-builder">
            <div v-for="(component, index) in signalComponents" :key="index" class="signal-component">
              <label>주파수 {{ index + 1 }}: {{ component.frequency }}Hz</label>
              <input type="range" v-model.number="component.frequency" min="0.5" max="20" step="0.1" />
              
              <label>진폭 {{ index + 1 }}: {{ component.amplitude }}</label>
              <input type="range" v-model.number="component.amplitude" min="0" max="2" step="0.1" />
              
              <button @click="removeSignalComponent(index)" v-if="signalComponents.length > 1">제거</button>
            </div>
            <button @click="addSignalComponent">주파수 성분 추가</button>
          </div>
          
          <div class="signal-params">
            <label>샘플링 레이트: {{ samplingRate }}Hz</label>
            <input type="range" v-model.number="samplingRate" min="50" max="1000" step="50" />
            
            <label>신호 지속시간: {{ duration }}초</label>
            <input type="range" v-model.number="duration" min="1" max="5" step="0.5" />
          </div>
        </div>

        <!-- 신호 감기 컨트롤 -->
        <div class="controls winding-controls">
          <h3>2. 신호 감기 (Winding)</h3>
          <div class="winding-params">
            <label>감는 주파수: {{ windingFrequency.toFixed(2) }}Hz</label>
            <input type="range" 
                  v-model.number="windingFrequency" 
                  :min="0" 
                  :max="maxDisplayFrequency" 
                  :step="0.1" 
                  @input="updateWindingVisualization" />
            
            <div class="winding-controls-buttons">
              <button @click="startFrequencySweep" :disabled="isSweeeping">
                {{ isSweeeping ? '스위핑 중...' : '전체 스윕 새로고침' }}
              </button>
              <button @click="resetVisualization">리셋</button>
            </div>
          </div>
        </div>

        <!-- 애니메이션 컨트롤 -->
        <div class="controls animation-controls">
          <h4>애니메이션 컨트롤</h4>
          <div class="animation-buttons">
            <button @click="toggleAnimation">
              {{ isAnimating ? '일시정지' : '애니메이션 시작' }}
            </button>
            <button @click="stepAnimation">단계별 진행</button>
          </div>
          
          <div class="animation-speed">
            <label>애니메이션 속도: {{ animationSpeed }}x</label>
            <input type="range" v-model.number="animationSpeed" min="0.1" max="3" step="0.1" />
          </div>
          
          <div class="current-time">
            현재 시간: {{ currentAnimationTime.toFixed(2) }}초
          </div>
        </div>
      </section>
    </section>
    
    
    

    <!-- 인사이트 패널 -->
    <div class="insights-panel">
      <h3>인사이트</h3>
      <div class="insight-content">
        <div v-if="insights.length > 0">
          <div v-for="insight in insights" :key="insight.id" class="insight-item">
            <h4>{{ insight.title }}</h4>
            <p>{{ insight.description }}</p>
          </div>
        </div>
        <div v-else>
          <p>주파수를 조절하여 신호가 어떻게 감기는지 관찰해보세요!</p>
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
    // 기본 상태 변수들
    const timeDomainContainer = ref(null);
    const complexPlaneContainer = ref(null);
    const frequencyDomainContainer = ref(null);
    
    // 신호 생성 파라미터
    const signalComponents = ref([
      { frequency: 3, amplitude: 1 },
      { frequency: 7, amplitude: 0.5 }
    ]);
    const samplingRate = ref(500);
    const duration = ref(2);
    
    // 신호 감기 파라미터
    const windingFrequency = ref(3);
    const maxDisplayFrequency = ref(50);
    
    // 시각화 상태
    const currentWindingResult = ref(null);
    const sweepResults = ref([]);
    const detectedPeaks = ref([]);
    const isSweeeping = ref(false);
    const isAnimating = ref(false);
    const animationSpeed = ref(0.1);
    const currentAnimationTime = ref(0);
    const insights = ref([]);
    
    // Three.js 객체들
    let timeDomainScene, timeDomainCamera, timeDomainRenderer;
    let complexPlaneScene, complexPlaneCamera, complexPlaneRenderer;
    let frequencyDomainScene, frequencyDomainCamera, frequencyDomainRenderer;
    
    // 애니메이션 관련
    let animationFrameId;
    let windingPathMesh, centerOfMassMesh, currentSignalPoint;

    // API 기본 URL - 환경변수 기반
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/fft`

    // 컨테이너 크기 관리
    const containerConfig = ref({
      // 기본 크기 설정
      defaultWidth: 400,
      defaultHeight: 300,
      
      // 각 컨테이너별 개별 설정 (필요시)
      timeDomain: {
        width: 990,
        height: 400,
        aspectRatio: 12/4
      },
      complexPlane: {
        width: 470, 
        height: 470, // 정사각형으로 설정
        aspectRatio: 1
      },
      frequencyDomain: {
        width: 470,
        height: 470,
        aspectRatio: 1//4/3
      },
      
      // 반응형 브레이크포인트
      breakpoints: {
        mobile: 768,
        tablet: 1024
      },
      
      // 반응형 크기 배율
      mobileScale: 0.8,
      tabletScale: 0.9
    });

    // 현재 화면 크기 감지
    const screenWidth = ref(window.innerWidth);

    // 계산된 컨테이너 크기
    const computedContainerSizes = computed(() => {
      let scale = 1;
      
      if (screenWidth.value <= containerConfig.value.breakpoints.mobile) {
        scale = containerConfig.value.mobileScale;
      } else if (screenWidth.value <= containerConfig.value.breakpoints.tablet) {
        scale = containerConfig.value.tabletScale;
      }
      
      return {
        timeDomain: {
          width: Math.floor(containerConfig.value.timeDomain.width * scale),
          height: Math.floor(containerConfig.value.timeDomain.height * scale)
        },
        complexPlane: {
          width: Math.floor(containerConfig.value.complexPlane.width * scale),
          height: Math.floor(containerConfig.value.complexPlane.height * scale)
        },
        frequencyDomain: {
          width: Math.floor(containerConfig.value.frequencyDomain.width * scale),
          height: Math.floor(containerConfig.value.frequencyDomain.height * scale)
        }
      };
    });

    // 통합 렌더러 설정 함수
    const setupRenderer = (scene, camera, container, rendererType) => {
      if (!container) {
        console.error(`${rendererType} container not found`);
        return null;
      }
      
      const sizes = computedContainerSizes.value[rendererType];
      
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(sizes.width, sizes.height);
      renderer.setClearColor(getRendererBgColor(rendererType));
      
      container.appendChild(renderer.domElement);
      
      // 카메라 설정도 중앙화
      setupCamera(camera, rendererType, sizes);
      
      console.log(`${rendererType} renderer initialized:`, sizes);
      return renderer;
    };

    // 렌더러별 배경색 설정
    const getRendererBgColor = (rendererType) => {
      const bgColors = {
        timeDomain: 0xffffff,
        complexPlane: 0xf8f8f8,
        frequencyDomain: 0xffffff
      };
      return bgColors[rendererType] || 0xffffff;
    };    


    // 카메라 설정 중앙화
    const setupCamera = (camera, rendererType, sizes) => {
      const { width, height } = sizes;
      const aspect = width / height;
      
      // 카메라 타입별 설정
      if (camera instanceof THREE.OrthographicCamera) {
        const cameraConfigs = {
          timeDomain: { left: -1, right: 1, top: 1, bottom: -1 },
          complexPlane: { left: -2, right: 2, top: 2, bottom: -2 },
          frequencyDomain: { left: -1, right: 1, top: 1, bottom: -1 }
        };
        
        const config = cameraConfigs[rendererType] || cameraConfigs.timeDomain;
        
        // 종횡비를 고려한 카메라 설정
        if (aspect > 1) {
          camera.left = config.left * aspect;
          camera.right = config.right * aspect;
          camera.top = config.top;
          camera.bottom = config.bottom;
        } else {
          camera.left = config.left;
          camera.right = config.right;
          camera.top = config.top / aspect;
          camera.bottom = config.bottom / aspect;
        }
        
        camera.updateProjectionMatrix();
      }
      
      camera.position.z = 5;
    };


    //===



    // 계산된 속성들
    const signalEquation = computed(() => {
      let equation = 'f(t) = ';
      const terms = signalComponents.value
        .filter(comp => comp.amplitude > 0)
        .map(comp => `${comp.amplitude}sin(2π·${comp.frequency}·t)`)
        .join(' + ');
      return equation + (terms || '0');
    });

    // X축 눈금 (주파수: 0 ~ 20Hz)
    const xAxisTicks = computed(() => {
      const ticks = [];
      const maxFreq = maxDisplayFrequency.value;
      const tickInterval = 5; // 5Hz 간격
      
      for (let i = 0; i <= maxFreq; i += tickInterval) {
        const pstnVal = ((i / maxFreq) * 100 ) == 0 || ((i / maxFreq) * 100 ) == 100 ? Math.abs(((i / maxFreq) * 100 ) - 5) : ((i / maxFreq) * 100 ) 
        const position = `${pstnVal}%`;
        ticks.push({
          value: i,
          label: `${i}Hz`,
          position: position
        });
      }
      return ticks;
    });

    // Y축 눈금 (크기: -1 ~ 1, 가운데가 0)
    const yAxisTicks = computed(() => {
      const ticks = [];
      const values = [-1, -0.5, 0, 0.5, 1]; // -1부터 1까지
      // 0 , 0.5, 1 , 1.5, 2
      values.forEach((value, index) => {
        // 맨 아래(-1)가 80%, 가운데(0)가 60%, 맨 위(1)가 0%가 되어야함
        const position = `${Math.abs((value - 1) * 40 )}%`; // -1~1을 0~80%로 변환
        ticks.push({
          value: value,
          label: value.toFixed(1),
          position: position
        });
      });
      
      return ticks;
    });
    
    // 신호 생성 및 관리
    const addSignalComponent = () => {
      signalComponents.value.push({ frequency: 5, amplitude: 1 });
      updateSignal();
    };
    
    const removeSignalComponent = (index) => {
      signalComponents.value.splice(index, 1);
      updateSignal();
    };
    
    const updateSignal = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/generate-signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            components: signalComponents.value,
            samplingRate: samplingRate.value,
            duration: duration.value
          })
        });
        
        const signalData = await response.json();
        updateTimeDomainVisualization(signalData);
        updateWindingVisualization();
      } catch (error) {
        console.error('Error updating signal:', error);
      }
    };
    
    // 신호 감기 시각화 업데이트
    const updateWindingVisualization = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/winding-visualization`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal: getCurrentSignalData(),
            samplingRate: samplingRate.value,
            windingFrequency: windingFrequency.value,
            duration: duration.value
          })
        });
        
        const windingData = await response.json();
        currentWindingResult.value = windingData;
        updateComplexPlaneVisualization(windingData);
        generateInsights();
        
        // 실시간 주파수 도메인 업데이트 추가
        updateFrequencyDomainRealTime();
      } catch (error) {
        console.error('Error updating winding visualization:', error);
      }
    };
    
    // 실시간 주파수 도메인 업데이트
    const updateFrequencyDomainRealTime = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/frequency-sweep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signal: getCurrentSignalData(),
            samplingRate: samplingRate.value,
            minFrequency: 0,
            maxFrequency: maxDisplayFrequency.value,
            steps: 100
          })
        });
        
        const sweepData = await response.json();
        sweepResults.value = sweepData.sweepResults;
        updateFrequencyDomainVisualization(sweepData);
        detectFrequencyPeaks(sweepData);
      } catch (error) {
        console.error('Error updating frequency domain real-time:', error);
      }
    };

    // 주파수 스윕 수행 (전체 스윕)
    const startFrequencySweep = async () => {
      isSweeeping.value = true;
      
      try {
        await updateFrequencyDomainRealTime();
      } catch (error) {
        console.error('Error performing frequency sweep:', error);
      } finally {
        isSweeeping.value = false;
      }
    };
    
    // Three.js 시각화 초기화 - 수정
    const initTimedomainVisualization = () => {
      console.log('Initializing time domain visualization');
  
      timeDomainScene = new THREE.Scene();
      timeDomainCamera = new THREE.OrthographicCamera();
      timeDomainRenderer = setupRenderer(
        timeDomainScene, 
        timeDomainCamera, 
        timeDomainContainer.value, 
        'timeDomain'
      );
      
      if (!timeDomainRenderer) return;
      
      addGridToScene(timeDomainScene, 'time');
      const axesHelper = new THREE.AxesHelper(1);
      timeDomainScene.add(axesHelper);
    };

    // Three.js 복소평면 - 신호감기 시각화 초기화 - 수정
    const initComplexPlaneVisualization = () => {
      console.log('Initializing complex plane visualization');
  
      complexPlaneScene = new THREE.Scene();
      complexPlaneCamera = new THREE.OrthographicCamera();
      complexPlaneRenderer = setupRenderer(
        complexPlaneScene, 
        complexPlaneCamera, 
        complexPlaneContainer.value, 
        'complexPlane'
      );
      
      if (!complexPlaneRenderer) return;
      
      addComplexPlaneAxes();
      addGridToScene(complexPlaneScene, 'complex');
    };
    
    // Three.js 주파수 도메인 시각화 초기화 - 수정 
    const initFrequencyDomainVisualization = () => {
      console.log('Initializing frequency domain visualization');
  
      frequencyDomainScene = new THREE.Scene();
      frequencyDomainCamera = new THREE.OrthographicCamera();
      frequencyDomainRenderer = setupRenderer(
        frequencyDomainScene, 
        frequencyDomainCamera, 
        frequencyDomainContainer.value, 
        'frequencyDomain'
      );
      
      if (!frequencyDomainRenderer) return;
      
      addGridToScene(frequencyDomainScene, 'frequency');
      const axesHelper = new THREE.AxesHelper(1);
      frequencyDomainScene.add(axesHelper);
    };
    
    // 복소평면 축 추가
    const addComplexPlaneAxes = () => {
      // 실수축 (가로)
      const realAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(2, 0, 0)
      ]);
      const realAxisMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
      const realAxis = new THREE.Line(realAxisGeometry, realAxisMaterial);
      complexPlaneScene.add(realAxis);
      
      // 허수축 (세로)
      const imagAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -2, 0),
        new THREE.Vector3(0, 2, 0)
      ]);
      const imagAxisMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
      const imagAxis = new THREE.Line(imagAxisGeometry, imagAxisMaterial);
      complexPlaneScene.add(imagAxis);
      
      // 원점 표시
      const originGeometry = new THREE.CircleGeometry(0.05, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const origin = new THREE.Mesh(originGeometry, originMaterial);
      complexPlaneScene.add(origin);
    };
    
    // 격자 추가
    const addGridToScene = (scene, type) => {
      const gridHelper = new THREE.GridHelper(4, 20, 0xcccccc, 0xeeeeee);
      if (type === 'complex') {
        gridHelper.rotateX(Math.PI / 2);
      }
      scene.add(gridHelper);
    };
    
    // 시간 도메인 시각화 업데이트
    const updateTimeDomainVisualization = (signalData) => {
      if (!timeDomainScene) return;
      
      // 기존 신호 라인 제거
      const oldSignal = timeDomainScene.getObjectByName('timeSignal');
      if (oldSignal) {
        timeDomainScene.remove(oldSignal);
        oldSignal.geometry.dispose();
        oldSignal.material.dispose();
      }
      
      // 새 신호 라인 생성
      const points = signalData.timePoints.map((time, i) => {
        const x = (time / duration.value) * 3 - 1; // -1 ~ 1로 정규화 // 진폭은 추후 css에 따라 변동 예정
        const y = signalData.amplitudes[i] * 0.8; // 진폭 조정
        return new THREE.Vector3(x, y, 0);
      });
      
      const signalGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const signalMaterial = new THREE.LineBasicMaterial({ 
        color: 0x2196f3, 
        linewidth: 2 
      });
      const signalLine = new THREE.Line(signalGeometry, signalMaterial);
      signalLine.name = 'timeSignal';
      timeDomainScene.add(signalLine);
      
      timeDomainRenderer.render(timeDomainScene, timeDomainCamera);
    };
    
    // 복소평면 시각화 업데이트
    const updateComplexPlaneVisualization = (windingData) => {
      if (!complexPlaneScene) return;
      
      // 기존 객체들 제거
      clearComplexPlaneObjects();
      
      // 감긴 경로 그리기
      const pathPoints = windingData.windingPath.map(point => 
        new THREE.Vector3(point.real, point.imaginary, 0)
      );
      
      const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4caf50, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      const pathLine = new THREE.Line(pathGeometry, pathMaterial);
      pathLine.name = 'windingPath';
      complexPlaneScene.add(pathLine);
      
      // 질량 중심 표시
      const centerOfMass = windingData.centerOfMass;
      const centerGeometry = new THREE.CircleGeometry(0.08, 16);
      const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff5722 });
      centerOfMassMesh = new THREE.Mesh(centerGeometry, centerMaterial);
      centerOfMassMesh.position.set(centerOfMass.real, centerOfMass.imaginary, 0);
      centerOfMassMesh.name = 'centerOfMass';
      complexPlaneScene.add(centerOfMassMesh);
      
      // 질량 중심까지의 벡터 표시
      const vectorGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(centerOfMass.real, centerOfMass.imaginary, 0)
      ]);
      const vectorMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff5722, 
        linewidth: 3 
      });
      const vectorLine = new THREE.Line(vectorGeometry, vectorMaterial);
      vectorLine.name = 'centerVector';
      complexPlaneScene.add(vectorLine);
      
      complexPlaneRenderer.render(complexPlaneScene, complexPlaneCamera);
    };
    
    // 주파수 도메인 시각화 업데이트
    const updateFrequencyDomainVisualization = (sweepData) => {
      console.log('Updating visualization with:', sweepData);
      console.log('Scene exists:', !!frequencyDomainScene);
      
      if (!frequencyDomainScene) {
        console.error('Frequency domain scene not initialized');
        return;
      }
      
      // 기존 스펙트럼 객체들 제거
      ['frequencySpectrum', 'currentFreqMarker', 'frequencyLabels'].forEach(name => {
        const obj = frequencyDomainScene.getObjectByName(name);
        if (obj) {
          frequencyDomainScene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });

      // 좌표 변환 함수들
      const freqToX = (frequency) => {
        return (frequency / maxDisplayFrequency.value) * 2 - 1; // -1 ~ 1 범위 (x축: 주파수)
      };

      const magnitudeToY = (magnitude, maxMagnitude) => {
        return (magnitude / maxMagnitude) * 0.8; // 0 ~ 0.8 범위 (y축: 크기)
      };

      // x축, y축 눈금 및 축 라인 추가
      const addFrequencyAxisLabels = () => {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'frequencyLabels';
        
        // x축 기준선 (주파수 축)
        const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(1, 0, 0)
        ]);
        const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        const xAxisLine = new THREE.Line(xAxisGeometry, xAxisMaterial);
        labelGroup.add(xAxisLine);
        
        // y축 기준선 (크기 축)
        const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-1, 0, 0),
          new THREE.Vector3(-1, 0.9, 0)
        ]);
        const yAxisMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        const yAxisLine = new THREE.Line(yAxisGeometry, yAxisMaterial);
        labelGroup.add(yAxisLine);
        
        // 주파수 눈금 (x축) - 5Hz 간격
        const tickInterval = 5;
        const numTicks = Math.floor(maxDisplayFrequency.value / tickInterval) + 1;
        
        for (let i = 0; i < numTicks; i++) {
          const frequency = i * tickInterval;
          const x = freqToX(frequency);
          
          // 주파수 눈금선
          const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, -0.05, 0),
            new THREE.Vector3(x, 0.05, 0)
          ]);
          const tickMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
          const tickLine = new THREE.Line(tickGeometry, tickMaterial);
          labelGroup.add(tickLine);
        }
        
        // 크기 눈금 (y축) - 0.2 간격
        for (let i = 0; i <= 4; i++) {
          const y = i * 0.2;
          
          // 크기 눈금선
          const tickGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.05, y, 0),
            new THREE.Vector3(-0.95, y, 0)
          ]);
          const tickMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
          const tickLine = new THREE.Line(tickGeometry, tickMaterial);
          labelGroup.add(tickLine);
        }
        
        frequencyDomainScene.add(labelGroup);
      };

      
      // 데이터 정규화
      const maxMagnitude = Math.max(...sweepData.magnitudes);
      
      // FFT 스펙트럼 그리기 (x축: 주파수, y축: 크기)
      const points = sweepData.frequencies.map((freq, i) => {
        const x = freqToX(freq); // x축은 주파수
        const y = magnitudeToY(sweepData.magnitudes[i], maxMagnitude); // y축은 크기
        return new THREE.Vector3(x, y, 0);
      });
      
      const spectrumGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const spectrumMaterial = new THREE.LineBasicMaterial({ 
        color: 0xe91e63, 
        linewidth: 3 
      });
      const spectrumLine = new THREE.Line(spectrumGeometry, spectrumMaterial);
      spectrumLine.name = 'frequencySpectrum';
      frequencyDomainScene.add(spectrumLine);
      
      // 현재 감는 주파수 표시
      //const currentFreqX = (windingFrequency.value / maxDisplayFrequency.value) * 2 - 1;
      const currentFreqX = freqToX(windingFrequency.value);

      const markerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(currentFreqX, 0, 0),
        new THREE.Vector3(currentFreqX, 0.9, 0)
      ]);
      const markerMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff9800, 
        linewidth: 4 
      });
      const markerLine = new THREE.Line(markerGeometry, markerMaterial);
      markerLine.name = 'currentFreqMarker';
      frequencyDomainScene.add(markerLine);
      addFrequencyAxisLabels();
      // 렌더링
      frequencyDomainRenderer.render(frequencyDomainScene, frequencyDomainCamera);
      


      // 디버깅 로그
      console.log('=== Frequency Domain Visualization ===');
      console.log('X축: 주파수 (0 ~', maxDisplayFrequency.value, 'Hz)');
      console.log('Y축: 크기 (0 ~ 1)');
      console.log('현재 감는 주파수:', windingFrequency.value, 'Hz, X위치:', currentFreqX);
      console.log('스펙트럼 포인트 수:', points.length);
      console.log('최대 크기:', maxMagnitude);
      

    };


    
    
    // 복소평면 객체 정리
    const clearComplexPlaneObjects = () => {
      const objectsToRemove = ['windingPath', 'centerOfMass', 'centerVector', 'currentPoint'];
      objectsToRemove.forEach(name => {
        const obj = complexPlaneScene.getObjectByName(name);
        if (obj) {
          complexPlaneScene.remove(obj);
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) obj.material.dispose();
        }
      });
    };
    
    // 주파수 피크 검출
    const detectFrequencyPeaks = (sweepData) => {
      const peaks = [];
      const magnitudes = sweepData.magnitudes;
      const frequencies = sweepData.frequencies;
      const threshold = Math.max(...magnitudes) * 0.1; // 최대값의 10% 이상
      
      for (let i = 1; i < magnitudes.length - 1; i++) {
        if (magnitudes[i] > magnitudes[i-1] && 
            magnitudes[i] > magnitudes[i+1] && 
            magnitudes[i] > threshold) {
          peaks.push({
            frequency: frequencies[i],
            magnitude: magnitudes[i]
          });
        }
      }
      
      detectedPeaks.value = peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
    };
    
    // 인사이트 생성
    const generateInsights = () => {
      const newInsights = [];
      
      if (currentWindingResult.value) {
        const magnitude = currentWindingResult.value.centerOfMass.magnitude;
        
        // 공명 상태 확인
        if (magnitude > 0.5) {
          newInsights.push({
            id: 'resonance',
            title: '공명 발견!',
            description: `${windingFrequency.value.toFixed(1)}Hz에서 강한 공명이 발생했습니다. 이는 원본 신호에 이 주파수 성분이 포함되어 있음을 의미합니다.`
          });
        }
        
        // 질량 중심 위치 분석
        if (Math.abs(currentWindingResult.value.centerOfMass.real) > 0.3) {
          newInsights.push({
            id: 'phase',
            title: '위상 정보',
            description: '질량 중심이 실수축에서 떨어져 있어 해당 주파수 성분의 위상 정보를 나타냅니다.'
          });
        }
      }
      
      // 다중 주파수 분석
      if (signalComponents.value.length > 1) {
        newInsights.push({
          id: 'multifreq',
          title: '다중 주파수 신호',
          description: '여러 주파수가 섞인 신호입니다. 각 주파수에서 감기 속도를 조절하여 개별 성분을 분리할 수 있습니다.'
        });
      }
      
      insights.value = newInsights;
    };
    
    // 애니메이션 컨트롤
    const toggleAnimation = () => {
      isAnimating.value = !isAnimating.value;
      if (isAnimating.value) {
        startWindingAnimation();
      } else {
        stopWindingAnimation();
      }
    };
    
    const startWindingAnimation = () => {
      const animate = () => {
        if (!isAnimating.value) return;
        
        currentAnimationTime.value += 0.016 * animationSpeed.value; // ~60fps
        if (currentAnimationTime.value >= duration.value) {
          currentAnimationTime.value = 0;
        }
        
        // 현재 시간에서의 신호 점 표시
        updateCurrentSignalPoint();
        
        animationFrameId = requestAnimationFrame(animate);
      };
      animate();
    };
    
    const stopWindingAnimation = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    
    const stepAnimation = () => {
      currentAnimationTime.value += 0.1;
      if (currentAnimationTime.value >= duration.value) {
        currentAnimationTime.value = 0;
      }
      updateCurrentSignalPoint();
    };
    
    const updateCurrentSignalPoint = () => {
      if (!complexPlaneScene || !currentWindingResult.value) return;
      
      // 현재 시간에 해당하는 신호 값 계산
      let amplitude = 0;
      signalComponents.value.forEach(comp => {
        amplitude += comp.amplitude * Math.sin(2 * Math.PI * comp.frequency * currentAnimationTime.value);
      });
      
      // 복소평면에서의 위치 계산
      const theta = -2 * Math.PI * windingFrequency.value * currentAnimationTime.value;
      const real = amplitude * Math.cos(theta);
      const imaginary = amplitude * Math.sin(theta);
      
      // 기존 점 제거
      const oldPoint = complexPlaneScene.getObjectByName('currentPoint');
      if (oldPoint) {
        complexPlaneScene.remove(oldPoint);
        oldPoint.geometry.dispose();
        oldPoint.material.dispose();
      }
      
      // 새 점 추가
      const pointGeometry = new THREE.CircleGeometry(0.06, 16);
      const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffc107 });
      currentSignalPoint = new THREE.Mesh(pointGeometry, pointMaterial);
      currentSignalPoint.position.set(real, imaginary, 0.01);
      currentSignalPoint.name = 'currentPoint';
      complexPlaneScene.add(currentSignalPoint);
      
      complexPlaneRenderer.render(complexPlaneScene, complexPlaneCamera);
    };
    
    // 유틸리티 함수들
    const getCurrentSignalData = () => {
      // 현재 신호 컴포넌트로부터 시간 도메인 데이터 생성
      const numSamples = samplingRate.value * duration.value;
      const signal = [];
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / samplingRate.value;
        let amplitude = 0;
        signalComponents.value.forEach(comp => {
          amplitude += comp.amplitude * Math.sin(2 * Math.PI * comp.frequency * t);
        });
        signal.push(amplitude);
      }
      
      return signal;
    };
    
    const resetVisualization = () => {
      windingFrequency.value = 0;
      currentAnimationTime.value = 0;
      isAnimating.value = false;
      sweepResults.value = [];
      detectedPeaks.value = [];
      insights.value = [];
      
      if (complexPlaneScene) {
        clearComplexPlaneObjects();
        complexPlaneRenderer.render(complexPlaneScene, complexPlaneCamera);
      }
      
      // 리셋 후 주파수 도메인도 업데이트
      setTimeout(() => {
        updateFrequencyDomainRealTime();
      }, 100);
    };
    
    // 통합 리사이즈 핸들러
    const handleResize = () => {
      screenWidth.value = window.innerWidth;
      
      const rendererConfigs = [
        { 
          renderer: timeDomainRenderer, 
          container: timeDomainContainer.value, 
          camera: timeDomainCamera, 
          scene: timeDomainScene,
          type: 'timeDomain'
        },
        { 
          renderer: complexPlaneRenderer, 
          container: complexPlaneContainer.value, 
          camera: complexPlaneCamera, 
          scene: complexPlaneScene,
          type: 'complexPlane'
        },
        { 
          renderer: frequencyDomainRenderer, 
          container: frequencyDomainContainer.value, 
          camera: frequencyDomainCamera, 
          scene: frequencyDomainScene,
          type: 'frequencyDomain'
        }
      ];
      
      rendererConfigs.forEach(({ renderer, container, camera, scene, type }) => {
        if (renderer && container && camera && scene) {
          const sizes = computedContainerSizes.value[type];
          
          // 렌더러 크기 업데이트
          renderer.setSize(sizes.width, sizes.height);
          
          // 카메라 설정 업데이트
          setupCamera(camera, type, sizes);
          
          // 재렌더링
          renderer.render(scene, camera);
        }
      });
    };


    
    // 정리 함수
    const cleanup = () => {
      stopWindingAnimation();
      
      [timeDomainRenderer, complexPlaneRenderer, frequencyDomainRenderer].forEach(renderer => {
        if (renderer) {
          renderer.dispose();
        }
      });
      
      window.removeEventListener('resize', handleResize);
    };
    
    // 라이프사이클 훅
    onMounted(() => {
      setTimeout(() => {
        initTimedomainVisualization();
        initComplexPlaneVisualization();
        initFrequencyDomainVisualization();
        updateSignal();
        // 초기 주파수 도메인 업데이트
        setTimeout(() => {
          updateFrequencyDomainRealTime();
        }, 200);
        window.addEventListener('resize', handleResize);
      }, 100);
    });
    
    onBeforeUnmount(cleanup);
    
    // 와처들
    watch([signalComponents, samplingRate, duration], updateSignal, { deep: true });
    watch(windingFrequency, updateWindingVisualization);
    watch(screenWidth, () => {
      handleResize();
    });
    // 컨테이너 설정 감시
    watch(containerConfig, () => {
      handleResize();
    }, { deep: true });
    
    // 신호가 변경될 때마다 주파수 도메인도 함께 업데이트
    watch([signalComponents, samplingRate, duration], () => {
      // 신호 업데이트 후 주파수 도메인도 업데이트
      setTimeout(() => {
        updateFrequencyDomainRealTime();
      }, 100);
    }, { deep: true });
    
    return {
      // 템플릿 참조
      timeDomainContainer,
      complexPlaneContainer,
      frequencyDomainContainer,
      
      // 상태 변수들
      signalComponents,
      samplingRate,
      duration,
      windingFrequency,
      maxDisplayFrequency,
      currentWindingResult,
      detectedPeaks,
      isSweeeping,
      isAnimating,
      animationSpeed,
      currentAnimationTime,
      insights,
      
      // 계산된 속성
      signalEquation,
      xAxisTicks,
      yAxisTicks,
      
      // 메서드들
      addSignalComponent,
      removeSignalComponent,
      updateWindingVisualization,
      startFrequencySweep,
      toggleAnimation,
      stepAnimation,
      resetVisualization,
      
      // 새로 추가할 항목들
      containerConfig,
      computedContainerSizes
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

.fft-container {
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
.winding-controls h3 {
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

.signal-params {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.winding-params {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: center;
}

.winding-controls-buttons {
  display: flex;
  gap: 10px;
}

.visualization-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  min-height: 600px;
}

.grid-fr {
  grid-column: 1 / 3;
}

.controls {
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
.frequency-domain .viz-container {
  margin-left: 10px;
}

/* 주파수 도메인 차트 레이아웃 */
.chart-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}

.chart-container {
  position: relative;
  flex: 1;
}

/* Y축 레이블 (크기) */
.y-axis-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 505px; /* frequencyDomain 높이와 맞춤 + margin + x-axis의 height */
  padding-right: 15px;
  position: relative;
}

.y-tick {
  position: absolute;
  font-size: 12px;
  color: #666;
  text-align: right;
  width: 30px;
  transform: translateY(150%);
}

/* X축 레이블 (주파수) */
.x-axis-labels {
  position: relative;
  height: 20px;
  margin-top: 5px;
}

.x-tick {
  position: absolute;
  font-size: 12px;
  color: #666;
  text-align: center;
  transform: translateX(-50%);
}

.signal-equation {
  font-family: 'Courier New', monospace;
  background-color: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.center-of-mass-info,
.frequency-peaks {
  font-size: 14px;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
}

.animation-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.animation-buttons {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.insights-panel {
  background-color: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
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
  margin-left : 20px;
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

input[type="range"] {
  width: 100%;
  margin: 5px 0;
}

label {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
  display: block;
}



@media (max-width: 768px) {
  .visualization-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, auto);
  }
  
  .signal-params {
    grid-template-columns: 1fr;
  }
}
</style>