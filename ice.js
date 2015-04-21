/* 
 * Ingress ICE by Nikitakun (https://github.com/nibogd/ingress-ice), distributed under the MIT License
 */

(function() {

  // Prepare
  var page = require('webpage').create();
  var system = require('system');
  var args = system.args;
  var twostep = 0;

  if (!args[10]) {
    console.log("Please set all variables");
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
  var debug = true;
  v = 1000 * v;

  var val, message, Le;

  // Global configurations

  var timeoutTime;
  console.log("Zoom level : " + zoom)
  if (zoom) {
    timeoutTime = (21 - parseInt(zoom, 10)) * 60 * 1000;
    if (timeoutTime <= 0) {
      timeoutTime = 60 * 1000;
    }
  } else {
    console.log("Zoom is not specified. Timeout is set to 5 min");
    timeoutTime = 5 * 60 * 1000;
  }
  var timeout;
  var resourceWaitTime = 5000;
  var timer;
  page.onResourceReceived = function(response) {
    console.log("Received: " + timer);
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(captureService, resourceWaitTime);
  };

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
    if (debug) {
      console.log(message);
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
      console.log("*** Loading error: Error count exceeded :( ***");
      quit();
    }
    console.log("*** Loading error: Try to reload " + errorNum + "/" + errorNumMax + " ***");
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
    var dateTime = year + '-' + month + '-' + day + '--' + hour + '-' + minute + '-' + second;
    return dateTime;
  };

  function s() {
    var loadmessage = page.evaluate(function() {
      return document.querySelector('#loading_msg');
    });

    if (loadmessage) {
      var visibility = loadmessage.style.display;
      if (visibility != "none") {

        var percent_text = page.evaluate(function() {
          return document.querySelector('#percent_text');
        });
        var percent = "?";
        if (percent_text) {
          percent = percent_text.innerHTML;
        }
        console.log("Loading message found : " + percent);
        return;
      }
      console.log("Message is OK :)");
    } else {
      console.log("Element not found");
      if (debug) {
        console.log('Capturing screen from ' + getDateTime() + '...');
        page.render(folder + 'ice-' + getDateTime() + '-no-elem.png');
      }
      return;
    }
    if (ssnum != 0) {
      console.log('Screen #' + (curnum + 1) + '/' + ssnum + ' captured');
      curnum++;
    }
    clearTimeout(timeout);
    console.log('Capturing screen from ' + getDateTime() + '...');
    page.render(folder + 'ice-' + getDateTime() + '.png');

    if ((curnum >= ssnum) && (ssnum != 0)) {
      console.log('Finished sucessfully. Exiting...\nThanks for using ingress-ice!');
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
      console.log('\nICE crashed. Reason: ' + err + ' :('); //nice XD
    } else {
      console.log('Quit');
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
    console.log('     _____ )   ___      _____) \n    (, /  (__/_____)  /        \n      /     /         )__      \n  ___/__   /        /          \n(__ /     (______) (_____)  v' + Version + ' (https://github.com/nibogd/ingress-ice)\n\nIf something doesn\'t work or if you want to submit a feature request, visit https://github.com/nibogd/ingress-ice/issues \nConnecting...');
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
          console.log('Login URL is detected : ' + inglink);
        } else {
          console.log('Already logged in, open main logics : ' + page.url);
          openMain();
          return;
        }

        console.log('Logging in...');
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
            console.log('URI is now ' + page.url.substring(0, 40) + '... .\nVerifying login...');

            if (page.url.substring(0, serviceURL.length) == serviceURL) {
              quit('login failed: wrong email and/or password')
            };

            var appEngineURL = 'https://appengine.google.com/_ah/loginfo';
            if (page.url.substring(0, appEngineURL.length) == appEngineURL) {
              console.log('Accepting appEngine request...');
              page.evaluate(function() {
                document.getElementById('persist_checkbox').checked = true;
                document.getElementsByTagName('form').submit();
              });
            };

            var twoFAURL = 'https://accounts.google.com/SecondFactor';
            if (page.url.substring(0, twoFAURL.length) == twoFAURL) {
              console.log('Using two-step verification, please enter your code:');
              twostep = system.stdin.readLine();
              console.log('Sending...')
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

  function removeFlagments() {
    // Check COMM element is exist or not
    var comm = page.evaluate(function() {
      return document.querySelector('#comm');
    });
    if (comm == null) {
      console.log("There is no COMM element");
      return false;
    } else if (comm.style.display != "none") {
      console.log("COMM : " + comm);
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
    var flagment = page.evaluate(function() {
      return document.querySelector('#filters_container');
    });
    if (fragment == null) {
      console.log("There is no #filters_container element");
      return false;
    } else if (fragment.style.display != "none") {
      if ((minlevel > 1) | (maxlevel < 8)) {
        console.log('Set portal level : ' + minlevel + "/" + maxlevel);
        setMinMax(minlevel, maxlevel);
      }
      return false;
    }
    return true;
  }

  function captureService() {
    console.log("*** CaptureService ***");
    var pageBase = 'https://www.ingress.com/intel';
    if (page.url.substring(0, pageBase.length) == pageBase && page.url == pageBase) {
      console.log('It seems to finish authentication. Try to open main logic...');
      openMain();
      return;
    };
    if (page.url != area) {
      console.log("Page is different: " + page.url);
      return;
    }

    var removed = removeFlagments();
    if (!removed) {
      console.log("Flagment is not removed");
      return;
    }
    setTimeout(function() {
      console.log("Try to detect clip area");
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
      s();
    }, 1000);
  }

  function openMain() {
    console.log("Logic : OpenMain");
    setTimeout(function() {
      page.open(area, function() {
        console.log("Open : " + area);
        console.log('Authenticated successfully, starting screenshotting portals in range between levels ' + minlevel + ' and ' + maxlevel + ' every ' + v / 1000 + 's...');
      });
    }, 1000);
  }

  function setMinMax(min, max) {
    var clickInterval = 3000;
    setTimeout(function() {
      var minAvailable = page.evaluate(function() {
        return document.querySelectorAll('.level_notch.selected')[0];
      });
      var maxAvailable = page.evaluate(function() {
        return document.querySelectorAll('.level_notch.selected')[1];
      });
      var currentMinStr = minAvailable.id.replace(/level_(high|low)/g, "");
      var currentMaxStr = maxAvailable.id.replace(/level_(high|low)/g, "");
      var currentMin = parseInt(currentMinStr, 10);
      var currentMax = parseInt(currentMaxStr, 10);
      if (currentMin > min) {
        console.log('The minimal portal level is too low, using default. Consider setting it higher.');
      } else if (currentMin == min) {
        console.log('Min specified: ' + currentMin);
      } else {
        setTimeout(function() {
          console.log('Change Min value: ' + currentMin + '->' + min);
          var rect = page.evaluate(function() {
            return document.querySelectorAll('.level_notch.selected')[0].getBoundingClientRect();
          });
          console.log("Rect click : " + rect.left + rect.width / 2 + " / " + rect.top + rect.height / 2);
          page.sendEvent('click', rect.left + rect.width / 2, rect.top + rect.height / 2);
          setTimeout(function() {
            var rect1 = page.evaluate(function(min) {
              return document.querySelector('#level_low' + min).getBoundingClientRect();
            }, min);
            console.log("Rect1 click : " + rect1.left + rect1.width / 2 + " / " + rect1.top + rect1.height / 2);
            page.sendEvent('click', rect1.left + rect1.width / 2, rect1.top + rect1.height / 2);
          }, clickInterval);
        }, clickInterval)
      };
      if (currentMax == max) {
        console.log('Max specified: ' + currentMax);
      } else if (max < 8) {
        console.log('Change Max value: ' + currentMax + '->' + max);
        setTimeout(function() {
          var rect2 = page.evaluate(function() {
            return document.querySelectorAll('.level_notch.selected')[1].getBoundingClientRect();
          });
          console.log("Rect2 click : " + rect2.left + rect2.width / 2 + " / " + rect2.top + rect2.height / 2);
          page.sendEvent('click', rect2.left + rect2.width / 2, rect2.top + rect2.height / 2);
          setTimeout(function() {
            var rect3 = page.evaluate(function(max) {
              return document.querySelector('#level_high' + max).getBoundingClientRect();
            }, max);
            console.log("Rect3 click : " + rect3.left + rect3.width / 2 + " / " + rect3.top + rect3.height / 2)
            page.sendEvent('click', rect3.left + rect3.width / 2, rect3.top + rect3.height / 2);
            //
          }, clickInterval)
        }, clickInterval)
      };
    }, clickInterval)
  };
})();