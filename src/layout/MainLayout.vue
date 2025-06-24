<!-- MainLayout.vue -->
<template>
    <div class="main-layout">
        <header>
            <div class="topbar">
                <div class="tb_content">
                    <div class="tb_left">
                    </div>
                    <div class="tb_center">
                        <div class="logobox">
                            <!--나중에 이미지추가-->
                            <a href="/"><p style="font-size : 30px;">AllGoMath</p></a>
                        </div>
                    </div>
                    <div class="tb_right">
                    </div>
                </div>
            </div>
        </header>
        <main>
        <div class="main_section">
            <div class="content_wrapper">
                <slot></slot> <!-- 페이지 내용-->
            </div>
        </div>
        </main>
        
        <footer>
            <div class="foot-bt">
                <p>푸터 내용</p>
            </div>
        </footer>
    </div>
</template>
<style>
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
    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
    height: 70px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
}
</style>