/* 
 * Ingress ICE by Nikitakun (https://github.com/nibogd/ingress-ice), distributed under the MIT License
 */

(function() {

  // Prepare
  phantom.injectJs('async/lib/async.js');
  var page = require('webpage').create();
  var system = require('system');
  var args = system.args;
  var twostep = 0;

  if (!args[10]) {
    debug("Please set all variables");
  }
  var l = args[1];
  var p = args[2];
  var area = args[3];
  var minlevel = parseInt(args[4], 10);
  var maxlevel = parseInt(args[5], 10);
  var v = parseInt(args[6], 10);
  var width = parseInt(args[7], 10);
  var height = parseInt(args[8], 10);
  var folder = args[9];
  var ssnum = args[10];
  var zoom = args[11];
  var curnum = 0;
  var errorNum = 0;
  var errorNumMax = 3;
  var Version = '2.0.3';
  var debugMode = true;
  var prefix = 'capture';
  v = 1000 * v;

  var val, message, Le;

  // Global configurations

  // For page timeout
  var timeoutTime;
  debug("Zoom level : " + zoom)
  if (zoom) {
    timeoutTime = (21 - parseInt(zoom, 10)) * 2 * 60 * 1000;
    if (timeoutTime <= 0) {
      timeoutTime = 2 * 60 * 1000;
    }
  } else {
    debug("Zoom is not specified. Timeout is set to 5 min");
    timeoutTime = 5 * 60 * 1000;
  }

  var timeout;
  var resourceWaitTime = 10 * 1000;
  var receiveTimer;
  page.onResourceReceived = function(response) {
    debug("Received : " + receiveTimer);
    if (receiveTimer) {
      clearTimeout(receiveTimer);
    }
    receiveTimer = setTimeout(loadingMessageCheckQueue, resourceWaitTime);
  };

  // Loading message detection
  var loadWaitTime = 5 * 1000;
  var loadTimer = 0;

  page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36";
  page.settings.resourceTimeout = timeoutTime;
  page.viewportSize = {
    width: width + 42,
    height: height + 167
  };

  // Mains
  checkInputs();
  setPageTimeout();
  checkLogin();

  // Logics

  function debug(message) {
    if (debugMode) {
      console.log("[" + getDateTime() + "] " + message);
    }
  }

  function setPageTimeout() {
    timeout = setTimeout(function() {
      page.stop();
      reloadPage();
    }, timeoutTime);
  }

  function reloadPage() {
    clearTimeout(timeout);
    errorNum++;
    if (errorNum >= errorNumMax) {
      debug("*** Loading error: Error count exceeded :( ***");
      quit();
    }
    debug("*** Loading error: Try to reload " + errorNum + "/" + errorNumMax + " ***");
    setPageTimeout();
    openMain();
  }

  function getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    if (month.toString().length == 1) {
      var month = '0' + month;
    }
    if (day.toString().length == 1) {
      var day = '0' + day;
    }
    if (hour.toString().length == 1) {
      var hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
      var minute = '0' + minute;
    }
    if (second.toString().length == 1) {
      var second = '0' + second;
    }
    var dateTime = year + '-' + month + '-' + day + '-' + hour + '-' + minute + '-' + second;
    return dateTime;
  };

  function screenshot() {
    if (ssnum != 0) {
      debug('Screen #' + (curnum + 1) + '/' + ssnum + ' captured');
      curnum++;
    }
    clearTimeout(timeout);
    debug('Capturing screen from ' + getDateTime() + '...');
    page.render(folder + prefix + '-' + getDateTime() + '.png');

    if ((curnum >= ssnum) && (ssnum != 0)) {
      debug('Finished sucessfully. Exiting...\nThanks for using ingress-ice!');
      quit();
      return;
    } else {
      openMain();
    }
  };

  function getRenderedText(html) {
    if (html) {
      return html.replace(/<[^>]*>/g, "");
    }
    return null;
  }

  function quit(err) {
    if (err) {
      debug('\nICE crashed. Reason: ' + err + ' :('); //nice XD
    } else {
      debug('Quit');
    };
    phantom.exit();
  };

  function checkInputs() {
    if (!l | !p) {
      quit('you haven\'t entered your login and/or password');
    };
    if ((minlevel < 0 | minlevel > 8) | (maxlevel < 0 | maxlevel > 8) | (!minlevel | !maxlevel)) {
      quit('the lowest and/or highest portal levels were not set or were set wrong');
    };
    if (minlevel > maxlevel) {
      quit('lowest portal level is higher than highest. Isn\'t that impossible?!');
    };
    if (!area | area == 0) {
      quit('you forgot to set the location link, didn\'t you?');
    };
    debug('\n     _____ )   ___      _____) \n    (, /  (__/_____)  /        \n      /     /         )__      \n  ___/__   /        /          \n(__ /     (______) (_____)  v' + Version + ' (https://github.com/nibogd/ingress-ice)\n\nIf something doesn\'t work or if you want to submit a feature request, visit https://github.com/nibogd/ingress-ice/issues \nConnecting...');
  }

  function checkLogin() {
    var loginTimeout = 5000;
    setTimeout(function() {
      page.open('https://www.ingress.com/intel', function(status) {

        if (status !== 'success') {
          quit('cannot connect to remote server')
        };

        var inglink = page.evaluate(function() {
          return document.getElementsByTagName('a')[0].href;
        });

        var serviceURL = 'https://www.google.com/accounts/ServiceLogin';
        if (inglink.substring(0, serviceURL.length) == serviceURL) {
          debug('Login URL is detected : ' + inglink);
        } else {
          debug('Already logged in, open main logics : ' + page.url);
          openMain();
          return;
        }

        debug('Logging in...');
        page.open(inglink, function() {

          page.evaluate(function(l) {
            document.getElementById('Email').value = l;
          }, l);

          page.evaluate(function(p) {
            document.getElementById('Passwd').value = p;
          }, p);

          page.evaluate(function() {
            document.querySelector("input#signIn").click();
          });

          page.evaluate(function() {
            document.getElementById('gaia_loginform').submit(); // Not using POST because the URI may change 
          });

          setTimeout(function() {
            debug('URI is now ' + page.url.substring(0, 40) + '... .\nVerifying login...');

            if (page.url.substring(0, serviceURL.length) == serviceURL) {
              quit('login failed: wrong email and/or password')
            };

            var appEngineURL = 'https://appengine.google.com/_ah/loginfo';
            if (page.url.substring(0, appEngineURL.length) == appEngineURL) {
              debug('Accepting appEngine request...');
              page.evaluate(function() {
                document.getElementById('persist_checkbox').checked = true;
                document.getElementsByTagName('form').submit();
              });
            };

            var twoFAURL = 'https://accounts.google.com/SecondFactor';
            if (page.url.substring(0, twoFAURL.length) == twoFAURL) {
              debug('Using two-step verification, please enter your code:');
              twostep = system.stdin.readLine();
              debug('Sending...')
            };

            if (twostep) {
              page.evaluate(function(code) {
                document.getElementById('smsUserPin').value = code;
              }, twostep);
              page.evaluate(function() {
                document.querySelector('#PersistentCookie').click();
              });
              page.evaluate(function() {
                document.querySelector("input#smsVerifyPin").click();
              });
            };
          }, loginTimeout);
        });
      });
    }, loginTimeout);
  }

  function removeFragments(callback) {
    // Check COMM element is exist or not
    var comm = page.evaluate(function() {
      return document.querySelector('#comm');
    });
    if (comm == null) {
      debug("There is no COMM element");
      callback("Error!", false);
      return;
    } else if (comm.style == null || comm.style.display != "none") {
      debug("COMM element is found");
      page.evaluate(function() {
        document.querySelector('#comm').style.display = 'none';
        document.querySelector('#player_stats').style.display = 'none';
        document.querySelector('#game_stats').style.display = 'none';
        document.querySelector('#geotools').style.display = 'none';
        document.querySelector('#header').style.display = 'none';
        document.querySelector('#snapcontrol').style.display = 'none';
        document.querySelectorAll('.img_snap')[0].style.display = 'none';
        document.querySelector('.gm-style > div > a > div > img').style.display = 'none';
        var hide = document.querySelectorAll('.gmnoprint');
        for (index = 0; index < hide.length; ++index) {
          hide[index].style.display = 'none';
        }
      });
    }

    // Check #filters_container element is exist or not
    var fragment = page.evaluate(function() {
      return document.querySelector('#filters_container');
    });
    if (fragment == null) {
      debug("There is no #filters_container element");
      callback("Error!", false);
      return;
    } else if (fragment.style == null || fragment.style.display != "none") {
      if ((minlevel > 1) | (maxlevel < 8)) {
        debug('Set portal level : ' + minlevel + "/" + maxlevel);
        setMinMax(minlevel, maxlevel, callback);
        return;
      } else {
        page.evaluate(function() {
          document.querySelector('#filters_container').style.display = 'none'
        });
        callback(null, true);
      }
    } else {
      callback(null, true);
    }
  }

  function loadingMessageCheckQueue() {
    loadingQueue.push(null, function(err) {
      if (err == null) {
        screenshot();
      }
    });
    debug("Loading queue added : " + loadingQueue.length());
  }

  var loadingQueue = async.queue(function(task, queueCallback) {
    loadTimer++;
    debug("LoadTimer: " + loadTimer);
    debug("*** CaptureService ***");
    async.series({
      loadmessage: function(callback) {
        var loadmessage = page.evaluate(function() {
          return document.querySelector('#loading_msg');
        });
        if (loadmessage && loadmessage.style && loadmessage.style.display == "none") {
          debug("Capture service fired");
          callback(null, true);
        } else {
          debug("Capture service not fired :(");
          callback("Error!", false);
        }
      },
      checkPage: function(callback) {
        var pageBase = 'https://www.ingress.com/intel';
        if (page.url.substring(0, pageBase.length) == pageBase && page.url == pageBase) {
          debug('It seems to finish authentication. Try to open main logic...');
          openMain();
          callback('Error', false);
          return;
        };
        if (page.url != area) {
          debug("Page is different: " + page.url);
          callback('Error', false);
          return;
        }
        debug("Target page URL is OK");
        callback(null, true);
      },
      checkFragments: function(callback) {
        removeFragments(callback);
      },
      checkClipArea: function(callback) {
        debug("checkClipArea start");
        setTimeout(function() {
          debug("Try to detect clip area");
          var mySelector = "#map_canvas";
          var elementBounds = page.evaluate(function(selector) {
            var clipRect = document.querySelector(selector).getBoundingClientRect();
            return {
              top: clipRect.top,
              left: clipRect.left,
              width: clipRect.width,
              height: clipRect.height
            };
          }, mySelector);
          var oldClipRect = page.clipRect;
          page.clipRect = elementBounds;
          debug("Clip area detedted");
          callback(null, true);
        }, 1000);
        debug("checkClipArea finish");
      }
    }, function(err, results) {
      debug("*** Check error : " + err + " ***");
      queueCallback(err);
    });
  }, 1);

  function openMain() {
    debug("Logic : OpenMain");
    setTimeout(function() {
      page.open(area, function() {
        debug("Open : " + area);
        debug('Authenticated successfully, starting screenshotting portals in range between levels ' + minlevel + ' and ' + maxlevel + ' every ' + v / 1000 + 's...');
      });
    }, 1000);
  }

  function setMinMax(min, max, setCallback) {
    var clickInterval = 3000;

    async.waterfall([
      function(callback) {
        debug("setMinMax : precheck");
        var preresult = checkPortalLevel(min, max);
        callback(null, preresult);
      },
      function(result, callback) {
        debug("setMinMax : setmin");
        if (result.isMinSame) {
          debug("Min value is same");
          callback(null, result);
          return;
        }
        debug('Change Min value: ' + currentMin + '->' + min);
        var rect = page.evaluate(function() {
          return document.querySelectorAll('.level_notch.selected')[0].getBoundingClientRect();
        });
        debug("Rect click : " + rect.left + rect.width / 2 + " / " + rect.top + rect.height / 2);
        page.sendEvent('click', rect.left + rect.width / 2, rect.top + rect.height / 2);
        setTimeout(function() {
          var rect1 = page.evaluate(function(min) {
            return document.querySelector('#level_low' + min).getBoundingClientRect();
          }, min);
          debug("Rect1 click : " + rect1.left + rect1.width / 2 + " / " + rect1.top + rect1.height / 2);
          page.sendEvent('click', rect1.left + rect1.width / 2, rect1.top + rect1.height / 2);
          callback(null, result);
        }, clickInterval);
      },
      function(result, callback) {
        debug("setMinMax : setmax");
        if (result.isMaxSame) {
          debug("Max value is same");
          callback(null, result);
          return;
        }
        debug('Change Max value: ' + currentMax + '->' + max);
        setTimeout(function() {
          var rect2 = page.evaluate(function() {
            return document.querySelectorAll('.level_notch.selected')[1].getBoundingClientRect();
          });
          debug("Rect2 click : " + rect2.left + rect2.width / 2 + " / " + rect2.top + rect2.height / 2);
          page.sendEvent('click', rect2.left + rect2.width / 2, rect2.top + rect2.height / 2);
          setTimeout(function() {
            var rect3 = page.evaluate(function(max) {
              return document.querySelector('#level_high' + max).getBoundingClientRect();
            }, max);
            debug("Rect3 click : " + rect3.left + rect3.width / 2 + " / " + rect3.top + rect3.height / 2)
            page.sendEvent('click', rect3.left + rect3.width / 2, rect3.top + rect3.height / 2);
            callback(null, result);
          }, clickInterval)
        }, clickInterval)
      },
      function(result, callback) {
        debug("setMinMax : postcheck");
        if (result.isMinSame && result.isMaxSame) {
          debug("Post check is OK");
          callback(null, result);
          return;
        }
        callback("Portal level is changed", result);
      }
    ], function(err, result) {
      debug("Results : " + result.isMinSame + "/" + result.isMaxSame);
      if (!err) {
        page.evaluate(function() {
          document.querySelector('#filters_container').style.display = 'none'
        });
        setCallback(null, true);
      } else {
        setCallback("Error!", false);
      }
    });
  }

  function checkPortalLevel(min, max) {
    debug("Check avaiable value");
    var minAvailable = page.evaluate(function() {
      return document.querySelectorAll('.level_notch.selected')[0];
    });
    var maxAvailable = page.evaluate(function() {
      return document.querySelectorAll('.level_notch.selected')[1];
    });
    var currentMinStr = minAvailable.id.replace(/level_(high|low)/g, "");
    var currentMaxStr = maxAvailable.id.replace(/level_(high|low)/g, "");
    currentMin = parseInt(currentMinStr, 10);
    currentMax = parseInt(currentMaxStr, 10);
    debug("Value : " + currentMin + "/" + currentMax);

    var isMinSame = false;
    var isMaxSame = false;
    if (currentMin > min) {
      debug('The minimal portal level is too low, using default. Consider setting it higher.');
      isMinSame = true;
    }
    if (currentMin == min) {
      debug('Min specified: ' + currentMin);
      isMinSame = true;
    }
    if (currentMax == max) {
      debug('Max specified: ' + currentMax);
      isMaxSame = true;
    }
    var result = {
      "isMinSame": isMinSame,
      "isMaxSame": isMaxSame
    };
    return result;
  }
})();
