const KEYS = {
  cfg: '___theme_$$_cfg',
  css: '___theme_$$_css'
}

module.exports = {
  _tryNum: 0,
  _urlColors: {}, // {[url]: {id,colors}}
  ___theme_$$_cfg: null,

  changeColor: function (options, promiseForIE) {
    var Promise = promiseForIE || window.Promise
    var _this = this;
    if (!_this._cfg) {
      _this._cfg = window[KEYS.cfg]
      var later = retry()
      //重试直到theme_COLOR_config加载
      if (later) return later
    }

    function retry() {
      if (!_this._cfg) {
        if (_this._tryNum < 9) {
          _this._tryNum = _this._tryNum + 1
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              resolve(_this.changeColor(options, promiseForIE))
            }, 100)
          })
        } else {
          _this._cfg = {}
        }
      }
    }

    var cfgKeys = Object.keys(_this._cfg).sort((a, b) => a - b)

    var nextColorIndex = 0

    return Promise.all(cfgKeys.map(key => new Promise(function (resolve, reject) {
      try {
        var cfg = _this._cfg[key];

        var cssUrl = options.cssUrl || cfg.url;
        var oldColors = options.oldColors || cfg.colors || [];
        var newColors = options.newColors || [];
        var forceChange = options.forceChange || false;

        if (newColors.length > oldColors.length) {
          newColors = newColors.slice(nextColorIndex, nextColorIndex + oldColors.length)
        }
        nextColorIndex += oldColors.length

        if (options.changeUrl) {
          cssUrl = options.changeUrl(cssUrl)
        }

        var last = _this._urlColors[cssUrl]
        if (last) {
          oldColors = last.colors
        }

        if (isSameArr(oldColors, newColors) && !forceChange) {
          resolve()
        } else {
          setCssText({ cfgKey:key, newColors, oldColors}, last, cssUrl, resolve, reject)
        }
      } catch (e) {
        console.error(e)
      }


      function setCssTo(elStyle, cssText, oldColors, newColors) {
        cssText = _this.replaceCssText(cssText, oldColors, newColors)
        elStyle.innerText = cssText
      }

      function setCssText({ cfgKey, newColors, oldColors}, last, url, resolve, reject) {
        var elStyle = last && document.getElementById(last.id);
        if (elStyle && last.colors) {
          setCssTo(elStyle, elStyle.innerText, oldColors, newColors)
          last.colors = newColors
          resolve()
        } else {
          //第一次替换
          var id = 'css_' + cfgKey
          elStyle = document.getElementById(id);
          if (!elStyle) {
            elStyle = document.querySelector(options.appendToEl || 'body')
              .appendChild(document.createElement('style'))

            elStyle.setAttribute('id', id)
          }

          _this.getCssString(url, function (cssTextOrObject) {
            if (typeof cssTextOrObject === 'string') {
              setCssTo(elStyle, cssTextOrObject, oldColors, newColors)
            } else if (typeof cssTextOrObject === 'object') {
              setCssTo(elStyle, cssTextOrObject[cfgKey], oldColors, newColors)
            }

            _this._urlColors[url] = {id: id, colors: newColors}

            resolve()
          }, reject)
        }
      }
    })))

  },
  replaceCssText: function (cssText = '', oldColors, newColors) {
    cssText = cssText || ''
    oldColors.forEach(function (color, t) {
      //#222、#222223、#22222350、222, 255,3 => #333、#333334、#33333450、211,133,53、hsl(27, 92.531%, 52.745%)
      var reg = new RegExp(color.replace(/\s/g, '').replace(/,/g, ',\\s*') + '([\\da-f]{2})?(\\b|\\)|,|\\s)', 'ig')
      cssText = cssText.replace(reg, newColors[t] + '$1$2') // 255, 255,3
    })
    return cssText
  },
  getCssString: function (url, resolve, reject) {
    var cssCode = window[KEYS.css]
    if (cssCode) {
      resolve(cssCode)
      return
    }

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.responseText)
        } else {
          reject(xhr.status)
        }
      }
    }
    xhr.onerror = function (e) {
      reject(e)
    }
    xhr.ontimeout = function (e) {
      reject(e)
    }
    xhr.open('GET', url)
    xhr.send()
  },
}

function isSameArr(oldColors, newColors) {
  if (oldColors.length !== newColors.length) {
    return false
  }
  for (var i = 0, j = oldColors.length; i < j; i++) {
    if (oldColors[i] !== newColors[i]) {
      return false
    }
  }
  return true
}
