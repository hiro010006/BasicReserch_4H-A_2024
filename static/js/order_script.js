let totalPrice = parseInt(sessionStorage.getItem('totalPrice')) || parseInt(document.getElementById('hidden-total-price').value);
let totalBait = parseInt(sessionStorage.getItem('totalBait')) || parseInt(document.getElementById('hidden-total-bait').value);
let currentOrderTotalPrice = 0;
let currentOrderTotalSushiCount = 0;
let order = {};
const orderLimit = 3;
var historyTable = [];
let numOrder = 0;;

const money_sushis = {
    'マグロ': 300,
    'イカ': 150,
    'エビ': 200,
    'イクラ': 400,
    'ウニ': 500,
    'たまご': 100
}

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
        order[sushi] = { count: 0, price: money_sushis[sushi] };
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
    document.getElementById('start-fishing').disabled = false;
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



// 釣り画面
function fishTheSushi() {
    if (totalBait > 0) {
        totalBait -= 1;
        document.getElementById('hidden-total-bait').value = totalBait;
        updateDisplay();

        // JSONパース
        let fishableSushis = JSON.parse(document.getElementById('hidden-fishable-sushis').value);
        let fishableSushisImg = JSON.parse(document.getElementById('hidden-fishable-sushis-img').value);

        var randomNum = Math.floor(Math.random() * fishableSushis.length);
        var caughtFish = fishableSushis[randomNum];
        var caughtFishImg = fishableSushisImg[caughtFish];
        var strOfP = `<p id="caught-fish-text">釣れた魚: ${caughtFish}</p>`;
        var strOfImg = `<img id="fish-img" src="/static/images/${caughtFishImg}" alt="釣れた魚">`;

        document.getElementById('fish-container').innerHTML = strOfP + strOfImg;
    }
}
