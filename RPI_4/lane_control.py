import RPi.GPIO as GPIO
import time
import socket

# Define pin numbers in BCM mode
PIN_nSleep = 18
PIN_AIN1 = 23
PIN_AIN2 = 24
PIN_SERVO = 12  # Signal pin for the servo motor (MG996R)

# Servo parameters
SERVO_FREQUENCY = 50  # Frequency for MG996R (50Hz)
MIN_DUTY = 2.5        # 0 degrees
MAX_DUTY = 12.5       # 180 degrees

# Socket communication settings
HOST = '10.133.6.123'
PORT = 8861

# GPIO setup
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_nSleep, GPIO.OUT)
GPIO.setup(PIN_AIN1, GPIO.OUT)
GPIO.setup(PIN_AIN2, GPIO.OUT)
GPIO.setup(PIN_SERVO, GPIO.OUT)

# Motor rotation functions
def rotateFoward(duration):
    GPIO.output(PIN_AIN1, GPIO.HIGH)
    GPIO.output(PIN_AIN2, GPIO.LOW)
    time.sleep(duration)
    GPIO.output(PIN_AIN1, GPIO.LOW)

def rotateBack(duration):
    GPIO.output(PIN_AIN1, GPIO.LOW)
    GPIO.output(PIN_AIN2, GPIO.HIGH)
    time.sleep(duration)
    GPIO.output(PIN_AIN2, GPIO.LOW)

def advanceOnePlate():
    rotateFoward(1.5)

def advancePlateForGuest():
    rotateFoward(4)

def collectPlate():
    rotateFoward(8)

# Servo motor function
servo_pwm = GPIO.PWM(PIN_SERVO, SERVO_FREQUENCY)
servo_pwm.start(0)

def rotateServo():
    # Rotate to 180 degrees
    servo_pwm.ChangeDutyCycle(MAX_DUTY)
    time.sleep(0.5)  # Delay for rotation
    # Rotate back to 0 degrees
    servo_pwm.ChangeDutyCycle(MIN_DUTY)
    time.sleep(0.5)
    # Stop PWM
    servo_pwm.ChangeDutyCycle(0)

# Enable motor driver
GPIO.output(PIN_nSleep, GPIO.HIGH)

# Server socket setup
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
    server_socket.bind((HOST, PORT))
    server_socket.listen()
    print(f"Waiting for a connection on {HOST}:{PORT}...")

    while True:
        # Accept client connection
        conn, addr = server_socket.accept()
        with conn:
            print(f"Connected by {addr}")
            try:
                while True:
                    data = conn.recv(1024).decode('utf-8')
                    if not data:
                        break

                    # Control based on received data
                    if data == "advance_one_plate":
                        advanceOnePlate()
                        conn.sendall(b'Advanced one plate')
                    elif data == "advance_plate_for_guest":
                        advancePlateForGuest()
                        conn.sendall(b'Advanced plate for guest')
                    elif data == "collect_plate":
                        collectPlate()
                        conn.sendall(b'Collected plate')
                    elif data == "serve_plate":
                        rotateServo()
                        conn.sendall(b'Served plate')
                    else:
                        conn.sendall(b'Unknown command')
            except KeyboardInterrupt:
                pass
            finally:
                GPIO.cleanup()
