import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import SceneManager from '../three/SceneManager.js'

/**
 * SceneManager를 Vue 생명주기에 묶는다.
 * @param {import('vue').Ref<HTMLElement|null>} hostRef  SceneManager가 캔버스를 붙일 컨테이너 div ref
 * @param {object} [options]
 * @param {string} [options.background]   씬 배경색 (예: '#0a0b0c')
 * @param {[number,number,number]} [options.cameraPosition]
 * @param {(sm:SceneManager)=>void} [options.onReady]  씬 준비 후 호출(객체 추가 등)
 * @returns {{ getSceneManager: () => SceneManager|null }}
 */
export function useThreeViewport(hostRef, options = {}) {
  let sceneManager = null

  onMounted(() => {
    if (!hostRef.value) return
    sceneManager = new SceneManager(hostRef.value)
    if (options.background) sceneManager.scene.background = new THREE.Color(options.background)
    if (options.cameraPosition) {
      sceneManager.camera.position.set(...options.cameraPosition)
      sceneManager.camera.lookAt(0, 0, 0)
    }
    if (typeof options.onReady === 'function') options.onReady(sceneManager)
  })

  onBeforeUnmount(() => {
    if (sceneManager) { sceneManager.clear(); sceneManager = null }
  })

  return { getSceneManager: () => sceneManager }
}
