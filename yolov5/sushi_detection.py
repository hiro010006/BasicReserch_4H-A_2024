import socket
import cv2
import torch
from pathlib import Path
from models.common import DetectMultiBackend
from utils.general import (check_img_size, non_max_suppression, scale_boxes)
from utils.torch_utils import select_device
import pickle
import datetime
import time

# モデル初期化関数
def initialize_model(weights='best.pt', device='', imgsz=(640, 640)):
    device = select_device(device)
    model = DetectMultiBackend(weights, device=device)
    stride, names, pt = model.stride, model.names, model.pt
    imgsz = check_img_size(imgsz, s=stride)
    model.warmup(imgsz=(1 if pt or model.triton else 1, 3, *imgsz))
    return model, stride, names, imgsz

# フレーム処理関数
def process_frame(model, frame, stride, imgsz, device, conf_thres=0.25, iou_thres=0.45):
    im = torch.from_numpy(frame).to(device)
    im = im.permute(2, 0, 1).unsqueeze(0)  # (3, height, width) -> (1, 3, height, width)
    im = im.half() if model.fp16 else im.float()
    im /= 255.0

    # 推論実行
    pred = model(im)
    pred = non_max_suppression(pred, conf_thres, iou_thres)

    # 推論結果を取得
    result = []
    for det in pred:  # ここで各バッチごとに処理
        if det is not None and len(det):
            for *xyxy, conf, cls in det:  # 検出結果がある場合
                x1, y1, x2, y2 = map(int, xyxy)  # 座標を整数に変換
                label = model.names[int(cls)]  # クラス名を取得
                confidence = float(conf)  # 信頼度をfloatに変換

                # 結果を辞書形式に整形
                result.append({
                    "label": label,
                    "confidence": confidence,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                })
        else:
            print(f"{datetime.datetime.now()}No detections in this frame.")  # 検出なしのログ出力

    return result

# ソケット通信のセットアップ
def start_server(host='localhost', port=55580):
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.bind((host, port))
    server_socket.listen(1)
    print(f"{datetime.datetime.now()}Listening on {host}:{port}")

    # モデルの初期化
    model, stride, names, imgsz = initialize_model()

    # Webカメラのセットアップ
    cap = cv2.VideoCapture(0)  # サーバー側のWebカメラ (0はカメラデバイスID)

    while True:
        client_socket = None
        try:
            client_socket, addr = server_socket.accept()  # 新しい接続を受け入れる
            print(f"{datetime.datetime.now()}Connection from {addr}")

            while True:  # 接続が続く限りクライアントを処理
                # クライアントからリクエストを受信
                data = client_socket.recv(4096)  # クライアントから何らかのリクエストを受け取る
                if not data:
                    print(f"{datetime.datetime.now()}Client disconnected or no data received.")
                    break  # ループを抜けて新しい接続を待つ

                # Webカメラからフレームをキャプチャ
                ret, frame = cap.read()
                if not ret:
                    print(f"{datetime.datetime.now()}Failed to capture image from camera.")
                    break

                # 推論の実行
                pred = process_frame(model, frame, stride, imgsz, model.device)

                # 結果をクライアントに送信
                client_socket.send(pickle.dumps(pred))
                print(f"{datetime.datetime.now()}Sent prediction data to client.")

                time.sleep(1)

        except Exception as e:
            print(f"{datetime.datetime.now()}Error: {e}")
        finally:
            if client_socket:
                client_socket.close()  # クライアントソケットを確実に閉じる
            print(f"{datetime.datetime.now()}Waiting for a new connection...")  # 新しい接続を待つ

if __name__ == "__main__":
    start_server()
