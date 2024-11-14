import network
import socket
from machine import Pin, PWM
import time

# Wi-Fi のSSIDとパスワードを設定
SSID = 'pc1'
PASSWORD = 'omuctpc1'
IP_ADDRESS = '192.168.137.114'

# サーボモータの接続ピン（例として GPIO14 を使用）
SERVO_PIN = 14

# ソケットサーバーの設定
SERVER_PORT = 8851  # 任意のポート番号を指定

# Wi-Fi に接続する関数
def connect_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to network...')
        wlan.connect(ssid, password)
        while not wlan.isconnected():
            pass
    print('Network connected:', wlan.ifconfig())
    return wlan.ifconfig()[0]  # IPアドレスを返す

# サーボモータを制御するクラス
class ServoController:
    def __init__(self, pin):
        self.pwm = PWM(Pin(pin))
        self.pwm.freq(50)  # 50Hz
        self.min_duty = int(0.5 / 20 * 65535)  # 0.5ms
        self.max_duty = int(2.5 / 20 * 65535)  # 2.5ms
        self.set_angle(90)  # 初期位置を90度に設定

    def set_angle(self, angle):
        # 角度を0～180度に制限
        angle = max(0, min(180, angle))
        # 線形補間でデューティサイクルを計算
        duty = self.min_duty + (angle / 180) * (self.max_duty - self.min_duty)
        self.pwm.duty_u16(int(duty))
        print(f"Set angle to {angle} degrees (Duty: {int(duty)})")

    def deinit(self):
        self.pwm.deinit()

# メインプログラム
def main():
    # Wi-Fi に接続
    ip_address = connect_wifi(SSID, PASSWORD)
    
    # サーボコントローラーを初期化
    servo = ServoController(SERVO_PIN)
    
    # ソケットサーバーを設定
    addr = socket.getaddrinfo('0.0.0.0', SERVER_PORT)[0][-1]
    
    while True:
        s = socket.socket()  # サーバーソケットを作成
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)  # ポートの再利用を許可
        s.bind(addr)
        s.listen(1)  # 接続の待機開始
        
        print(f"Socket server listening on {ip_address}:{SERVER_PORT}")
        
        try:
            conn, addr = s.accept()  # クライアントからの接続を受け入れる
            print(f"Connected by {addr}")
            while True:
                data = conn.recv(1024)  # データ受信
                if not data:
                    break
                try:
                    angle_str = data.decode('utf-8').strip()
                    angle = int(angle_str)
                    print(f"Received angle: {angle}")
                    servo.set_angle(angle)
                    response = f"Angle set to {angle}\n"
                except ValueError:
                    response = "Invalid angle. Please send an integer between 0 and 180.\n"
                    print("Received invalid data.")
                conn.send(response.encode('utf-8'))  # クライアントにレスポンスを送信
        except OSError as e:
            print(f"Socket error: {e}")
        finally:
            conn.close()  # クライアントとの接続を閉じる
            s.close()  # サーバーソケットを閉じる
            print("Server socket closed. Restarting...")
        
if __name__ == "__main__":
    main()