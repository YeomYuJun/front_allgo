<!-- MainLayout.vue -->
<template>
    <div class="main-layout">
        <header class="header">
            <div class="topbar">
                <div class="tb_content">
                    <div class="tb_left">
                    </div>
                    <div class="tb_center">
                        <div class="logobox">
                            <!--나중에 이미지추가-->
                            <RouterLink to="/"><p style="font-size : 30px;">AllGoMath</p></RouterLink>
                        </div>
                    </div>
                    <div class="tb_right">
                    </div>
                </div>
            </div>
        </header>
        <main class="main-content">
        <div class="main_section">
            <div class="content_wrapper">
                <slot></slot> <!-- 페이지 내용-->
            </div>
        </div>
        </main>
        
        <footer class="footer">
            <div class="foot-bt">
                <div class="footer-content">
                    <div class="footer-main">
                        <h3 class="footer-title">AllGoMath</h3>
                        <p class="footer-subtitle">Algorithm, I and Math</p>
                    </div>
                    <div class="footer-info">
                        <span class="footer-year">© {{ currentYear }}. yyj2046</span>
                        <span class="footer-divider">|</span>
                        <a href="mailto:yyj2046@gmail.com" class="footer-contact">
                            Contact: yyj2046@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

// 현재 년도 자동 계산
const currentYear = computed(() => new Date().getFullYear())
</script>
<style>
/* Sticky Footer Layout */
.main-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    flex-shrink: 0;
}

.main-content {
    flex: 1 0 auto;
}

.footer {
    flex-shrink: 0;
}

.topbar {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    height: 70px;

}
.topbar .tb_content{
    height: 100%;
    display: flex;
    align-items: center;
    margin : 0 30px;
}

.topbar .tb_left,
.topbar .tb_right {
    flex : 1 1 0%;
}
.main_section {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    vertical-align: baseline;
    background: transparent;
}
.content_wrapper{
    margin-left: 50px;
    margin-right: 50px;
}

.foot-bt {
    box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-top: 1px solid #dee2e6;
    font-family: 'JetBrains Mono', monospace;
    padding: 20px 0;
}

.footer-content {
    max-width: 1200px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 50px;
    flex-wrap: wrap;
    gap: 20px;
}

.footer-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.footer-title {
    font-size: 22px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
    letter-spacing: 1px;
}

.footer-subtitle {
    font-size: 13px;
    color: #6c757d;
    margin: 0;
    font-style: italic;
}

.footer-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    flex-wrap: wrap;
}

.footer-year {
    color: #bdbdbd;
    font-weight: 500;
}

.footer-divider {
    color: #adb5bd;
    font-weight: 300;
}

.footer-contact {
    color: #bdbdbd;
    text-decoration: none;
    transition: all 0.3s ease;
    font-weight: 500;
}

.footer-contact:hover {
    color: #78a0cb;
    text-decoration: underline;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
        text-align: center;
        padding: 0 30px;
        gap: 16px;
    }
    
    .footer-title {
        font-size: 20px;
    }
    
    .footer-info {
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .footer-divider {
        display: none;
    }
    
    .footer-info {
        flex-direction: column;
        gap: 8px;
    }
}
</style>