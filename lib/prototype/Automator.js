/*
 * @Author: TonyJiangWJ
 * @Date: 2020-04-25 20:37:31
 * @Last Modified by: TonyJiangWJ
 * @Last Modified time: 2020-04-27 23:59:28
 * @Description: 
 */
let { config: _config } = require('../../config.js')(runtime, this)
let singletoneRequire = require('../SingletonRequirer.js')(runtime, this)
let _logUtils = singletoneRequire('LogUtils')
let customLockScreen = files.exists(FileUtils.getCurrentWorkPath() + '/extends/LockScreen.js') ? require('../../extends/LockScreen.js') : null


const hasRootPermission = function () {
  return files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su")
}

const _automator = (device.sdkInt < 24 || hasRootPermission()) ? new Automation_root() : new Automation()



module.exports = {
  click: function (x, y) {
    return _automator.click(x, y)
  },
  clickCenter: function (obj) {
    return _automator.click(obj.bounds().centerX(), obj.bounds().centerY())
  },
  swipe: function (x1, y1, x2, y2, duration) {
    return _automator.swipe(x1, y1, x2, y2, duration)
  },
  gesture: function (duration, points) {
    return _automator.gesture(duration, points)
  },
  back: function () {
    return _automator.back()
  },
  lockScreen: function () {
    return _automator.lockScreen()
  },
  scrollDown: function (speed) {
    if (_config.useCustomScrollDown) {
      return _automator.scrollDown(speed)
    } else {
      return scrollDown()
    }
  },
  scrollUpAndDown: function (speed) {
    if (_config.useCustomScrollDown) {
      return _automator.scrollUpAndDown(speed)
    } else {
      let deviceHeight = _config.device_height || 1900
      // 手势下拉 
      _automator.swipe(400, parseInt(deviceHeight / 3), 600, parseInt(deviceHeight / 3 * 2), 150)
      sleep(200)
      scrollDown()
    }
  },
  clickBack: function (forceBack) {
    return _automator.clickBack(forceBack)
  },
  clickClose: function () {
    return _automator.clickClose()
  },
  enterFriendList: function () {
    return _automator.enterFriendList()
  }
}

function CommonAutomation () {
  this.scrollDown = function (speed) {
    let millis = speed || _config.scrollDownSpeed || 500
    let deviceHeight = _config.device_height || 1900
    let bottomHeight = _config.bottomHeight || 250
    let x = parseInt(_config.device_width / 2)
    this.swipe(x, deviceHeight - bottomHeight, x + 100, parseInt(deviceHeight / 5), millis)
  }

  this.scrollUpAndDown = function (speed) {
    let millis = parseInt((speed || _config.scrollDownSpeed || 500) / 2)

    let deviceHeight = _config.device_height || 1900
    let bottomHeight = _config.bottomHeight || 250
    let x = parseInt(_config.device_width / 2)
    // 下拉 
    this.swipe(x, parseInt(deviceHeight / 3), x + 100, parseInt(deviceHeight / 3 * 2), millis)
    sleep(millis + 20)
    this.swipe(x, deviceHeight - bottomHeight, x + 100, parseInt(deviceHeight / 5), millis)
  }

  this.clickBack = function (forceBack) {
    let hasButton = false
    if (descEndsWith('返回').exists()) {
      descEndsWith('返回')
        .findOne(_config.timeout_findOne)
        .click()
      hasButton = true
    } else if (textEndsWith('返回').exists()) {
      textEndsWith('返回')
        .findOne(_config.timeout_findOne)
        .click()
      hasButton = true
    } else if (forceBack) {
      this.back()
    }
    if (hasButton) {
      sleep(200)
    }
    return hasButton
  }

  this.clickClose = function () {
    let hasButton = false
    if (descEndsWith('关闭').exists()) {
      descEndsWith('关闭')
        .findOne(_config.timeout_findOne)
        .click()
      hasButton = true
    } else if (textEndsWith('关闭').exists()) {
      textEndsWith('关闭')
        .findOne(_config.timeout_findOne)
        .click()
      hasButton = true
    }
    if (hasButton) {
      sleep(200)
    }
    return hasButton
  }

  this.enterFriendList = function (tryCount) {
    tryCount = tryCount || 1
    if (descEndsWith(_config.enter_friend_list_ui_content).exists()) {
      descEndsWith(_config.enter_friend_list_ui_content)
        .findOne(_config.timeout_findOne)
        .click()
    } else if (textEndsWith(_config.enter_friend_list_ui_content).exists()) {
      textEndsWith(_config.enter_friend_list_ui_content)
        .findOne(_config.timeout_findOne)
        .click()
    } else {
      if (tryCount > 3) {
        return
      }
      _logUtils.warnInfo(['未找到 查看更多好友 等待一秒钟后重试, 尝试次数：{}', tryCount])
      // 未找到查看更多好友，等待1秒钟后重试
      sleep(1000)
      this.enterFriendList(++tryCount)
    }
    sleep(200)
  }
}
function Automation_root () {
  CommonAutomation.call(this)

  this.check_root = function () {
    if (!(files.exists("/sbin/su") || files.exists("/system/xbin/su") || files.exists("/system/bin/su"))) throw new Error("未获取ROOT权限")
  }

  this.click = function (x, y) {
    this.check_root()
    return (shell("input tap " + x + " " + y, true).code === 0)
  }

  this.swipe = function (x1, y1, x2, y2, duration) {
    this.check_root()
    return (shell("input swipe " + x1 + " " + y1 + " " + x2 + " " + y2 + " " + duration, true).code === 0)
  }

  this.gesture = function (duration, points) {
    this.check_root()
    let len = points.length,
      step = duration / len,
      start = points.shift()

    // 使用 RootAutomator 模拟手势，仅适用于安卓5.0及以上
    let ra = new RootAutomator()
    ra.touchDown(start[0], start[1])
    sleep(step)
    points.forEach(function (el) {
      ra.touchMove(el[0], el[1])
      sleep(step)
    })
    ra.touchUp()
    ra.exit()
    return true
  }

  this.back = function () {
    this.check_root()
    return (shell("input keyevent KEYCODE_BACK", true).code === 0)
  }

  this.lockScreen = function () {
    return (shell("input keyevent 26", true).code === 0)
  }

}

function Automation () {
  CommonAutomation.call(this)

  this.click = function (x, y) {
    return click(x, y)
  }

  this.swipe = function (x1, y1, x2, y2, duration) {
    return swipe(x1, y1, x2, y2, duration)
  }

  this.gesture = function (duration, points) {
    return gesture(duration, points)
  }

  this.back = function () {
    return back()
  }

  /**
   * 下拉状态栏，点击锁屏按钮
   */
  this.lockScreen = function () {
    if (customLockScreen) {
      customLockScreen()
    } else {
      swipe(500, 10, 500, 1000, 500)
      swipe(500, 10, 500, 1000, 500)
      // 点击锁屏按钮
      click(parseInt(_config.lock_x), parseInt(_config.lock_y))
    }
  }

}