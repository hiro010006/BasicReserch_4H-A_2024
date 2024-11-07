let totalPrice = parseInt(sessionStorage.getItem('totalPrice')) || parseInt(document.getElementById('hidden-total-price').value);
let totalBait = parseInt(sessionStorage.getItem('totalBait')) || parseInt(document.getElementById('hidden-total-bait').value);
let currentOrderTotalPrice = 0;
let currentOrderTotalSushiCount = 0;
let order = {};
const orderLimit = 3;
var historyTable = [];
let numOrder = 0;
lang = "jp"

let sushiInfo = JSON.parse(document.getElementById('hidden-sushi-info').value);

const sushiInfoByImg = Object.fromEntries(
    Object.entries(sushiInfo).map(([key, value]) => [value.img_path, key])
);
/*sushiInfoByImgの中身の構造は以下の通り
{
    "maguro.png": "maguro",
    "ika.png": "ika",
    "ebi.png": "ebi",
    "ikura.png": "ikura",
    "uni.png": "uni",
    "tamago.png": "tamago"
}
*/
// 言語設定を取得して日本語か英語の表示を切り替え
const language = navigator.language.startsWith('ja') ? 'jp' : 'en';

// sushi-nameクラスを持つ全ての要素を更新
document.querySelectorAll('.sushi-name').forEach(function (element) {
    const nameJP = element.getAttribute('data-sushi-name-jp');
    const nameEN = element.getAttribute('data-sushi-name-en');
    element.textContent = (language === 'jp') ? nameJP : nameEN;
});

const recommend_sushi_paths = {
    "uni": "/static/images/recommend_uni.png",
    "ikura": "/static/images/recommend_ikura.png"
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
    document.getElementById('total-bait').innerText = `釣りコイン:\n${totalBait}`;
    document.getElementById('turi-total-bait').innerText = `釣りコイン: ${totalBait}`;
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
            item.innerText = `${sushiInfo[sushi]["name"][lang]} x ${order[sushi].count} - ¥${order[sushi].price * order[sushi].count}`;
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
                item.textContent = `${sushiInfo[sushi]["name"][lang]} x ${historyTable[items][sushi].count}`;
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

let slotTimers = [];
let isSpinning = [false, false, false]; // 各リールの状態を管理
let speed = 100;  // 各リールのスピードを独立して管理

var role = new Audio("/static/music/roling.mp3");
var atari = new Audio("/static/music/omedetou.mp3");
var hazure = new Audio("/static/music/hazure.mp3");
var stopRole = new Audio("/static/music/stop.mp3");
var start = new Audio("/static/music/start.mp3");
var reach = new Audio("/static/music/reach.mp3");
let startDel = document.getElementById('startButton');
let slotRole1 = document.getElementById('slotbox1');
let slotRole2 = document.getElementById('slotbox2');
let slotRole3 = document.getElementById('slotbox3');
let stopButton1 = document.getElementById('stopButton1');
let stopButton2 = document.getElementById('stopButton2');
let stopButton3 = document.getElementById('stopButton3');
role.volume -= 0.5;
start.volume -= 0.7;

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
    let sushiKeys = Object.keys(sushiInfo);
    let startDel = document.getElementById('startButton');
    let slotContainer = document.getElementById('slotContainer');

    startDel.style.display = 'none';
    slotContainer.style.display = 'flex';

    document.getElementById('result').textContent = ''; // 結果をクリア
    start.play();
    for (let i = 0; i < slots.length; i++) {
        if (!isSpinning[i]) {
            isSpinning[i] = true;
            slotTimers[i] = setInterval(() => {
                let randomKey = sushiKeys[Math.floor(Math.random() * sushiKeys.length)];
                slots[i].src = `/static/images/` + sushiInfo[randomKey]["img_path"];
            }, speed);
        }
    }
}
let stoppedReels;
let stoppedReelImage;
let firstReelImage = null;  // 1回目に停止したリールの画像
var index;
var random;
var symbolsReelImage;
var firstSlot;
var secondSlot;
var thirdSlot;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// スロットを停止する関数（リールごと）
async function stopSlot(reelIndex) {
    stoppedReels = 0;
    stopRole.pause();
    stopRole.currentTime=0;
    stopRole.play();
    if (isSpinning[reelIndex]) {
        clearInterval(slotTimers[reelIndex]);
        isSpinning[reelIndex] = false;        // isSpinning配列の中でfalseの数を数える
        stoppedReels = isSpinning.filter(spin => !spin).length;
        stoppedReelImage = slots[reelIndex].src.split('/').pop();
        // 1回目の停止であれば、その画像を保存
        if (firstReelImage === null) {
            let stopButton1 = document.getElementById(`stopButton${reelIndex + 1}`);
            stopButton1.style.display = 'none';
            firstReelImage = stoppedReelImage;
            firstSlot = stoppedReelImage;
        }

        if (stoppedReels == 2 && Math.random() < 0.7){
            let stopButton2 = document.getElementById(`stopButton${reelIndex + 1}`);
            stopButton2.style.display = 'none'
            reach.pause();
            reach.currentTime=0;
            reach.play();
            slots[reelIndex].src = `/static/images/${firstReelImage}`;
            secondSlot = firstReelImage;
        }else if (stoppedReels == 2){
            let stopButton2 = document.getElementById(`stopButton${reelIndex + 1}`);
            stopButton2.style.display = 'none'
            let imgPaths = Object.values(sushiInfo).map(sushi => sushi.img_path);
            index = imgPaths;
            index = imgPaths.filter(x=> x !== firstReelImage);
            random = Math.floor(Math.random() * 5 );
            symbolsReelImage = index[random];
            slots[reelIndex].src = `/static/images/${symbolsReelImage}`;
            secondSlot = symbolsReelImage;
        }

        if (stoppedReels == 3 && Math.random() <0){
            let stopButton3 = document.getElementById(`stopButton${reelIndex + 1}`);
            stopButton3.style.display = 'none';
            slots[reelIndex].src = `/static/images/${firstReelImage}`;
        }else{
            if (stoppedReels == 3 && firstSlot == secondSlot){
                let stopButton3 = document.getElementById(`stopButton${reelIndex + 1}`);
                stopButton3.style.display = 'none'
                let imgPaths = Object.values(sushiInfo).map(sushi => sushi.img_path);
                index = imgPaths;
                index = imgPaths.filter(x=> x !== firstReelImage);
                random = Math.floor(Math.random() * 5 );
                symbolsReelImage = index[random];
                slots[reelIndex].src = `/static/images/${symbolsReelImage}`;
                if(stoppedReels == 3 && Math.random() < 1) {
                    await delay(1000);
                    for (let i = 0; i < 10; i++) {
                        slots[reelIndex].src = `/static/images/${symbolsReelImage}`;
                        await delay(100);
                        slots[reelIndex].src = `/static/images/${firstReelImage}`;
                        await delay(100);
                    }
                    await delay(1000);
                    if(Math.random() < 0.9){
                        slots[reelIndex].src = `/static/images/${firstReelImage}`;
                        stopRole.pause();
                        stopRole.currentTime=0;
                        stopRole.play();
                    }
                }
            }

        }
    }
    // 全てのリールが停止したら結果を判定
    if (!isSpinning.includes(true)) {
        await delay(1000);
        checkResult();
    }
}


// 結果の判定関数
function checkResult() {
    const result = slots.map(slot => slot.src.split('/').pop()); // 画像ファイル名を取得
    let caughtClose = document.getElementById('fish-close');
    let gomiClose = document.getElementById('gomi-close');
    let startDel = document.getElementById('startButton');
    caughtClose.style.display = 'block';
    gomiClose.style.display = 'block';
    startDel.style.display = 'block';
    let slotRole1 = document.getElementById('slotbox1');
    let slotRole2 = document.getElementById('slotbox2');
    let slotRole3 = document.getElementById('slotbox3');
    slotRole1.style.display = 'none';
    slotRole2.style.display = 'none';
    slotRole3.style.display = 'none';
  
    let stopButton2 = document.getElementById('stopButton2');
    let stopButton3 = document.getElementById('stopButton3');

    stopButton2.style.display = 'none';
    stopButton3.style.display = 'none';
    stoppedReels = 0;
    stoppedReelImage = 0;
    firstReelImage = null;

    if (result[0] === result[1] && result[1] === result[2]) {
        atari.play();

        let fishContainer = document.getElementById('fish-container');
        let slotResultImg = document.getElementById('slot-result-img');
        let confirmEatSushiButton = document.getElementById('confirm-eat-sushi-button');

        fishContainer.style.display = 'block';
        slotResultImg.src = `/static/images/${result[0]}`;
        
        sushi_key = sushiInfoByImg[result[0]]
        confirmEatSushiButton.addEventListener('click', () => winSlotAndEat(sushi_key));
    } else {
        hazure.play();

        let gomiContainer = document.getElementById('gomi-container');
        let gomiResultImg = document.getElementById('gomi-result-img');
        let confirmReturnSushiButton = document.getElementById('confirm-return-sushi-button');

        gomiContainer.style.display = 'block';
        gomiResultImg.src = `/static/images/gomi.png`;
    }
}

function closeFishContainer(){
    let fishContainer = document.getElementById('fish-container');
    let gomiContainer = document.getElementById('gomi-container');
    fishContainer.style.display = 'none';
    gomiContainer.style.display = 'none';
}

function winSlotAndEat(sushi_key){
    let slotSushiOrder = {};
    slotSushiOrder[sushi_key] = { count: 1, price: sushiInfo[sushi_key]["price"] };
    sendOrderData(slotSushiOrder);
    closeFishContainer();
}

function winSlotAndReturn(){
    totalBait += 2;
    updateDisplay();
    closeFishContainer();
}


// イベントリスナーをボタンに追加
document.getElementById('startButton').addEventListener('click', startSlot);
document.getElementById('stopButton1').addEventListener('click', () => stopSlot(0));
document.getElementById('stopButton2').addEventListener('click', () => stopSlot(1));
document.getElementById('stopButton3').addEventListener('click', () => stopSlot(2));
