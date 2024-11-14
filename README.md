# BasicReserch_4H-A_2024
-web_app&control.py- webサーバーの起動とyoloとの通信、ロボットアーム・ハンドを制御するプログラムです。
-dobot.py- dobot通信用の関数が入ったプログラムです。
-static- web用のcss,js,画像が入ってます。
-templates- web用のhtmlが入ってます。
-yolov5- 画像検出プログラムが入ってます。
-RPI_4- RPI4で動作するレーン制御プログラムが入っています。
-RPI_pico- RPIpicoで動作するサーボ制御プログラムが入っています。

# 動作概要
DobotM1 studio上でserver.pyを実行、RPI4上でlane_control.pyを実行、RPIpico上でservo_control.pyを実行したうえでweb_app&control.pyを実行すると動きます。ハードのセッティング、ライブラリのインポートなどは割愛します。
