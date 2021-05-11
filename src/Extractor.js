// \n和备注
var Reg_Lf_Rem = /\\\\?n|\n|\\\\?r|\/\*[\s\S]+?\*\//g

var SpaceReg = /\s+/g
var TrimReg = /(^|,)\s+|\s+($)/g; //前空格，逗号后的空格; 后空格
var SubCssReg = /\s*>\s*/g // div > a 替换为 div>a
//var ExclueCssReg = /(?:scale3d|translate3d|rotate3d|matrix3d)\s*\(/i;

const convert = require('color-convert');
const valueParser = require("postcss-value-parser");

class Extractor {
  constructor(options) {
    this.tempContents = []
    this.options = options
    this.matchColorRegs = options.matchColors // ['#409EFF', '#409eff', '#53a8ff', '#66b1ff', '#79bbff', '#8cc5ff', '#a0cfff', '#b3d8ff', '#c6e2ff', '#d9ecff', '#ecf5ff', '#3a8ee6', '#337ecc']
      .map(c => new RegExp(c.replace(/\s/g, '').replace(/,/g, ',\\s*') + '([\\da-f]{2})?(\\b|\\)|,|\\s)', 'i')); // 255, 255,3
  }

  extractColors(src) {
    src = src.replace(Reg_Lf_Rem, '')

    var ret = []
    var nameStart, nameEnd, cssEnd = -1;
    while (true) {
      nameStart = cssEnd + 1
      nameEnd = src.indexOf('{', nameStart)
      cssEnd = findCssEnd(src, nameEnd)
      if (cssEnd > -1 && cssEnd > nameEnd && nameEnd > nameStart) {
        // Getting the selector
        var selector = src.slice(nameStart, nameEnd)
        selector = selector.replace(TrimReg, '$1')
        selector = selector.replace(SubCssReg, '>')
        selector = selector.replace(SpaceReg, ' ') // lines
        var p = selector.indexOf(';') //@charset utf-8;
        if (p > -1) {
          selector = selector.slice(p + 1)
        }


        var cssCode = src.slice(nameEnd + 1, cssEnd)
        var rules = []
        if (cssCode.indexOf('{') > -1) { // @keyframe
          rules = this.extractColors(cssCode)
        } else {
          rules = this.getRules(cssCode, selector)
        }


        if (rules.length) {
          let finalSelector = ''
          // 改变选择器
          if (this.options.changeSelector) {
            var util = {
              selector,
              rules: rules,
              changeEach: changeEach
            }
            finalSelector = this.options.changeSelector(selector.split(',').sort().join(','), util)
          } else {
            finalSelector = selector
          }

          // 选择器
          if (finalSelector) {
            const rulesCss = rules.join(';')
            const css = rulesCss.endsWith(';') ? rulesCss : `${rulesCss};`
            ret.push(finalSelector + '{' + css + '}')
          }
        }
      } else {
        break;
      }
    }
    return ret

    // 查找css尾部，兼容 @keyframes {10%{...}}
    function findCssEnd(src, start) {
      var level = 1
      var cssEnd = start
      while (true) {
        cssEnd++
        var char = src[cssEnd]
        if (!char) {
          return -1
        } else if (char === '{') {
          level++
        } else if (char === '}') {
          level--
          if (level === 0) {
            break
          }
        }
      }
      return cssEnd
    }

    function changeEach(selector, surfix, prefix) {
      surfix = surfix || ''
      prefix = prefix || ''
      return selector.split(',').map(function (s) {
        return prefix + s + surfix
      }).join(',')
    }
  }

  checkIsColorValue(colorVal) {
    let type = '', mode = undefined;
    if (/^rgb\(/.test(colorVal)) {
      //如果是rgb开头，200-249，250-255，0-199
      type = "^[rR][gG][Bb][\(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){2}[\\s]*(2[0-4]\\d|25[0-5]|[01]?\\d\\d?)[\\s]*[\)]{1}$";
      mode = 'rgb';
    } else if (/^rgba\(/.test(colorVal)) {
      //如果是rgba开头，判断0-255:200-249，250-255，0-199 判断0-1：0 1 1.0 0.0-0.9
      type = "^[rR][gG][Bb][Aa][\(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){3}[\\s]*(1|1.0|0|0.[0-9])[\\s]*[\)]{1}$";
      mode = 'rgba';
    } else if (/^#/.test(colorVal)) {
      //六位或者三位
      type = "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$"
      mode = 'hex';
    } else if (/^hsl\(/.test(colorVal)) {
      //判断0-360 判断0-100%(0可以没有百分号)
      type = "^[hH][Ss][Ll][\(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*)[\)]$";
      mode = 'hsl';
    } else if (/^hsla\(/.test(colorVal)) {
      type = "^[hH][Ss][Ll][Aa][\(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,){2}([\\s]*(1|1.0|0|0.[0-9])[\\s]*)[\)]$";
      mode = 'hsla';
    } else if (/^hsv\(/.test(colorVal)) {
      //判断0-360 判断0-100%(0可以没有百分号)
      type = "^[hH][Ss][Vv][\(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*)[\)]$";
      mode = 'hsv';
    }

    let valid = false;
    if (type) {
      let re = new RegExp(type);
      valid = !!colorVal.match(re)
    }

    if (!valid) {
      const tryValue = convert.keyword.rgb(colorVal)
      if (typeof tryValue === 'object') {
        mode = 'keyword',
          valid = true
      }
    }

    return {
      valid,
      mode
    }
  }

  hookParse(parsed, options = {}) {
    const {
      colorValueHook = (value) => value,
      enableAutoConvertRGB2Hex = false
    } = options

    const that = this
    const oldCssCode = parsed.toString()

    parsed.walk(function (node) {
      // 1. process colors in css code
      const oldValue = node.value
      const {valid, type, mode} = that.checkIsColorValue(node.value)

      if (valid) {
        node.type = 'word';
        if (enableAutoConvertRGB2Hex && ['rgba', 'rgb'].includes(mode)) {
          var color = node.nodes.filter(function (node) {
            return node.type === 'word';
          }).map(function (node) {
            return Number(node.value);
          }); // [233, 45, 66, .5]

          node.value = `#${convert.rgb.hex(color)}`;
        } else if (mode === 'hex') {
          node.value = `#${convert.rgb.hex(convert.hex.rgb(node.value))}`;
        } else if (mode === 'hsl') {
          node.value = `#${convert.hsl.hex(color)}`;
        } else if (mode === 'hsv') {
          node.value = `#${convert.hsv.hex(color)}`;
        } else if (mode === 'keyword') {
          node.value = `#${convert.rgb.hex(convert.keyword.rgb(node.value))}`;
        }

        if (typeof colorValueHook === 'function') {
          /**
           * @example
           * if (['hex', 'keyword'].includes(mode) && colorValueHook) { }
           */
          try {
            node.value = colorValueHook && colorValueHook(node.value, {
              node,
              mode
            }) || node.value
          } catch (e) {
            console.error(e)
          }
        }

        // debug
        if (0 && oldValue.toLowerCase() !== node.value.toLowerCase()) {
          console.log(`${oldValue} => ${node.value}`, oldCssCode)
        }
      }

      // 2. process others

      // 3. no modify
      return true
    })

    return parsed.toString()
  }

  getRules(cssCode = '', selector = '') {
    var ret = []

    let transformCode = ''
    try {
      // transform css code
      transformCode = cssCode.split(';').map(part =>
        this.hookParse(valueParser(part), this.options.cssParseProps).trim()
      ).filter(code => code.trim().length > 0).join(';')
    } catch (e) {
      console.error(e)
    }


    // for drop duplicate, leave code
    Array.from(new Set([transformCode])).forEach((code) => {
      var rules = code.split(';')

      rules.forEach(rule => {
        if (this.testCssCode(rule)) {
          ret.push(rule.replace(SpaceReg, ' '))
        }
      })
    })

    // debug
    if (0 && cssCode.includes('#fff;')) {
      this.tempContents.push(`${selector.trim()} { ${ret.join(';')} }; ----> ${cssCode}`)
    }

    return ret
  }

  getTempContents() {
    return this.tempContents
  }

  testCssCode(cssCode) {
    for (var colorReg of this.matchColorRegs) {
      if (colorReg.test(cssCode)) return true // && !ExclueCssReg.test(cssCode)
    }
    return false
  }

}


module.exports = Extractor
