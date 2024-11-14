import socket
import pickle

def request_inference_from_server():
    # サーバーに接続
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 12345))

    sock.sendall(b'request')

    # サーバーからデータを受信
    data = sock.recv(4096)  # 受信バッファのサイズに応じて調整
    coord_data = pickle.loads(data)  # デシリアライズして座標とクラス名を取得
    print(coord_data)

    # 結果を表示
    for item in coord_data:
        print(f"クラス: {item['label']}, 座標: ({item['x1']}, {item['y1']}), ({item['x2']}, {item['y2']}), 信頼度: {item['confidence']}")

    sock.close()

# 実行
request_inference_from_server()
