<template>
    <section class="bfs-container container">
        <div>
            <h2 class="tit">BFS Visualization</h2>
        </div>
        <section class="container-wrap">
            <section class="sub-section section-l canvas-wrap">
                <div class="visualization-grid">
                    <div class="viz-panel bfs-2d-panel grid-fr">
                        <h4>BFS Visualization</h4>
                        <div ref="threeContainer" class="viz-container bfs-view"></div>
                    </div>
                    <div class="explanation-panel">
                        <h4>BFS(너비 우선 탐색)란?</h4>
                        <div class="explanation-content">
                        <div class="math-formula">
                            <strong>정의:</strong>맹목적 탐색방법의 하나로 시작 정점을 방문한 후 시작 정점에 인접한 모든 정점들을 우선 방문하는 방법
                        </div>
                        <p><strong>미로 찾기</strong></p>
                        <ul>
                            <li>미로가 주어졌을 때, (1, 1)에서 출발하여 (N, M)의 위치로 이동할 때 지나야 하는 최소의 칸 수를 구하는 프로그램</li>
                        </ul>
                        </div>
                    </div>
                </div>

            </section>
             <!-- 우측: 컨트롤 및 정보 -->
            <section class="sub-section section-r controls-wrap">
                <div class="controls animation-controls">
                <h3>1. 애니메이션</h3>
                <div class="control-builder">
                    <div class="control-component">
                    <label>width 파라미터: </label>
                    <input type="range" min="0" max="1" step="0.01" />
                    </div>
                    <div class="control-component">
                    <label>애니메이션 속도: 0ms</label>
                    <input type="range"  min="50" max="500" step="50" />
                    </div>
                    <div class="control-component">
                    <button @click="">
                        리셋
                    </button>
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
    const threeContainer = ref(null);
    const defaultMaze = ref([
          [1,0,1,1,1,1]
        , [1,0,1,0,1,0]
        , [1,0,1,0,1,1]
        , [1,1,1,0,1,1]
    ]);
    // --- Three.js 관련 객체 ---
    let camera, scene, renderer;
    let plane;
    let pointer, raycaster, isShiftDown = false;

    let rollOverMesh, rollOverMaterial;
    let cubeGeo, cubeMaterial;

    const objects = [];

    // API URL
    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/bfs`;
    
    

    const initThreeScene = () => {
        if (!threeContainer.value) return;
        camera = new THREE.PerspectiveCamera( 70, threeContainer.value.clientWidth / threeContainer.value.clientHeight, 0.1, 100000);
        camera.position.set( 1000, 1000, 100 );
        camera.lookAt( 0, 0, 0 );

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xf0f0f0 );

        // roll-over helpers
        const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
        rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.4, transparent: true } );
        rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
        scene.add( rollOverMesh );

        // cubes
        const map = new THREE.TextureLoader().load( 'textures/square-outline-textured.png' );
        map.colorSpace = THREE.SRGBColorSpace;
        cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
        cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xfeb74c, map: map } );

        // grid

        const gridHelper = new THREE.GridHelper( 1000, 20 );
        scene.add( gridHelper );

        //

        raycaster = new THREE.Raycaster();
        pointer = new THREE.Vector2();

        const geometry = new THREE.PlaneGeometry( 1000, 1000 );
        geometry.rotateX( - Math.PI / 2 );

        plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
        scene.add( plane );

        objects.push( plane );

        // lights

        const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
        scene.add( ambientLight );

        const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        scene.add( directionalLight );

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        //renderer.setSize(threeContainer.value.clientWidth, threeContainer.value.clientHeight);
        //client, contrainter 사이즈로 맞추고 일단 

        //orbit도 나중에 추가하고

        // 

        //document.body.appendChild( renderer.domElement );
        threeContainer.value.appendChild(renderer.domElement);
        console.log(renderer)

        document.addEventListener( 'pointermove', onPointerMove );
        document.addEventListener( 'pointerdown', onPointerDown );
        document.addEventListener( 'keydown', onDocumentKeyDown );
        document.addEventListener( 'keyup', onDocumentKeyUp );

        //

        window.addEventListener( 'resize', onWindowResize );
        render();

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

        render();

    }

    function onPointerMove( event ) {

        pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

        raycaster.setFromCamera( pointer, camera );

        const intersects = raycaster.intersectObjects( objects, false );

        if ( intersects.length > 0 ) {

            const intersect = intersects[ 0 ];

            rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
            rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );

            render();

        }

    }

    function onPointerDown( event ) {

        pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

        raycaster.setFromCamera( pointer, camera );

        const intersects = raycaster.intersectObjects( objects, false );

        if ( intersects.length > 0 ) {

            const intersect = intersects[ 0 ];

            // delete cube

            if ( isShiftDown ) {

                if ( intersect.object !== plane ) {

                    scene.remove( intersect.object );

                    objects.splice( objects.indexOf( intersect.object ), 1 );

                }

                // create cube

            } else {

                const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
                voxel.position.copy( intersect.point ).add( intersect.face.normal );
                voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
                scene.add( voxel );

                objects.push( voxel );

            }

            render();

        }

    }

    function onDocumentKeyDown( event ) {

        switch ( event.keyCode ) {

            case 16: isShiftDown = true; break;

        }

    }

    function onDocumentKeyUp( event ) {

        switch ( event.keyCode ) {

            case 16: isShiftDown = false; break;

        }

    }
    const render = () => {
        renderer.render( scene, camera );
        
    }
    // --- Lifecycle Hooks ---
    onMounted(() => {
        initThreeScene();
    });
    return {
        threeContainer,
        defaultMaze
    }
    
  }
}
</script>

<style scoped>
.tit {
  font-weight: 600;
  border-bottom: 5px solid #777;
  width: fit-content;
  margin-bottom: 25px;
}

.bezier-container {
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

.controls input[type="checkbox"] {
  margin: 5px;
  transform: scale(1.2);
}

.controls select {
  width: 100%;
  padding: 5px;
  margin-top: 5px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-top: 10px;
}

.preset-buttons button {
  padding: 8px 12px;
  font-size: 12px;
}

.help-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
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
  margin-bottom: 20px;
}

.results-panel h3 {
  margin-top: 0;
  color: #1976d2;
}

.result-content p {
  margin: 8px 0;
}

.advanced-controls {
  background-color: #fff3e0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
}

.advanced-controls h3 {
  margin-top: 0;
  color: #e65100;
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

.advanced-controls button {
  background-color: #ff9800;
  margin: 3px;
  padding: 6px 12px;
  font-size: 12px;
}

.advanced-controls button:hover:not(:disabled) {
  background-color: #e65100;
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
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
}
</style>