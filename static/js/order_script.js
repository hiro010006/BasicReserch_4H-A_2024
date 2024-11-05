let totalPrice = parseInt(sessionStorage.getItem('totalPrice')) || parseInt(document.getElementById('hidden-total-price').value);
let totalBait = parseInt(sessionStorage.getItem('totalBait')) || parseInt(document.getElementById('hidden-total-bait').value);
let currentOrderTotalPrice = 0;
let currentOrderTotalSushiCount = 0;
let order = {};
const orderLimit = 3;
var historyTable = [];
let numOrder = 0;

let sushiInfo = JSON.parse(document.getElementById('hidden-sushi-info').value);

// 言語設定を取得して日本語か英語の表示を切り替え
const language = navigator.language.startsWith('ja') ? 'jp' : 'en';

// sushi-nameクラスを持つ全ての要素を更新
document.querySelectorAll('.sushi-name').forEach(function (element) {
    const nameJP = element.getAttribute('data-sushi-name-jp');
    const nameEN = element.getAttribute('data-sushi-name-en');
    element.textContent = (language === 'jp') ? nameJP : nameEN;
});

const recommend_sushi_paths = {
    "ウニ": "/static/images/recommend_uni.png",
    "イクラ": "/static/images/recommend_ikura.png"
};

let currentIndex = 0;

const recommendItem = document.getElementById("recommendItem");
console.log(recommendItem);

const recommend_images = Object.entries(recommend_sushi_paths).map(([sushi, path]) => {
    const img = document.createElement("img");
    img.src = path;
    img.addEventListener('click', () => orderRecommendSushi(sushi));
    recommendItem.appendChild(img);
    return img;
});
recommend_images[currentIndex].classList.add("active");

// 10秒ごとに自動でスライドさせる
setInterval(() => {
    changeImage("left");
}, 10000);

let startX = 0;
recommendItem.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
});

recommendItem.addEventListener("touchend", (event) => {
    const endX = event.changedTouches[0].clientX;
    const direction = endX < startX ? "left" : "right";
    changeImage(direction);
});

window.onload = function() {
    updateDisplay(); // これにより0が表示されるのを防ぎます
};

// 注文画面
function toggleSushiOrder(sushi) {
    increaseQuantity(sushi);
    let controls = document.getElementById(`controls-${sushi}`);
    if (order[sushi].count != 0){
        controls.style.display = 'flex';
    }
}

function increaseQuantity(sushi) {
    if (!order[sushi]) {
        order[sushi] = { count: 0, price: sushiInfo[sushi]["price"] };
    }
    if (currentOrderTotalSushiCount < orderLimit){
        order[sushi].count += 1;
        currentOrderTotalSushiCount += 1;
        currentOrderTotalPrice += order[sushi].price;
        document.getElementById(`quantity-${sushi}`).innerText = order[sushi].count;
        updateOrderSummary();
    }
}

function decreaseQuantity(sushi) {
    if (order[sushi] && order[sushi].count > 0) {
        order[sushi].count -= 1;
        currentOrderTotalSushiCount -= 1;
        currentOrderTotalPrice -= order[sushi].price;
        document.getElementById(`quantity-${sushi}`).innerText = order[sushi].count;
        updateOrderSummary();
        let controls = document.getElementById(`controls-${sushi}`);
        if (order[sushi].count == 0) {
            controls.style.display = 'none';
        }
    }
}

function addBait() {
    totalPrice += 100;
    totalBait += 1;
    updateDisplay();
    document.getElementById('hidden-total-price').value = totalPrice;
    document.getElementById('hidden-total-bait').value = totalBait;
}

function orderRecommendSushi(sushi){
    document.getElementById("tab-a").checked = true;
    toggleSushiOrder(sushi);
}

// 画像の切り替え関数
function changeImage(direction) {
    const currentImage = recommend_images[currentIndex];
    currentImage.classList.remove("active");

    // フェードアウトアニメーションの追加
    if (direction === "left") {
        currentImage.classList.add("fade-out-left");
    } else {
        currentImage.classList.add("fade-out-right");
    }

    // 次の画像のインデックスを計算
    currentIndex = (direction === "left")
        ? (currentIndex + 1) % recommend_images.length
        : (currentIndex - 1 + recommend_images.length) % recommend_images.length;

    const nextImage = recommend_images[currentIndex];

    // フェードインアニメーションの追加
    if (direction === "left") {
        nextImage.classList.add("fade-in-right");
    } else {
        nextImage.classList.add("fade-in-left");
    }
    nextImage.classList.add("active");

    // アニメーション後にクラスをリセット
    setTimeout(() => {
        currentImage.classList.remove("fade-out-left", "fade-out-right","fade-in-left", "fade-in-right");
        nextImage.classList.remove("fade-out-left", "fade-out-right","fade-in-left", "fade-in-right");
    }, 500);
}

function updateDisplay() {
    document.getElementById('total-price').innerText = `合計金額:\n¥${totalPrice}`;
    document.getElementById('total-bait').innerText = `釣り餌の数:\n${totalBait}`;
    document.getElementById('turi-total-bait').innerText = `釣り餌の数: ${totalBait}`;
    sessionStorage.setItem('totalPrice', totalPrice);
    sessionStorage.setItem('totalBait', totalBait);
}


function updateOrderSummary() {
    let orderSummary = document.getElementById('order-summary');
    let currentOrderTotal = document.getElementById('current-order-total-price');
    document.getElementById('kaikei-total').innerText = `合計金額: ¥${totalPrice}`;
    document.getElementById('amari-bait').innerText = `あまった釣り餌の数 x ${totalBait} ー¥${totalBait * 100}`;
    finalkaikei = totalPrice - (totalBait * 100);
    document.getElementById('final-kaikei').innerText =`お会計金額: ¥ ${finalkaikei}`;
    let orderTotal = document.getElementById('order-total-price');
    orderSummary.innerHTML = '';
    let total = 0;

    for (let sushi in order) {
        if (order[sushi].count > 0) {
            let item = document.createElement('div');
            item.innerText = `${sushi} x ${order[sushi].count} - ¥${order[sushi].price * order[sushi].count}`;
            orderSummary.appendChild(item);
            total += order[sushi].price * order[sushi].count;
        }
    }

    currentOrderTotal.innerText = currentOrderTotalPrice;
    orderTotal.innerText = totalPrice + currentOrderTotalPrice;
}

function updateHistorySummary() {
    document.getElementById('history-summary').innerHTML = '';
    let table = document.createElement('table');
    table.classList.add('historyTableStyle');
    for (let items in historyTable){
        let  historyTimes = document.createElement('tr');
        let numTimes = document.createElement('td')
        numTimes.textContent = `${Number(items)+1}回目: `;
        historyTimes.appendChild(numTimes);
        for (let sushi in historyTable[items]) {
            if (historyTable[items][sushi].count > 0) {
                let item = document.createElement('td');
                item.textContent = `${sushi} x ${historyTable[items][sushi].count}`;
                item.classList.add('historyItemStyle');
                historyTimes.appendChild(item);
            }
        }
        table.appendChild(historyTimes)
    }
    document.getElementById('history-summary').appendChild(table);
}

function openSlideMenu(id) {
    updateOrderSummary();
    updateHistorySummary();
    document.getElementById(id).classList.add('open');
}

function closeSlideMenu(id) {
    document.getElementById(id).classList.remove('open');
}

function confirmOrder() {
    totalPrice += currentOrderTotalPrice;
    sendOrderData(order)
    currentOrderTotalPrice = 0;
    currentOrderTotalSushiCount = 0;
    for (let sushi in order) {
        let controls = document.getElementById(`controls-${sushi}`);
        controls.style.display = 'none';
    }
    if(Object.keys(order).length){
        historyTable[numOrder] = order;
        numOrder += 1;
    }
    order = {};
    closeSlideMenu('slide-menu');
    updateDisplay();
    document.getElementById('hidden-total-price').value = totalPrice;
}

function resettotal(){
    totalPrice = 0;
    totalBait = 0;
    closeSlideMenu('kaikei');
    updateDisplay();
    historyTable = [];
    numOrder = 0;
    sessionStorage.removeItem('totalPrice');
    sessionStorage.removeItem('totalBait');
}

function sendOrderData(orderData) {
    fetch('/send_order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
    .then(response => response.json())
    .then(data => console.log("Order sent successfully:", data))
    .catch(error => console.error("Error sending order:", error));
}

function sendMessage(message) {
    fetch('/accept_message',  {     
       method: 'POST',
       headers: {
           'Content-Type': 'application/json'
       },
       body: JSON.stringify({ message: message })
   })
   .then(response => response.json())
   .then(data => console.log("Order sent successfully:", data))
   .catch(error => console.error("Error sending order:", error));
}

const slots = [
    document.getElementById('slot1').getElementsByTagName('img')[0],
    document.getElementById('slot2').getElementsByTagName('img')[0],
    document.getElementById('slot3').getElementsByTagName('img')[0]
];
var symbols = [
    '/static/images/maguro.png',
    '/static/images/ika.png',
    '/static/images/uni.png',
    '/static/images/ebi.png',
    '/static/images/ikura.png',
    '/static/images/tamago.png'
];
let initialSpeed = 100; // 初期スピード
let slotTimers = [];
let isSpinning = [false, false, false]; // 各リールの状態を管理
let speeds = [initialSpeed, initialSpeed, initialSpeed]; // 各リールのスピードを独立して管理

//スロットを開始する時に餌を消費するのとスロット中に回しなおしができないようにする
function startSlot(){
if (totalBait > 0 && !isSpinning.includes(true)) {
    console.log("start slot");
    totalBait -= 1;
    document.getElementById('hidden-total-bait').value = totalBait;
    slotrole()
    updateDisplay();
}
}

// スロットを開始する関数
function slotrole() {
    document.getElementById('result').textContent = ''; // 結果をクリア
    for (let i = 0; i < slots.length; i++) {
        if (!isSpinning[i]) {
            isSpinning[i] = true;
            speeds[i] = initialSpeed; // 各リールのスピードを初期化
            slotTimers[i] = setInterval(() => {
                slots[i].src = symbols[Math.floor(Math.random() * symbols.length)];
            }, speeds[i]);
        }
    }
}

// スロットを停止する関数（リールごと）
function stopSlot(reelIndex) {
    if (isSpinning[reelIndex]) {
        clearInterval(slotTimers[reelIndex]);
        isSpinning[reelIndex] = false;

        // 他のリールのスピードを遅くする
        for (let i = 0; i < slots.length; i++) {
            if (isSpinning[i]) {
                // スピードを増やして遅くする
                speeds[i] += 200;
                clearInterval(slotTimers[i]); // 既存のタイマーをクリア
                slotTimers[i] = setInterval(() => {
                    slots[i].src = symbols[Math.floor(Math.random() * symbols.length)];
                }, speeds[i]); // 更新されたスピードで再度タイマーを設定
            }
        }

        // 全てのリールが停止したら結果を判定
        if (!isSpinning.includes(true)) {
            checkResult();
        }
    }
}

// 結果の判定関数
function checkResult() {
    const result = slots.map(slot => slot.src.split('/').pop()); // 画像ファイル名を取得
    if (result[0] === result[1] && result[1] === result[2]) {
        document.getElementById('result').textContent = '大当たり！';
    } else {
        document.getElementById('result').textContent = '残念！';
    }
}

// イベントリスナーをボタンに追加
document.getElementById('startButton').addEventListener('click', startSlot);
document.getElementById('stopButton1').addEventListener('click', () => stopSlot(0));
document.getElementById('stopButton2').addEventListener('click', () => stopSlot(1));
document.getElementById('stopButton3').addEventListener('click', () => stopSlot(2));
