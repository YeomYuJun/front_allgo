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
                            <p class="text_ans">allgomath.com</p>
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
                <v-col cols="12" sm="6" md="4">
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

                <!-- 볼록함수 - 주석처리됨 -->
                <!-- <v-col cols="12" sm="6" md="4">
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
                </v-col> -->

                <!-- FFT -->
                <v-col cols="12" sm="6" md="4">
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
                <v-col cols="12" sm="6" md="4">
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

                <!-- Monte Carlo Integration -->
                <v-col cols="12" sm="6" md="4">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Monte Carlo</v-card-title>
                        <v-card-text class="text-center">
                            Probabilistic integration using random sampling.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                             <v-btn color="primary" @click="navigateTo('/monte-carlo')">
                                Go to Monte Carlo
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>

                <!-- Bezier Curves -->
                <v-col cols="12" sm="6" md="4">
                    <v-card class="pa-3" outlined tile>
                        <v-card-title class="justify-center">Bezier Curves</v-card-title>
                        <v-card-text class="text-center">
                            Interactive Bezier curve generation and analysis.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                             <v-btn color="primary" @click="navigateTo('/bezier')">
                                Go to Bezier Curves
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-col>
                <!-- Bezier Curves -->
                <v-col cols="12" sm="6" md="4">
                    <v-card class="pa-3 coming-soon-card" outlined tile>
                        <v-card-title class="justify-center">Laplace Transform</v-card-title>
                        <v-card-text class="text-center">
                            See how Laplace Transform works.
                        </v-card-text>
                        <v-card-actions class="justify-center">
                             <v-btn color="grey lighten-1" disabled @click="navigateTo('/laplace-transform')">
                                <!-- Go to Laplace Transform -->
                                Coming Soon
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
                <!-- Coming Soon Card -->
                <v-col cols="12" sm="6" md="4">
                    <v-card class="pa-3 coming-soon-card" outlined tile>
                        <v-card-title class="justify-center">Sorting Algorithms</v-card-title>
                        <v-card-text class="text-center">
                            Various sorting algorithm visualizations coming soon.<br>
                            Please stay tuned for updates!
                        </v-card-text>
                        <v-card-actions class="justify-center">
                            <v-btn color="grey lighten-1" disabled>
                                Coming Soon
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
        height: 100%; /* 카드 높이 통일 */
        display: flex;
        flex-direction: column;
    }
    
    .navigation-links .v-card .v-card-text {
        flex-grow: 1; /* 텍스트 영역이 남은 공간을 차지하도록 */
        display: flex;
        align-items: center; /* 텍스트 수직 중앙 정렬 */
        min-height: 60px; /* 최소 높이 설정 */
    }
    
    .navigation-links .v-card .v-card-actions {
        margin-top: auto; /* 버튼을 하단에 고정 */
    }
    
    .navigation-links .v-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
    }

    /* Coming Soon Card 스타일 */
    .coming-soon-card {
        background-color: #f5f5f5 !important;
        border-color: #e0e0e0 !important;
    }
    
    .coming-soon-card .v-card-title {
        color: #9e9e9e !important;
    }
    
    .coming-soon-card .v-card-text {
        color: #757575 !important;
    }
</style>