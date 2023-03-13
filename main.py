# -*- coding: utf-8 -*-
import base64
import io
import json
import random
import time

import pyautogui as pg
import requests
from PIL import Image
from flask import Flask, g
from win32gui import *

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

# 配置信息，需自行修改
# Hamibot 开发者token
hamibot_token = ''
# Hamibot 机器人id
hamibot_robot_id = ''
# Hamibot 机器人名称
hamibot_robot_name = ''
# Hamibot 脚本id
hamibot_script = ''
# 百度client_id
baidu_client_id = ''
# 百度client_secret
baidu_client_secret: ''


# 运行hamibot
def run_script(max_count=10):
    if pg.locateOnScreen(r"resource/img/xuexi.png"):
        headers = {
            'authorization': hamibot_token,
            'contentType': 'application/json'
        }
        data = {
            'robots': [{'_id': hamibot_robot_id, 'name': hamibot_robot_name}]
        }
        requests.post('https://hamibot.cn/api/v1/devscripts/' + hamibot_script + '/run', json=data, headers=headers)
        print('运行hamibot成功！')
    elif max_count > 0:
        print("未检测到目标...，将继续重试%s次" % (max_count - 1))
        time.sleep(random.randint(5, 10))
        run_script(max_count - 1)


def screenshot():
    x_start, y_start, x_end, y_end = get_window_xy_info()
    return pg.screenshot(region=(x_start + 28, y_start + 332, 495, 640))


# 获取用户token
def get_baidu_token():
    response = requests.post(
        "https://aip.baidubce.com/oauth/2.0/token",
        {
            'grant_type': "client_credentials",
            'client_id': baidu_client_id,
            'client_secret': baidu_client_secret,
        }
    )
    return (json.loads(response.content.decode()))['access_token']


#
# 百度ocr接口，传入图片返回文字和选项文字
# @param {image} img 传入图片
# @returns {string} question 文字
# @returns {list[string]} options_text 选项文字
#
def baidu_ocr_api(img):
    options_text = []
    question = ""
    b = io.BytesIO()
    img.save(b, 'jpeg')
    response = requests.post(
        "https://aip.baidubce.com/rest/2.0/ocr/v1/general",
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data={
            'access_token': get_token(),
            'image': base64.b64encode(b.getvalue()).decode('utf-8'),
        }
    )
    words_list = json.loads(response.content.decode())['words_result']
    print(words_list)
    if (words_list):
        # question是否读取完成的标志位
        question_flag = False
        for i in range(len(words_list)):
            if not question_flag:
                # 如果是选项则后面不需要加到question中
                if (words_list[i]['words'][0] == "A"):
                    question_flag = True
                # 将题目读取到下划线处，如果读到下划线则不需要加到question中
                # 利用location之差判断是否之中有下划线
                # location:
                # 识别到的文字块的区域位置信息，列表形式，
                # location["left"]
                # 表示定位位置的长方形左上顶点的水平坐标
                # location["top"]
                # 表示定位位置的长方形左上顶点的垂直坐标
                #
                if words_list[0]['words'].find(".") != -1 and i > 0 and abs(
                        words_list[i]['location']["left"] - words_list[i - 1]['location']["left"]) > 100:
                    question_flag = True
                if not question_flag:
                    question += words_list[i]['words']
                # 如果question已经大于25了也不需要读取了
                if len(question) > 25:
                    question_flag = True
            # 这里不能用else，会漏读一次
            if question_flag and len(words_list[i]['words']) > 1 and words_list[i]['words'][1] == ".":
                # 其他的就是选项了
                options_text.append(words_list[i]['words'][2:])
    # 处理question
    question = question.replace('*', "")
    question = question.replace(',', "，")
    question = question.replace('-', "－")
    question = question.replace('(', "（")
    question = question.replace(')', "）")
    question = question[question.find(".") + 1:]
    question = question[0:25]
    return [question, options_text]


def get_window_xy_info():
    name = '夜神模拟器'
    window = FindWindow(0, name)  # 根据窗口名称获取窗口对象
    x_start, y_start, x_end, y_end = GetWindowRect(window)
    # 坐标信息
    return x_start, y_start, x_end, y_end


def get_token():
    token = getattr(g, '_token', None)
    if token is None:
        g._token = get_baidu_token()
    print('token: %s' % (g._token))
    return g._token


@app.route('/ocr')
def ocr():
    img = screenshot()
    name = time.time()
    img.save('data/' + str(name) + '.jpeg')
    image = Image.open('data/' + str(name) + '.jpeg')
    return baidu_ocr_api(image)


if __name__ == '__main__':
    app.run(host='0.0.0.0')
