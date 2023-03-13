auto.waitFor();

// 检查Hamibot版本是否支持ocr
if (app.versionName < "1.3.1") {
  toast("请到官网将Hamibot更新至v1.3.1版本或更高版本");
  exit();
}

var { delay_time } = hamibot.env;
var { four_player_battle } = hamibot.env;
var { two_player_battle } = hamibot.env;
var { ocr_url } = hamibot.env;
delay_time = Number(delay_time) * 1000;

// 本地存储数据
var storage = storages.create('data');
// 更新题库为answer_question_map3
storage.remove('answer_question_map1');
storage.remove('answer_question_map2');
storage.remove('answer_question_map3');

/**
 * 定义HashTable类，用于存储本地题库，查找效率更高
 * 由于hamibot不支持存储自定义对象和new Map()，因此这里用列表存储自己实现
 * 在存储时，不需要存储整个question，可以仅根据选项来对应question，这样可以省去ocr题目的花费
 * 但如果遇到选项为special_problem数组中的模糊词，无法对应question，则需要存储整个问题
 */

var answer_question_map = [];

var special_problem = "选择正确的读音 选择词语的正确词形 下列词形正确的是 选择正确的字形 下列词语字形正确的是";
// 当题目为这些词时，在线搜索书名号和逗号后的内容
var special_problem2 = "根据《中国共 根据《中华人 《中华人民共 根据《化妆品";
var special_problem3 = "下列选项中，";

/**
 * hash函数
 * 6469通过从3967到5591中的质数，算出的最优值，具体可以看评估代码
 */
function hash(string) {
  var hash = 0;
  for (var i = 0; i < string.length; i++) {
    hash += string.charCodeAt(i);
  }
  return hash % 6469;
}

// 存入
function map_set(key, value) {
  var index = hash(key);
  if (answer_question_map[index] === undefined) {
    answer_question_map[index] = [
      [key, value]
    ];
  } else {
    // 去重
    for (var i = 0; i < answer_question_map[index].length; i++) {
      if (answer_question_map[index][i][0] == key) {
        return null;
      }
    }
    answer_question_map[index].push([key, value]);
  }
};

// 取出
function map_get(key) {
  var index = hash(key);
  if (answer_question_map[index] != undefined) {
    for (var i = 0; i < answer_question_map[index].length; i++) {
      if (answer_question_map[index][i][0] == key) {
        return answer_question_map[index][i][1];
      }
    }
  }
  return null;
};


/**
 * 定时更新题库，通过在线访问辅助文件判断题库是否有更新
 */

var date = new Date();
var answer_question_bank_checked = http.get("https://ghproxy.com/https://raw.githubusercontent.com/McMug2020/XXQG_TiKu/main/0.json");
if ((answer_question_bank_checked.statusCode >= 200 && answer_question_bank_checked.statusCode < 300)) storage.remove("answer_question_map");


// 或设定每月某日定时检测更新
//if (date.getDate() == 28)｛
//｝

/**
* 通过Http更新\下载题库到本地，并进行处理，如果本地已经存在则无需下载
* @return {List} 题库
*/
function map_update() {
  toastLog("正在下载题库");
  // 使用 GitCode 上存放的题库
  var answer_question_bank = http.get("https://ghproxy.com/https://raw.githubusercontent.com/McMug2020/XXQG_TiKu/main/%E9%A2%98%E5%BA%93_McMug2020.json");
  sleep(random_time(delay_time * 3));
  // 如果资源过期或无法访问则换成别的地址
  if (!(answer_question_bank.statusCode >= 200 && answer_question_bank.statusCode < 300)) {
    // 使用XXQG_TiKu挑战答题腾讯云题库地址
    var answer_question_bank = http.get("https://gitcode.net/McMug2020/XXQG_TiKu/-/raw/65dc252b0ce9016d8a66cd9450c6a0bd9c43991e/%E9%A2%98%E5%BA%93_McMug2020.json");
    toastLog("下载XXQG_TiKu题库");
    sleep(random_time(delay_time * 3));
  }
  answer_question_bank = answer_question_bank.body.string();
  answer_question_bank = JSON.parse(answer_question_bank);
  toastLog("格式化题库");
  for (var question in answer_question_bank) {
    var answer = answer_question_bank[question];
    if (special_problem.indexOf(question.slice(0, 7)) != -1) question = question.slice(question.indexOf("|") + 1);
    else {
      question = question.slice(0, question.indexOf("|"));
      question = question.slice(0, question.indexOf(" "));
      question = question.slice(0, 25);
    }
    map_set(question, answer);
  }
  sleep(random_time(delay_time * 2));
  // 将题库存储到本地
  storage.put("answer_question_map", answer_question_map);
}

if (!storage.contains("answer_question_map")) {
  map_update();
} else {
  answer_question_map = storage.get("answer_question_map");
}


// 模拟随机时间
function random_time(time) {
  return time + random(100, 1000);
}

function entry_model(number) {
  sleep(random_time(delay_time * 2));
  var model = className("android.view.View").depth(24).findOnce(number);
  while (!model.child(4).click());
}

// 模拟点击可点击元素
function my_click_clickable(target) {
  text(target).waitFor();
  // 防止点到页面中其他有包含“我的”的控件，比如搜索栏
  if (target == '我的') {
    id('comm_head_xuexi_mine').findOne().click();
  } else {
    click(target);
  }
}

/**
 * 选出选项
 * @param {answer} answer 答案
 * @param {int} depth_click_option 点击选项控件的深度，用于点击选项
 * @param {list[string]} options_text 每个选项文本
 */
function select_option(answer, depth_click_option, options_text) {
  // 注意这里一定要用original_options_text
  var option_i = options_text.indexOf(answer);
  // 如果找到答案对应的选项
  if (option_i != -1) {
    try {
      className('android.widget.RadioButton').depth(depth_click_option).clickable(true).findOnce(option_i).click();
      return;
    } catch (error) {
    }
  }

  // 如果运行到这，说明很有可能是选项ocr错误，导致答案无法匹配，因此用最大相似度匹配
  if (answer != null) {
    var max_similarity = 0;
    var max_similarity_index = 0;
    for (var i = 0; i < options_text.length; ++i) {
      if (options_text[i]) {
        var similarity = getSimilarity(options_text[i], answer);
        if (similarity > max_similarity) {
          max_similarity = similarity;
          max_similarity_index = i;
        }
      }
    }
    try {
      className('android.widget.RadioButton').depth(depth_click_option).clickable(true).findOnce(max_similarity_index).click();
      return;
    } catch (error) {
    }
  } else {
    try {
      // 没找到答案，点击第一个
      className('android.widget.RadioButton').depth(depth_click_option).clickable(true).findOne(delay_time * 3).click();
    } catch (error) {
    }
  }
}

/**
 * 答题（挑战答题、四人赛与双人对战）
 * @param {int} depth_click_option 点击选项控件的深度，用于点击选项
 * @param {string} question 问题
 * @param {list[string]} options_text 每个选项文本
 */
function do_contest_answer(depth_click_option, question, options_text) {
  question = question.slice(0, 25);
  // 如果是特殊问题需要用选项搜索答案，而不是问题
  if (special_problem.indexOf(question.slice(0, 7)) != -1) {
    var original_options_text = options_text.concat();
    var sorted_options_text = original_options_text.sort();
    question = sorted_options_text.join("|");
  }
  // 从哈希表中取出答案
  var answer = map_get(question);

  // 如果本地题库没搜到，则搜网络题库
  if (answer == null) {
    var result;
    if (special_problem2.indexOf(question.slice(0, 6)) != -1 && question.slice(18, 25) != -1) question = question.slice(18, 25);
    if (special_problem3.indexOf(question.slice(0, 6)) != -1 && question.slice(6, 12) != -1) question = question.slice(6, 12);
    // 发送http请求获取答案 网站搜题速度 r1 > r2
    try {
      // 此网站只支持十个字符的搜索
      var r1 = http.get("http://www.syiban.com/search/index/init.html?modelid=1&q=" + encodeURI(question.slice(0, 10)));
      result = r1.body.string().match(/答案：.*</);
    } catch (error) {
    }
    // 如果第一个网站没获取到正确答案，则利用第二个网站
    if (!(result && result[0].charCodeAt(3) > 64 && result[0].charCodeAt(3) < 69)) {
      try {
        // 截掉一部分，再在syiban.com上搜索一遍 六个字符的搜索 解决如题目开头嫦娥识别成娟娥、根据《书名号搜不到等类似的问题
        var r2 = http.get("http://www.syiban.com/search/index/init.html?modelid=1&q=" + encodeURI(question.slice(3, 9)));
        result = r2.body.string().match(/答案：.*</);
      } catch (error) {
      }
    }

    if (result) {
      // 答案文本
      var result = result[0].slice(5, result[0].indexOf("<"));
      log("答案: " + result);
      select_option(result, depth_click_option, options_text);
    } else {
      // 没找到答案，点击第一个
      try {
        className("android.widget.RadioButton").depth(depth_click_option).clickable(true).findOne(delay_time * 3).click();
      } catch (error) {
      }
    }
  } else {
    log("答案: " + answer);
    select_option(answer, depth_click_option, options_text);
  }
}

/**
 * 用于下面选择题
 * 获取2个字符串的相似度
 * @param {string} str1 字符串1
 * @param {string} str2 字符串2
 * @returns {number} 相似度
 */
function getSimilarity(str1, str2) {
  var sameNum = 0;
  //寻找相同字符
  for (var i = 0; i < str1.length; i++) {
    for (var j = 0; j < str2.length; j++) {
      if (str1[i] === str2[j]) {
        sameNum++;
        break;
      }
    }
  }
  return sameNum / str2.length;
}

/*
 ********************调用python ocr********************
 *
 */


function ocr_api() {
  var options_text = [];
  var question = "";
  var res = http.get(ocr_url);
  var data = res.body.json();
  question = data[0]
  options_text = data[1]
  return [question, options_text];
}


/*
********************四人赛、双人对战********************
 */

/**
 * 处理访问异常
 */
function handling_access_exceptions() {
  // 在子线程执行的定时器，如果不用子线程，则无法获取弹出页面的控件
  var thread_handling_access_exceptions = threads.start(function () {
    while (true) {
      textContains("访问异常").waitFor();
      // 滑动按钮">>"位置
      idContains("nc_1_n1t").waitFor();
      var bound = idContains("nc_1_n1t").findOne().bounds();
      // 滑动边框位置
      text("向右滑动验证").waitFor();
      var slider_bound = text("向右滑动验证").findOne().bounds();
      // 通过更复杂的手势验证（先右后左再右）
      var x_start = bound.centerX();
      var dx = x_start - slider_bound.left;
      var x_end = slider_bound.right - dx;
      var x_mid = (x_end - x_start) * random(5, 8) / 10 + x_start;
      var back_x = (x_end - x_start) * random(2, 3) / 10;
      var y_start = random(bound.top, bound.bottom);
      var y_end = random(bound.top, bound.bottom);
      x_start = random(x_start - 7, x_start);
      x_end = random(x_end, x_end + 10);
      gesture(random_time(delay_time), [x_start, y_start], [x_mid, y_end], [x_mid - back_x, y_start], [x_end, y_end]);
      sleep(random_time(delay_time));
      if (textContains("刷新").exists()) {
        click("刷新");
        continue;
      }
      if (textContains("网络开小差").exists()) {
        click("确定");
        continue;
      }
      // 执行脚本只需通过一次验证即可，防止占用资源
      break;
    }
  });
  return thread_handling_access_exceptions;
}

/*
处理访问异常，滑动验证
*/
var thread_handling_access_exceptions = handling_access_exceptions();

/**
 * 答题
 */
function do_contest() {
  while (!text("开始").exists());
  while (!text("继续挑战").exists()) {
    // 等待下一题题目加载
    className("android.view.View").depth(28).waitFor();
    var pos = className("android.view.View").depth(28).findOne().bounds();
    if (className("android.view.View").text("        ").exists()) pos = className("android.view.View").text("        ").findOne().bounds();
    // 等待选项加载
    className("android.widget.RadioButton").depth(32).clickable(true).waitFor();
    var result = ocr_api();
    var question = result[0];
    var options_text = result[1];
    log("题目: " + question);
    log("选项: " + options_text);
    if (question) {
      do_contest_answer(32, question, options_text);
    } else {
      className("android.widget.RadioButton").depth(32).waitFor();
      className("android.widget.RadioButton").depth(32).findOne(delay_time * 3).click();
    }
    sleep(3500);
  }
}

if (!className('android.view.View').depth(21).text('学习积分').exists()) {
  app.launchApp('学习强国');
  sleep(random_time(delay_time * 3));
  log("等待首页")
  id("comm_head_xuexi_score").waitFor();
  log("点击我的积分")
  id("comm_head_xuexi_score").findOne().click();
}

/*
**********四人赛*********
*/
if (four_player_battle == 'yes') {
  log("四人赛");
  sleep(random_time(delay_time));
  log("等待积分界面加载");
  //   className("android.view.View").depth(23).text("积分规则").waitFor();
  className("android.widget.TextView").text("积分规则").waitFor();
  log("积分界面加载完成");
  // sleep(5000);
  entry_model(9);

  for (var i = 0; i < 2; i++) {
    sleep(random_time(delay_time));
    my_click_clickable("开始比赛");

    do_contest();

    if (i == 0) {
      sleep(random_time(delay_time * 2));

      my_click_clickable("继续挑战");

      sleep(random_time(delay_time));
    }
  }
  sleep(random_time(delay_time * 3));
  back();
  sleep(random_time(delay_time));
  back();
}

/*
**********双人对战*********
*/
if (two_player_battle == 'yes') {
  log("双人对战");
  sleep(random_time(delay_time));

  if (!className("android.view.View").depth(21).text("学习积分").exists()) back_track();
  className("android.view.View").depth(21).text("学习积分").waitFor();
  entry_model(11);

  // 点击随机匹配

  text("随机匹配").waitFor();
  sleep(random_time(delay_time * 2));
  try {
    className("android.view.View").clickable(true).depth(24).findOnce(1).click();456
  } catch (error) {
    className("android.view.View").text("").findOne().click();
  }

  do_contest();

  sleep(random_time(delay_time));
  back();
  sleep(random_time(delay_time));
  back();
  my_click_clickable("退出");
}

// 震动半秒
device.vibrate(500);
toast('脚本运行完成');
exit();
