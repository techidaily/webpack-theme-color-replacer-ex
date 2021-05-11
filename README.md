# webpack-theme-color-replacer-ex

The `webpack-theme-color-replacer-ex` is based on `webpack-theme-color-replacer`, supports multiple plugin configurations, supports automatic processing based on the color array. 

[![NPM](https://nodei.co/npm/webpack-theme-color-replacer-ex.png?downloads=true)](https://nodei.co/npm/webpack-theme-color-replacer-ex/)

<br/>
<a href="https://www.buymeacoffee.com/techidaily"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" style="height: 41px !important; width: 174px !important; box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; -webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; "  target="_blank"></a>
<br/><br/>

## Feature

* Completely based on the `webpack-theme-color-replacer` source code
* Fully compatible with the 'webpack-theme-color-replacer' plug-in
* (New) multiple plugins can be configured to solve the problem of mixed composition of different themes in style processing
* (New) compatible with 3-bit color value in hexadecimal, such as `#FFF`. When the theme color is `ffffff`, the corresponding selector will be obtained normally
* (New) if the color value is the color name, such as red, the theme color will be processed normally when `#ff0000` (6 bits in hexadecimal)
* (New) if the color value is HSL, when the theme color is `#ff0000` (6bits in hexadecimal), it will also be processed normally
* (New) when the color value is HSV, when the theme color is `#ff0000` (6bits in hexadecimal), it will also be processed normally
* (New) support CSS code parsing configuration - `{'cssparseprops'}`
* Colorvaluehook: set the processing of color values during parsing `(default: (color, options) = > {})`
* Enable autoconvertrgb2hex: automatically convert `RGB/RGBA` color values to hexadecimal color values during parsing `(default: false)`
* (New) support forced color replacement

## Install

```bash
npm i -D webpack-theme-color-replacer-ex
```

<br/>
<a href="https://www.buymeacoffee.com/techidaily"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" style="height: 41px !important; width: 174px !important; box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; -webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; "  target="_blank"></a>
<br/><br/>

## Usage

### Define the theme color configurations

```js 

// webpack-theme-color-replacer-ex
// ./config/plugin.config.js

const ThemeColorReplacer = require('webpack-theme-color-replacer-ex')
const generate = require('@ant-design/colors/lib/generate').default

const getAntdSerials = (color) => {
  const lightens = new Array(9).fill().map((t, i) => {
    return ThemeColorReplacer.varyColor.lighten(color, i / 10)
  })
  const colorPalettes = generate(color)
  const rgb = ThemeColorReplacer.varyColor.toNum3(color.replace('#', '')).join(',')

  const colors = lightens.concat(colorPalettes).concat(rgb)
  return colors
}


const themePluginOption = {
  cssParseProps: {
    colorValueHook: (color, options) => {
      if (['hex', 'keyword'].includes(options?.mode)) {
        color = color.toLowerCase()
      } 
      return color
    },
    enableAutoConvertRGB2Hex: false
  },
  injectCss: true,
  matchColors: [].concat(getAntdSerials('#0ea8d0'), getAntdSerials('#0d9cc2')),
  changeSelector (selector, util) {
    switch (selector) {
      case '.ant-calendar-today .ant-calendar-date':
        return ':not(.ant-calendar-selected-date):not(.ant-calendar-selected-day)' + selector
      case '.ant-btn:focus,.ant-btn:hover':
        return '.ant-btn:focus:not(.ant-btn-primary):not(.ant-btn-danger),.ant-btn:hover:not(.ant-btn-primary):not(.ant-btn-danger)'
      case '.ant-btn.active,.ant-btn:active':
        return '.ant-btn.active:not(.ant-btn-primary):not(.ant-btn-danger),.ant-btn:active:not(.ant-btn-primary):not(.ant-btn-danger)'
      case '.ant-steps-item-process .ant-steps-item-icon > .ant-steps-icon':
      case '.ant-steps-item-process .ant-steps-item-icon>.ant-steps-icon':
        return ':not(.ant-steps-item-process)' + selector
      // fixed https://github.com/vueComponent/ant-design-vue-pro/issues/876
      case '.ant-steps-item-process .ant-steps-item-icon':
        return ':not(.ant-steps-item-custom)' + selector
      case '.ant-menu-horizontal>.ant-menu-item-active,.ant-menu-horizontal>.ant-menu-item-open,.ant-menu-horizontal>.ant-menu-item-selected,.ant-menu-horizontal>.ant-menu-item:hover,.ant-menu-horizontal>.ant-menu-submenu-active,.ant-menu-horizontal>.ant-menu-submenu-open,.ant-menu-horizontal>.ant-menu-submenu-selected,.ant-menu-horizontal>.ant-menu-submenu:hover':
      case '.ant-menu-horizontal > .ant-menu-item-active,.ant-menu-horizontal > .ant-menu-item-open,.ant-menu-horizontal > .ant-menu-item-selected,.ant-menu-horizontal > .ant-menu-item:hover,.ant-menu-horizontal > .ant-menu-submenu-active,.ant-menu-horizontal > .ant-menu-submenu-open,.ant-menu-horizontal > .ant-menu-submenu-selected,.ant-menu-horizontal > .ant-menu-submenu:hover':
        return '.ant-menu-horizontal > .ant-menu-item-active,.ant-menu-horizontal > .ant-menu-item-open,.ant-menu-horizontal > .ant-menu-item-selected,.ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-item:hover,.ant-menu-horizontal > .ant-menu-submenu-active,.ant-menu-horizontal > .ant-menu-submenu-open,.ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-submenu-selected,.ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-submenu:hover'
      case '.ant-menu-horizontal > .ant-menu-item-selected > a':
      case '.ant-menu-horizontal>.ant-menu-item-selected>a':
        return '.ant-menu-horizontal:not(ant-menu-light):not(.ant-menu-dark) > .ant-menu-item-selected > a'
      case '.ant-menu-horizontal>.ant-menu-item>a:hover':
        return '.ant-menu-horizontal:not(ant-menu-light):not(.ant-menu-dark) > .ant-menu-item > a:hover'
      default :
        return selector
    }
  }
}


const customThemePluginOption = {
  injectCss: true,
  matchColors: [].concat(getAntdSerials('#025270')),
  changeSelector (selector, util) {
    switch (selector) {
      case '.app-header__left':
        return ':not(.app-header__left)' + selector
      default :
        return selector
    }
  }
}

const customHeaderColorOption = {
  injectCss: true,
  matchColors: [].concat(getAntdSerials('#ffffff')),
  changeSelector (selector, util) {
    if (selector.includes('.app-header__center')) {
      return selector
    }
    return false
  }
}


const createCustomThemeColorReplacerPlugins = () => [
  new ThemeColorReplacer(customHeaderColorOption),
  new ThemeColorReplacer(themePluginOption),
  new ThemeColorReplacer(customThemePluginOption),
]

module.exports = createCustomThemeColorReplacerPlugins

```

### webpack plugins


eg.

```js
const resolve = require('path').resolve
const createThemeColorReplacerPlugins = require('./config/plugin.config')

export default {

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [],
  

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    // Build Configuration: `nuxt.js-2.15.2\packages\config\src\config\build.js` about loaders
    loaders: {
      less: {
        lessOptions: {
          javascriptEnabled: true
        }
      }
    },
    plugins: [
      ...createThemeColorReplacerPlugins()
    ]
  },
}


```

### How to switch themes?

```js

import client from 'webpack-theme-color-replacer-ex/client'
import generate from '@ant-design/colors/lib/generate'

let switchOn = false

export default {
  getAntdSerials (color) {
    const lightens = new Array(9).fill().map((t, i) => {
      return client.varyColor.lighten(color, i / 10)
    })

    const colorPalettes = generate(color)
    const rgb = client.varyColor.toNum3(color.replace('#', '')).join(',')
    return lightens.concat(colorPalettes).concat(rgb)
  },
  changeColor (newColor) {
    const newColors = [newColor, newColor, ['#ddd', '#00f'][(switchOn ? 0 : 1)]]
    switchOn = !switchOn
    var options = {
      /* When the color array is the same, do you want to force CSS update  */  
      forceChange: true,
      /* New color array */
      newColors: newColors.reduce((colors, newColor) => {
        return colors.concat(this.getAntdSerials(newColor))
      }, []), // new colors array, one-to-one corresponde with `matchColors`
      /* If you use CSS URL, you can customize the CSS URL */
      changeUrl (cssUrl) {
        return `/${cssUrl}` // while router is not `hash` mode, it needs absolute path
      }
    }
    return client.changer.changeColor(options, Promise)
  }
}

```

`changeColor` is the calling method

<br/>
<a href="https://www.buymeacoffee.com/techidaily"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" style="height: 41px !important; width: 174px !important; box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; -webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important; "  target="_blank"></a>
<br/><br/>

## License

MIT License

Copyright (c) 2021 Techidaily (https://techidaily.com)
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.