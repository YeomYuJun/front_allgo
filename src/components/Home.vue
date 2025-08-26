<template>
    <section class="slide_section">
        <v-window
            v-model="onboarding"
            show-arrows="hover">
            <v-window-item :key="'card-1'">
                <v-card class="d-flex align-center justify-center ma-2" elevation="2" height="250">
                    <div class="slide_section slide_section_1">
                        <div class="text_wrap textbox1">
                            <p class="text_qst">What is AllGoMath?</p>
                            <p class="text_ans">Algorithm, I and Math</p>
                        </div>
                        <div class="text_wrap textbox2">
                            <p class="text_qst">How to AllGoMath?</p>
                            <p class="text_ans">Click, Look, Think</p>
                        </div>
                        <div class="text_wrap textbox3">
                            <p class="text_qst">Why is AllGoMath</p>
                            <p class="text_ans">It`s fun. that`s all</p>
                        </div>
                        <div class="text_wrap textbox4">
                            <p class="text_qst">When is AllGoMath</p>
                            <p class="text_ans">Think about math</p>
                        </div>
                        <div class="text_wrap textbox5">
                            <p class="text_qst">Where is AllGoMath</p>
                            <p class="text_ans">www.allgomath.com</p>
                        </div>
                    </div>
                </v-card>
            </v-window-item>
            <v-window-item :key="'card-2'">
                <v-card class="d-flex align-center justify-center ma-2" elevation="2" height="250">
                    <div class="slide_section slide_section_2">
                        <div class="text_wrap textbox6">
                            <p class="text_qst">Stop Think.</p>
                            <p class="text_ans">Just Go.</p>
                        </div>
                    </div>
                </v-card>
            </v-window-item>
        </v-window>
    </section>

    <section class="content_section">
        <v-container> 

            <!-- algorithm tit -->
            <v-row justify="center" class="text-center mt-5 mb-5">
                <v-col cols="12">
                    <h2>Explore Algorithms</h2>
                    <p>Choose an algorithm visualization to start.</p>
                </v-col>
            </v-row>
            <!-- algorithn -->
            <v-row justify="center" align="center" class="navigation-links">
                <!-- 3d -->
                <v-col cols="12" md="3">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">3D Function Plotter</v-card-title>
                        <v-card-text class="text-center">
                            Visualize mathematical functions like saddle points in 3D.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/gradient-descent')">
                                Go to 3D Plotter
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- 볼록함수 -->
                <v-col cols="12" md="3">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Convex Function</v-card-title>
                        <v-card-text class="text-center">
                            See how convex functions are composed of frequencies.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/convex-function')">
                                Go to Convex Function
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- FFT -->
                <v-col cols="12" md="3">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Fourier Transform</v-card-title>
                        <v-card-text class="text-center">
                            See how Fourier Transform works.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/FFT')">
                                Go to Fourier Transform
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- 프랙탈 -->
                <v-col cols="12" md="3">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Fractal</v-card-title>
                        <v-card-text class="text-center">
                            Watch fractal in action.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                             <v-btn color="primary" @click="navigateTo('/fractal')">
                                Go to Fractal
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
            <!-- 정렬 tit -->
            <v-row justify="center" class="text-center mt-5 mb-5">
                <v-col cols="12">
                    <h2>Explore Sortings</h2>
                    <p>Choose an sort algorithm visualization to start.</p>
                </v-col>
            </v-row>
            <!-- 정렬 -->
            <v-row justify="center" align="center" class="navigation-links">
                <!-- Bubble -->
                <v-col cols="12" md="3" v-if="false">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Bubble Sort</v-card-title>
                        <v-card-text class="text-center">
                            Compare adjacent elements and swap if needed.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/')">
                                Go to Bubble Sort
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- Quick -->
                <v-col cols="12" md="3" v-if="false">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Quick Sort</v-card-title>
                        <v-card-text class="text-center">
                            Pick a pivot and partition around it.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/')">
                                Go to Quick Sort
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
                
                <!-- Merge -->
                <v-col cols="12" md="3" v-if="false">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Merge Sort</v-card-title>
                        <v-card-text class="text-center">
                            Divide into halves and merge them sorted.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="primary" @click="navigateTo('/')">
                                Go to Merge Sort
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- Heap -->
                <v-col cols="12" md="3" v-if="false">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Heap Sort</v-card-title>
                        <v-card-text class="text-center">
                            Build a heap and extract the maximum repeatedly.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                             <v-btn color="primary" @click="navigateTo('/')">
                                Go to Heap Sort
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </section>
</template >

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router' // Vue Router의 useRouter 임포트

const length = ref(2)
const onboarding = ref(0)
const router = useRouter() // 라우터 인스턴스 가져오기

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style>
    /* 기존 스타일 유지 */
    .slide_section {
        position: relative;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 100;
        width: 100%;
        /* height: 100%; 슬라이드 높이는 v-card height="250"으로 제어되므로, 
           이 부분은 전체 화면을 차지하게 할 경우 조절 필요 */
        background-size: 100% auto;
        background-position: center;
        background-repeat: no-repeat;
    }
    .slide_section_1 {
        background-image: url(/assets/images/bg_slide1.png);
        width: 100%;
        height: 100%;
        background-size: cover; /* 이미지가 영역을 꽉 채우도록 */
        background-position: center;
    }
    .slide_section_2 {
        background-image: url(/assets/images/bg_slide2.png);
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
    }
    @media (max-width: 1600px) {
        .slide_section_1 {
            background-image: url(/assets/images/bg_slide1_s.png);
        }
        .slide_section_2 {
            background-image: url(/assets/images/bg_slide2_s.png);
        }
    }
    @media (max-width: 1000px){
        .slide_section_1 {
            background-image: url(/assets/images/bg_slide1_xs.png); 
        }
        .slide_section_2 {
            background-image: url(/assets/images/bg_slide2_xs.png); 
        }
    }
    .text_wrap {
        position: absolute;
    }
    .textbox1 {
        left: 3%; 
        top: 7.6%; 
        transform: rotate(3.17deg);
    }
    .textbox2 {
        top: 56%; 
        left: 15.6%; 
        transform: rotate(-5deg);
    }
    .textbox3 {
        top: 7.2%; 
        left: 31.5%; 
        transform: rotate(3.02deg);
    }
    .textbox4 {
        top: 33.2%; 
        left: 55.3%; 
        transform: rotate(-6.9deg); 
    }
    .textbox5 {
        top: 53.2%; 
        left: 75.5%; 
    }
    .textbox6{
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    .text_qst {
        font-size: 18px; 
    }
    .text_ans {
        font-size: 14px;
        margin-left: 50px;
        line-height: 1.8;
    }

    @media (min-width: 768px) {
        .text_qst { font-size: 20px; }
        .text_ans { font-size: 16px; }
    }
    @media (min-width: 900px) {
        .text_qst { font-size: 24px; }
        .text_ans { font-size: 18px; }
    }
    @media (min-width: 1200px) {
        .text_qst { font-size: 26px; }
        .text_ans { font-size: 20px; margin-left: 30px; }
    }
    @media (min-width: 1600px) {
        .text_qst { font-size: 28px; }
        .text_ans { font-size: 24px; }
    }
    @media (max-width: 1400px) {
        .textbox2 { left: 25.6%; }
        .textbox3 { left: 46.5%; }
        .textbox4 { right: 5.7%; left: auto; }
        .textbox5 { display: none; }
    }
    @media (max-width: 900px){
        .textbox1 { }
        .textbox3 { display: none; }
        .textbox2 { }
        .textbox4 { }
    }

    /* 네비게이션 링크 섹션 스타일 추가 */
    .content_section {
        padding: 40px 0;
        background-color: #f9f9f9; /* 연한 배경색으로 구분 */
    }
    .navigation-links .v-card {
        transition: all 0.3s ease-in-out;
    }
    .navigation-links .v-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
    }
</style>