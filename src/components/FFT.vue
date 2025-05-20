<template>
  <section class="fft-container container">
    <h1>푸리에 변환 시각화</h1>

    <div class="controls">
      <div class="control-group">
        <label>신호 타입:</label>
        <select v-model="selectedSignalType">
          <option value="sine">사인파</option>
          <option value="square">사각파</option>
          <option value="triangle">삼각파</option>
          <option value="sawtooth">톱니파</option>
          <option value="custom">사용자 정의</option>
        </select>
      </div>
      <div class="control-group">
        <label>주파수: {{ frequency }}Hz</label>
        <input type="range" v-model.number="frequency" min="1" max="20" step="1" />
      </div>
      <div class="control-group">
        <label>진폭: {{ amplitude }}</label>
        <input type="range" v-model.number="amplitude" min="0.1" max="2" step="0.1" />
      </div>
      <div class="control-group">
        <label>샘플링 포인트: {{ samplingPoints }}</label>
        <input type="range" v-model.number="samplingPoints" min="32" max="1024" step="32" />
      </div>
      <div class="control-group display-options">
        <label><input type="checkbox" v-model="showOriginalSignal" /> 원본 신호</label>
        <label><input type="checkbox" v-model="showFFTResult" /> FFT 결과</label>
        <label><input type="checkbox" v-model="showPhaseSpectrum" /> 위상 스펙트럼</label>
      </div>
    </div>

    <div class="visualization-container">
      <div ref="signalContainer" class="plot-container">
        <h3>시간 도메인</h3>
      </div>
      <div ref="fftContainer" class="plot-container">
        <h3>주파수 도메인</h3>
      </div>
      <div v-if="showPhaseSpectrum" ref="phaseContainer" class="plot-container">
        <h3>위상 스펙트럼</h3>
      </div>
    </div>

    <div class="info-panel">
      <h3>FFT 분석 정보</h3>
      <div v-if="fftAnalysis">
        <p><strong>주요 주파수 성분:</strong> {{ dominantFrequencies.join(', ') }}Hz</p>
        <p><strong>신호 에너지:</strong> {{ signalEnergy.toFixed(2) }}</p>
        <p><strong>평균 진폭:</strong> {{ averageAmplitude.toFixed(2) }}</p>
      </div>
      <div v-if="selectedSignalType === 'custom'" class="custom-signal-editor">
        <h4>사용자 정의 신호 편집</h4>
        <textarea v-model="customSignalEquation" placeholder="수식을 입력하세요 (예: Math.sin(2*Math.PI*x) + 0.5*Math.sin(4*Math.PI*x))"></textarea>
        <button @click="updateCustomSignal">적용</button>
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
    const signalContainer = ref(null);
    const fftContainer = ref(null);
    const phaseContainer = ref(null);
    
    const selectedSignalType = ref('sine');
    const frequency = ref(5);
    const amplitude = ref(1);
    const samplingPoints = ref(256);
    const showOriginalSignal = ref(true);
    const showFFTResult = ref(true);
    const showPhaseSpectrum = ref(false);
    
    const customSignalEquation = ref('');
    const fftAnalysis = ref(null);
    
    // Three.js 관련 변수
    let signalScene, signalCamera, signalRenderer;
    let fftScene, fftCamera, fftRenderer;
    let phaseScene, phaseCamera, phaseRenderer;
    
    // 계산된 속성들
    const dominantFrequencies = computed(() => {
      if (!fftAnalysis.value) return [];
      return fftAnalysis.value.dominantFrequencies || [];
    });
    
    const signalEnergy = computed(() => {
      if (!fftAnalysis.value) return 0;
      return fftAnalysis.value.energy || 0;
    });
    
    const averageAmplitude = computed(() => {
      if (!fftAnalysis.value) return 0;
      return fftAnalysis.value.averageAmplitude || 0;
    });

    // API URL
    const API_BASE_URL = 'http://localhost:8080/api/fft';

    // API 호출 함수들
    const fetchFFTData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/analyze?signalType=${selectedSignalType.value}&frequency=${frequency.value}&amplitude=${amplitude.value}&samplingPoints=${samplingPoints.value}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        fftAnalysis.value = data;
        updateVisualization(data);
      } catch (error) {
        console.error('Error fetching FFT data:', error);
      }
    };

    const updateCustomSignal = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/custom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            equation: customSignalEquation.value,
            samplingPoints: samplingPoints.value
          })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        fftAnalysis.value = data;
        updateVisualization(data);
      } catch (error) {
        console.error('Error updating custom signal:', error);
      }
    };

    // Three.js 시각화 함수들
    const initThreeScenes = () => {
      // 시간 도메인 씬 초기화
      signalScene = new THREE.Scene();
      signalCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      signalRenderer = new THREE.WebGLRenderer({ antialias: true });
      signalRenderer.setSize(signalContainer.value.clientWidth, signalContainer.value.clientHeight);
      signalContainer.value.appendChild(signalRenderer.domElement);

      // 주파수 도메인 씬 초기화
      fftScene = new THREE.Scene();
      fftCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      fftRenderer = new THREE.WebGLRenderer({ antialias: true });
      fftRenderer.setSize(fftContainer.value.clientWidth, fftContainer.value.clientHeight);
      fftContainer.value.appendChild(fftRenderer.domElement);

      // 위상 스펙트럼 씬 초기화
      if (showPhaseSpectrum.value) {
        phaseScene = new THREE.Scene();
        phaseCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
        phaseRenderer = new THREE.WebGLRenderer({ antialias: true });
        phaseRenderer.setSize(phaseContainer.value.clientWidth, phaseContainer.value.clientHeight);
        phaseContainer.value.appendChild(phaseRenderer.domElement);
      }
    };

    const updateVisualization = (data) => {
      // 시간 도메인 그래프 업데이트
      updateSignalPlot(data.timeData);
      
      // 주파수 도메인 그래프 업데이트
      updateFFTPlot(data.frequencyData);
      
      // 위상 스펙트럼 업데이트
      if (showPhaseSpectrum.value) {
        updatePhasePlot(data.phaseData);
      }
    };

    const updateSignalPlot = (timeData) => {
      // 시간 도메인 그래프 구현
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(timeData.length * 3);
      
      timeData.forEach((value, i) => {
        positions[i * 3] = (i / timeData.length) * 2 - 1; // X
        positions[i * 3 + 1] = value * 0.8; // Y
        positions[i * 3 + 2] = 0; // Z
      });
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const line = new THREE.Line(geometry, material);
      
      signalScene.clear();
      signalScene.add(line);
      signalRenderer.render(signalScene, signalCamera);
    };

    const updateFFTPlot = (frequencyData) => {
      // 주파수 도메인 그래프 구현
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(frequencyData.length * 3);
      
      frequencyData.forEach((value, i) => {
        positions[i * 3] = (i / frequencyData.length) * 2 - 1; // X
        positions[i * 3 + 1] = value * 0.8; // Y
        positions[i * 3 + 2] = 0; // Z
      });
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const line = new THREE.Line(geometry, material);
      
      fftScene.clear();
      fftScene.add(line);
      fftRenderer.render(fftScene, fftCamera);
    };

    const updatePhasePlot = (phaseData) => {
      if (!showPhaseSpectrum.value) return;
      
      // 위상 스펙트럼 그래프 구현
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(phaseData.length * 3);
      
      phaseData.forEach((value, i) => {
        positions[i * 3] = (i / phaseData.length) * 2 - 1; // X
        positions[i * 3 + 1] = value * 0.8; // Y
        positions[i * 3 + 2] = 0; // Z
      });
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      const line = new THREE.Line(geometry, material);
      
      phaseScene.clear();
      phaseScene.add(line);
      phaseRenderer.render(phaseScene, phaseCamera);
    };

    // 이벤트 핸들러 및 라이프사이클 훅
    onMounted(() => {
      initThreeScenes();
      fetchFFTData();
    });

    onBeforeUnmount(() => {
      // 정리 작업
      if (signalRenderer) signalRenderer.dispose();
      if (fftRenderer) fftRenderer.dispose();
      if (phaseRenderer) phaseRenderer.dispose();
    });

    // 감시자
    watch([selectedSignalType, frequency, amplitude, samplingPoints], () => {
      fetchFFTData();
    });

    watch(showPhaseSpectrum, (newValue) => {
      if (newValue && !phaseRenderer) {
        // 위상 스펙트럼 시각화 초기화
        initPhaseVisualization();
      }
      if (fftAnalysis.value) {
        updateVisualization(fftAnalysis.value);
      }
    });

    return {
      signalContainer,
      fftContainer,
      phaseContainer,
      selectedSignalType,
      frequency,
      amplitude,
      samplingPoints,
      showOriginalSignal,
      showFFTResult,
      showPhaseSpectrum,
      customSignalEquation,
      fftAnalysis,
      dominantFrequencies,
      signalEnergy,
      averageAmplitude,
      updateCustomSignal
    };
  }
};
</script>

<style scoped>
.fft-container {
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
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.visualization-container.with-phase {
  grid-template-columns: 1fr 1fr 1fr;
}

.plot-container {
  height: 300px;
  background-color: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.plot-container h3 {
  position: absolute;
  top: 10px;
  left: 10px;
  margin: 0;
  color: #333;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 5px 10px;
  border-radius: 4px;
}

.info-panel {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.custom-signal-editor {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ddd;
}

.custom-signal-editor textarea {
  width: 100%;
  height: 100px;
  margin: 10px 0;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  resize: vertical;
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