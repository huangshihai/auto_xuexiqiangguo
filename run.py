# -*- coding: utf-8 -*-
import os
import random
import time

import pyautogui
import pyperclip
import requests
from pykeyboard import PyKeyboard
from win32gui import *

token = 'hmp_be84c756a45b5c98356fd12f39e46e012ac5b2ad44ae2a946dded13cd4da880e'
robot_id = '637cf0e024a95db0b0524cff'
robot_name = '安卓模拟器'
script = '625902b792717487d6e50f73'


def open_android():
    os.startfile("C:/Users/huangsh/Desktop/夜神模拟器.lnk")


def run_save(max_count=10):
    if pyautogui.locateOnScreen(r"resource/img/xuexi.png"):
        headers = {
            'authorization': token,
            'contentType': 'application/json'
        }
        data = {
            'robots': [{'_id': robot_id, 'name': robot_name}]
        }
        requests.post('https://hamibot.cn/api/v1/devscripts/' + script + '/run', json=data, headers=headers)
        print('运行hamibot成功！')
    elif max_count > 0:
        print("未检测到目标...，将继续重试%s次" % (max_count - 1))
        random_sleep(5, 10)
        run_save(max_count - 1)


def click(img_name, max_count=10):
    time.sleep(2)  # 这个可以用来防止操作过快
    if pyautogui.locateOnScreen(r"resource/img/" + img_name + ".png"):
        left, top, width, height = pyautogui.locateOnScreen(r"resource/img/" + img_name + ".png")  # 寻找运行hamibot的图标
        center = pyautogui.center((left, top, width, height))  # 寻找图片的中心
        pyautogui.click(center)
        print('运行' + img_name + '成功！')
    elif max_count > 0:
        print("未检测到目标...，将继续重试%s次" % (max_count - 1))
        random_sleep(5, 10)
        click(img_name, max_count - 1)


def type_password():
    keyboard = PyKeyboard()
    random_sleep()
    pyperclip.copy('yuying123456')  # 复制密码
    print("复制密码成功")
    keyboard.press_key(keyboard.control_key)  # 按下Ctrl键
    keyboard.tap_key('v')  # 点击V键
    keyboard.release_key(keyboard.control_key)  # 松开Ctrl键
    print("输入密码完成")


def createRandomPath(x_start, y_start, x_end, y_end):
    # 最小水平增量
    x_move_min = - int((x_end - x_start) / 20)
    x_move_max = int((x_end - x_start) / 10)
    position_list = []
    # 开始节点
    index = 0
    left_max_count = 3
    left_count = 0
    position_list.append({'x': x_start, 'y': y_start})
    # 插入点
    while position_list[index]['x'] < x_end:
        # 横坐标
        flag = random.randint(x_move_min, x_move_max)
        x = position_list[index]['x'] + flag
        while x < x_start + 10:
            flag = random.randint(x_move_min, x_move_max) + x_move_min
            x = position_list[index]['x'] + flag
        # 纵坐标
        y = random.randint(y_start, y_end)
        if position_list[index]['x'] > x:
            left_count += 1
        if left_count >= left_max_count:
            x_move_min = 0
        position_list.append({
            'x': x, 'y': y
        })
        index += 1
    return position_list


def get_window_xy_info():
    name = '夜神模拟器'
    window = FindWindow(0, name)  # 根据窗口名称获取窗口对象
    x_start, y_start, x_end, y_end = GetWindowRect(window)
    # SetForegroundWindow(window)
    # 坐标信息
    return x_start, y_start, x_end, y_end


def random_sleep(min_time=2, max_time=5):
    time.sleep(random.randint(min_time, max_time))


def init():
    # 启动安卓模拟器
    open_android()
    random_sleep()
    # 启动hamibot
    click("hamibot")
    random_sleep()
    # 返回桌面
    click("home")
    random_sleep()
    # 启动学习强国
    click("xxqg")
    random_sleep(4, 7)
    # 点击密码框
    click("password")
    random_sleep()
    # 输入密码
    type_password()
    random_sleep()
    # 登录
    click("login")
    random_sleep(4, 7)
    # 运行脚本
    run_save()


if __name__ == '__main__':
    run_save()
