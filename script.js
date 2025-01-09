/**
 * script.js
 * 用「X 型」對角線分區 -> 分辨 上/下/左/右 方向
 * 並在拖曳超過 MAX_ANGLE 後自動觸發翻轉
 */

/* 紀錄卡片的旋轉角度（Euler Angles） */
let angleX = 0;  // 上下翻轉累計角度
let angleY = 0;  // 左右翻轉累計角度

/* 拖曳相關 */
let isDragging = false;
let startX = 0, startY = 0;
let flipMode = null; // 'horizontal' or 'vertical'
let lastAngle = 0;   // 用來記錄最後一次計算的暫時角度 (moveDrag)

/* 其他常數 / 狀態 */
const MAX_ANGLE = 80;     // 拖曳超過此值就算翻轉
const currentScale = 0.8; // 卡片縮放比例

/* DOM 變數 (load 完再抓) */
let card, toastMsg;

let isFirst = true;
const FIRST_ANGLE = -720.001;
let isBack = false;

window.addEventListener('load', () => {
    // 從 HTML DOM 抓元素
    card = document.getElementById('businessCard');
    toastMsg = document.getElementById('toastMsg');

    doDoubleX('left');
    doFlipAnimation();
    // 讓瀏覽器先渲染「起始狀態」，再開始做「多段動畫」
    setTimeout(() => {
        doDoubleX('right');
        doFlipAnimation();
    }, 1500);


    // Toast 保持原邏輯：3 秒後淡出
    setTimeout(() => {
        toastMsg.style.opacity = '0';
        setTimeout(() => {
            toastMsg.style.display = 'none';
        }, 500);
    }, 3000);

    // 綁定其他事件 (拖曳、雙擊...等)
    initEvents();
});


/** 綁定各種事件 */
function initEvents() {
    // ==========================
    // 1. 拖曳 (滑鼠 + 手指)
    // ==========================
    // 手指
    card.addEventListener('touchstart', onTouchStart, {passive: true});
    card.addEventListener('touchmove', onTouchMove, {passive: false});
    card.addEventListener('touchend', onTouchEnd);

    // 滑鼠
    let mouseDown = false;
    card.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseDown = true;
        startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
        if (mouseDown && isDragging) {
            moveDrag(e.clientX, e.clientY);
        }
    });
    window.addEventListener('mouseup', () => {
        if (mouseDown && isDragging) {
            endDrag();
        }
        mouseDown = false;
    });

    // ==========================
    // 2. 雙擊 (Double Click / Double Tap)
    // ==========================
    // 電腦：dblclick
    document.addEventListener('dblclick', (e) => {
        onDoubleX(e.clientX, e.clientY);
    });

    // 手機：簡易 double tap
    let lastTouchTime = 0;
    const DOUBLE_TAP_DELAY = 300;
    document.addEventListener('touchstart', (e) => {
        const now = Date.now();
        if (now - lastTouchTime < DOUBLE_TAP_DELAY) {
            onDoubleX(e.touches[0].clientX, e.touches[0].clientY);
        }
        lastTouchTime = now;
    });
}

/* ============== 拖曳事件處理 (上下 / 左右) ============== */
function onTouchStart(e) {
    if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function onTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function onTouchEnd() {
    if (isDragging) {
        endDrag();
    }
}

/** 拖曳開始 */
function startDrag(x, y) {
    isDragging = true;
    flipMode = null;
    startX = x;
    startY = y;
    lastAngle = 0;          // 重置
    card.style.transition = 'none'; // 拖曳期間關掉動畫
}

/** 拖曳進行中 */
function moveDrag(x, y) {
    const deltaX = x - startX;
    const deltaY = y - startY;

    // 第一次明確移動 -> 判定水平 or 垂直
    if (!flipMode) {
        flipMode = (Math.abs(deltaX) > Math.abs(deltaY)) ? 'horizontal' : 'vertical';
    }

    if (flipMode === 'horizontal') {
        // 左右翻轉 => 改變 angleY
        let newAngle = deltaX * 0.3; // 比例
        // 限制 -MAX_ANGLE ~ MAX_ANGLE
        if (newAngle > MAX_ANGLE) newAngle = MAX_ANGLE;
        if (newAngle < -MAX_ANGLE) newAngle = -MAX_ANGLE;
        // 即時顯示
        card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY + newAngle}deg) scale(${currentScale})`;
        lastAngle = newAngle; // 記錄最後角度
    } else {
        // 上下翻轉 => 改變 angleX (往上翻 => angleX 負值)
        let newAngle = -deltaY * 0.3;
        if (newAngle > MAX_ANGLE) newAngle = MAX_ANGLE;
        if (newAngle < -MAX_ANGLE) newAngle = -MAX_ANGLE;
        card.style.transform = `rotateX(${angleX + newAngle}deg) rotateY(${angleY}deg) scale(${currentScale})`;
        lastAngle = newAngle;
    }
}

/** 拖曳結束 */
function endDrag() {
    isDragging = false;

    // 若超過門檻 => 自動翻轉 (模擬「雙擊」效果)
    // 依 "flipMode" + "lastAngle" 判斷方向
    if (flipMode === 'horizontal') {
        if (lastAngle >= MAX_ANGLE) {
            // 往右翻
            angleY += 540; // 或 720/1080 等自行決定
            doFlipAnimation();
            return;
        } else if (lastAngle <= -MAX_ANGLE) {
            // 往左翻
            angleY -= 540;
            doFlipAnimation();
            return;
        }
    } else { // vertical
        if (lastAngle >= MAX_ANGLE) {
            // 往下翻 (您可以自行決定要 += 540 還是 -= 540)
            angleX += 540;
            doFlipAnimation();
            return;
        } else if (lastAngle <= -MAX_ANGLE) {
            // 往上翻
            angleX -= 540;
            doFlipAnimation();
            return;
        }
    }

    // 沒超過門檻 => 回到原位
    card.style.transition = 'transform 0.5s ease';
    card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(${currentScale})`;
}

/* ============== 雙擊：以「X 型」分成四區 ============== */
function onDoubleX(clickX, clickY) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 計算對角線
    const lineAVal = (h / w) * clickX;           // y = (h/w)*x
    const lineBVal = h - (h / w) * clickX;       // y = h - (h/w)*x

    // 分四區 (上、右、下、左)
    if (clickY < lineAVal && clickY < lineBVal) {
        // 上方區塊 => angleX -= 540 (或 += 540 視需求)
        doDoubleX('up');
    } else if (clickY < lineAVal && clickY >= lineBVal) {
        // 右方區塊 => angleY += 540
        doDoubleX(!isBack ? 'right' : 'left');
    } else if (clickY >= lineAVal && clickY >= lineBVal) {
        // 下方區塊 => angleX += 540 (或 -= 540 視需求)
        doDoubleX('down');
    } else {
        // 左方區塊 => angleY -= 540
        doDoubleX(!isBack ? 'left' : 'right');
    }

    console.log("angleX", angleX);
    console.log("angleY", angleY);
    doFlipAnimation();
}

function doDoubleX(direction) {
    // 分四區 (上、右、下、左)
    if ('up' == direction) {
        // 上方區塊 => angleX -= 540 (或 += 540 視需求)
        angleX += 540;
        if (isFirst) {
            angleX += FIRST_ANGLE;
            isFirst = false;
        }
    } else if ('right' == direction) {
        // 右方區塊 => angleY += 540
        angleY += 540;
        if (isFirst) {
            angleY += FIRST_ANGLE;
            isFirst = false;
        }
    } else if ('down' == direction) {
        // 下方區塊 => angleX += 540 (或 -= 540 視需求)
        angleX -= 540;
        if (isFirst) {
            angleX -= FIRST_ANGLE;
            isFirst = false;
        }
    } else {
        // 左方區塊 => angleY -= 540
        angleY -= 540;
        if (isFirst) {
            angleY -= FIRST_ANGLE;
            isFirst = false;
        }
    }
}

/* ============== 執行翻轉動畫 (先放大，再縮小) ============== */
function doFlipAnimation() {
    // 先放大
    card.style.transition = 'transform 0.8s ease';
    card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1)`;

    // 0.8秒後，開始縮小
    setTimeout(() => {
        card.style.transition = 'transform 0.4s ease';
        card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(${currentScale})`;
    }, 800);

    // 1.2秒 (0.8 + 0.4) 後，整個動畫結束，再做角度校正

    setTimeout(() => {
        angleX = normalizeAngle(angleX);
        angleY = normalizeAngle(angleY);

        if (Math.abs(angleX % 360) == 180 || Math.abs(angleY % 360) == 180) {
            isBack = true;
        }

        // 重新套用一次「校正後」的角度，避免下一次翻轉時跳動
        card.style.transition = 'none'; // 先取消過渡效果
        card.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(${currentScale})`;
    }, 1200);
}

/**
 * 將角度歸一化到 [-180, 180] 區間內
 */
function normalizeAngle(a) {
    // 先做 mod 360
    let mod = a % 360;
    // 由於 JS 對負值的 % 可能是負的，所以做以下處理
    if (mod < 0) {
        mod += 360;
    }
    // 現在 mod 在 [0, 360) 之間
    // 若大於 180，就減 360，使其落在 [-180, 180]
    if (mod > 180) {
        mod -= 360;
    }
    return mod;
}

