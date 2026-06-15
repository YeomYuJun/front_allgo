import apiClient from './api'

/**
 * 서버 WebP 프랙탈 이미지를 가져온다.
 * @param {{type:string,iterations:number,resolution:number,colorScheme:string,smooth:boolean,centerX:number,centerY:number,zoom:number,juliaReal?:number,juliaImag?:number}} params
 * @returns {Promise<Blob>}
 */
export function fetchImage(params) {
  return apiClient.get('/fractal/generate/image', { params, responseType: 'blob' }).then((r) => r.data)
}
