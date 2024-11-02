import socket
import time
import pickle
import dobot
import logging
import math
import json
from flask import Flask, request, render_template, session, jsonify
from waitress import serve
import threading

env_Dobot = True #webappだけ動かすときはFalse

# Initial value setting
detection_img_size = 640 #square 640 * 640
cam_frame_size = {"x" : 16, "y" : 9} #please set x > y
position_cam = {"x" : -180, "y" : 250, "z" : 850}
theta_x0 = math.radians(26) # cam_degree, dobot_x
diagonal_angle_views = math.radians(55)
angles_of_view = {"horizontal" : diagonal_angle_views * cam_frame_size["x"] / (math.sqrt(cam_frame_size["x"] ** 2 + cam_frame_size["y"] ** 2)), 
                  "vertical" : diagonal_angle_views * cam_frame_size["y"] / (math.sqrt(cam_frame_size["x"] ** 2 + cam_frame_size["y"] ** 2))}
initial_position = {"x" : 400, "y" : 0, "z" : 100, "r" : 0}
catch_position_z = {"sushi" : 65, "plate" : 52}
release_position = {"sushi" : {"x" : 200, "y" : -300, "z" : 150, "r" : 90},
                    "plate" : {"x" : 200, "y" : -300, "z" : 150, "r" : 90}}
angles_of_servo = {"open" : 60, "sushi_close" : 135, "plate_close" : 100}
number_of_plates = 7
thickness_of_plate = 4.25
position_plate = {"x" : 300, "y" : 0}
sushis_to_get = {}

# Details of each servers
detection_server_host = '127.0.0.1'
detection_server_port = 55580
dobot_server_host = '10.133.3.222'
dobot_server_port = 7087
pico_server_host = '192.168.137.114'
pico_server_port = 8851
rpi4_server_host = '10.133.6.123'
rpi4_server_port = 8861
client_sockets = {}
#dobotは接続方法が異なるので除外
sock_info = {"detection_client_sock" : [detection_server_host, detection_server_port],
             "pico_client_sock" : [pico_server_host, pico_server_port], 
             "rpi4_client_sock" : [rpi4_server_host, rpi4_server_port]}

app = Flask(__name__)
app.secret_key = 'your_secret_key'

orderable_sushis = ['マグロ', 'イカ', 'エビ', 'イクラ', 'ウニ', 'たまご']

money_sushis = {
    'マグロ': '300',
    'イカ': '150',
    'エビ': '200',
    'イクラ': '400',
    'ウニ': '500',
    'たまご': '100'
}

sushis = ['マグロ', 'イカ', 'エビ', 'イクラ', 'ウニ', 'たまご', 'ゴミ']
fish_images = {
    'マグロ': 'maguro.png',
    'イカ': 'ika.png',
    'エビ': 'ebi.png',
    'イクラ': 'ikura.png',
    'ウニ': 'uni.png',
    'たまご': 'tamago.png',
    'ゴミ': 'gomi.png'
}

conversion_table = {
    'maguro' : 'マグロ',
    'ika' : 'イカ',
    'ebi' : 'エビ',
    'ikura' : 'イクラ' ,
    'uni' : 'ウニ',
    'tamago' : 'たまご',
    'gomi' : 'ゴミ' 
}

@app.route('/')
def order():
    total_price = session.get('total_price', 0)
    total_bait = session.get('total_bait', 0)
    
    fishable_sushis_json = json.dumps(sushis)
    fishable_sushis_img_json = json.dumps(fish_images)

    return render_template('order.html',
                           money_sushis=money_sushis, 
                           orderable_sushis=orderable_sushis, 
                           total_price=total_price, 
                           total_bait=total_bait, 
                           fish_images=fish_images, 
                           sushis=sushis,
                           fishable_sushis_json=fishable_sushis_json, 
                           fishable_sushis_img_json=fishable_sushis_img_json)

@app.route('/send_order', methods=['POST'])
def send_order():
    global sushis_to_get, client_sockets
    order_data = request.json
    print (order_data)
    if env_Dobot:
        for sushi, data in order_data.items():  # `.items()`でキーと値を取得
            sushis_to_get[sushi] = data["count"]
        message = "request"
        client_sockets["detection_client_sock"].sendall(message.encode('utf-8'))

    return jsonify({'status': 'Order sent to image detection program'}), 200


# Function to process 
def process_control():
    connect_with_server()

    hand_control(angles_of_servo["open"])
    global client_sockets
    client_sockets["dobot_client_sock"].wait(2000)
    client_sockets["dobot_client_sock"].jump_to(x = initial_position["x"], y = initial_position["y"], z = initial_position["z"], r = initial_position["r"])
    
    while True:
        try:
            # Receive a message from the server
            response = client_sockets["detection_client_sock"].recv(4096)
            # If no response, break and retry the connection
            if not response:
                print(f"No response from {detection_server_host}, retrying...")
                continue

            arm_control(response)

        except socket.timeout:
            print(f"Timeout from {detection_server_host}, retrying...")
            # connect with server
            try:
                detection_client_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                detection_client_sock.connect((detection_server_host, detection_server_port))
                detection_client_sock.settimeout(120)
                print(f"Connected to {detection_server_host}:{detection_server_port}")
            except Exception as e:
                print(f"Error connecting to {detection_server_host}:{detection_server_port}: {e}")
            finally:
                detection_client_sock.close()
                time.sleep(3)  # Wait before attempting to reconnect
            continue  # Retry the connection after timeout

def connect_with_server():
    for sock_name in sock_info:
        while True:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.connect((sock_info[sock_name][0], sock_info[sock_name][1]))  # (server_host, server_port)
                sock.settimeout(120)
                client_sockets[sock_name] = sock  # ソケットオブジェクトを新しい辞書に格納
                print(f"Connected to {sock_info[sock_name][0]}:{sock_info[sock_name][1]} ({sock_name})")
                break
            except Exception as e:
                print(f"Error connecting to {sock_info[sock_name][0]}:{sock_info[sock_name][1]} ({sock_name}): {e}")
                continue

    logging.basicConfig(format='[%(levelname)s] %(asctime)s: %(message)s')
    logging.getLogger('DobotCommandSender').setLevel(logging.DEBUG)

    dobot_client_sock = dobot.CommandSender(dobot_server_host,dobot_server_port)
    dobot_client_sock.set_cordinate_speed(velocity=20,jerk=3)
    dobot_client_sock.set_jump_pram(height=10,zlimit=185)
    dobot_client_sock.arm_orientation(mode=1) # 0=Left 1=Right
    client_sockets["dobot_client_sock"] = dobot_client_sock

def hand_control(angle):
    client_sockets["pico_client_sock"].sendall(f"{angle}\n".encode('utf-8'))
    response = client_sockets["pico_client_sock"].recv(1024).decode('utf-8')
    print(f"Server response: {response.strip()}")

def arm_control(response):
    global sushis_to_get
    send_position_table = []
    num_of_sushi_to_move = 0
    coord_data = pickle.loads(response)
    for item in coord_data:
        print(item)
        if conversion_table[item["label"]] in sushis_to_get and sushis_to_get[conversion_table[item["label"]]] > 0:
            #画像中央を原点とした座標系に写す(-180 <= x_relative <= 180, -320 <= y_relative <= 320)
            x_relative = -((int(item['y1']) + int(item['y2'])) / 2 - (detection_img_size * (cam_frame_size["y"] / cam_frame_size["x"]) / 2))
            y_relative = (int(item['x1']) + int(item['x2'])) / 2 - (detection_img_size / 2)
            #画面の座標をカメラ中央からの角度に写す
            theta_scale = { "x" : math.tan(angles_of_view["vertical"] / 2), 
                            "y" : math.tan(angles_of_view["horizontal"] / 2)}
            theta = {"x" : math.atan((x_relative / (detection_img_size * (cam_frame_size["y"] / cam_frame_size["x"]) / 2)) * theta_scale["x"]), 
                        "y" : math.atan((y_relative / (detection_img_size / 2)) * theta_scale["y"])}

            position_to_send = {"x" : (position_cam["x"] + position_cam["z"] * math.tan(theta_x0 + theta["x"])), 
                                "y" : (position_cam["y"] + position_cam["z"] * math.tan(-theta["y"])), 
                                "z" : catch_position_z["sushi"], 
                                "r" : 0}

            print(f"クラス: {item['label']}, 座標: ({position_to_send['x']}, {position_to_send['y']}), 信頼度: {item['confidence']}")
            if not ((position_to_send["x"] ** 2 + position_to_send["y"] ** 2) < (400 ** 2)):
                print("out of the Dobot's range")
                continue
            sushis_to_get[conversion_table[item["label"]]] -= 1

            send_position_table.append(position_to_send)

    for position in send_position_table:
        num_of_sushi_to_move += 1
        print(len(send_position_table))
        place_plate()
        client_sockets["dobot_client_sock"].jump_to(x = int(position["x"]), y = int(position["y"]), z = int(position["z"]), r = int(position["r"]))
        hand_control(angles_of_servo["sushi_close"])
        client_sockets["dobot_client_sock"].wait(1000)

        client_sockets["dobot_client_sock"].jump_to(x = release_position["sushi"]["x"], y = release_position["sushi"]["y"], z = release_position["sushi"]["z"], r = release_position["sushi"]["r"])
        hand_control(angles_of_servo["open"])

        if num_of_sushi_to_move < len(send_position_table):
            print("lap_top - advance_one_plate")
            lane_control("advance_one_plate")
        else:
            lane_control("advance_plate_for_guest")
            num_of_sushi_to_move = 0

def place_plate():
    global number_of_plates,client_sockets
    z_plate = catch_position_z["plate"] + thickness_of_plate * number_of_plates
    client_sockets["dobot_client_sock"].jump_to(x = position_plate["x"], y = position_plate["y"], z = int(z_plate), r = 0)
    hand_control(angles_of_servo["plate_close"])
    client_sockets["dobot_client_sock"].jump_to(x = release_position["plate"]["x"], y = release_position["plate"]["y"], z = release_position["plate"]["z"], r = release_position["plate"]["r"])
    hand_control(angles_of_servo["open"])
    number_of_plates -= 1
    client_sockets["dobot_client_sock"].wait(1000)

def lane_control(lane_massege):
    client_sockets["rpi4_client_sock"].sendall(f"{lane_massege}\n".encode('utf-8'))

if __name__ == '__main__':
    if env_Dobot:
        threading.Thread(target=process_control).start()
    serve(app, host='127.0.0.1', port=5000, threads=8)