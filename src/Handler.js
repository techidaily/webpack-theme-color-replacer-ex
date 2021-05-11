'use strict';

var AssetsExtractor = require('./AssetsExtractor')
var replaceFileName = require('./replaceFileName')
var {ConcatSource} = require('webpack-sources');
var LineReg = /\n/g
var cfgIndex = 0
var themeJsInjectedMap = {}

module.exports = class Handler {
  constructor(options) {
    const defaultKey = `${Date.now()}${cfgIndex++}`
    // Default options
    this.options = Object.assign({
      fileName: `css/theme-$cfg$-[contenthash:8].css`,
      matchColors: [],
      isJsUgly: !(process.env.NODE_ENV === 'development' || process.argv.find(arg => arg.match(/\bdev/))),
      variables: {
        themeCfg: '___theme_$$_cfg',
        themeCss: '___theme_$$_css'
      },
      cssParseProps: {
        colorValueHook: (color, options) => {},
        enableAutoConvertRGB2Hex: false
      },
      key: defaultKey
    }, options);
    this.assetsExtractor = new AssetsExtractor(this.options)
    this.cfgKey = this.options.key || defaultKey
  }

  handle(compilation) {
    var output = this.assetsExtractor.extractAssets(compilation.assets);

    //Add to assets for output
    var outputName = getFileName(this.options.fileName, output)
    compilation.assets[outputName] = {
      source: () => output,
      size: () => output.length
    };

    // 记录动态的文件名，到每个入口
    this.addToEntryJs(outputName, compilation, output)

    function getFileName(fileName, src) {
      return compilation.getPath(replaceFileName(fileName, src), {})
    }
  }

// 自动注入js代码，设置css文件名
  addToEntryJs(outputName, compilation, cssCode) {
    var onlyEntrypoints = {
      entrypoints: true,
      errorDetails: false,
      modules: false,
      assets: false,
      children: false,
      chunks: false,
      chunkGroups: false
    }
    var entrypoints = compilation.getStats().toJson(onlyEntrypoints).entrypoints;
    Object.keys(entrypoints).forEach(entryName => {
      var entryAssets = entrypoints[entryName].assets
      for (var i = 0, l = entryAssets.length; i < l; i++) {
        var assetName = entryAssets[i].name || entryAssets[i];
        if (assetName.slice(-3) === '.js' && assetName.indexOf('manifest.') === -1) { //
          var assetSource = compilation.assets[assetName]
          if (assetSource) {
            const configJs = this.getEntryJs(outputName, assetSource, cssCode)
            const cSrc = new ConcatSource(assetSource, configJs)
            compilation.assets[assetName] = cSrc
            break;
          }
        }
      }
    })
  }

  _getCfgHash(cfg) {
    const {config = {}, cssCode = ''} = cfg
    return JSON.stringify({
      colors: config.colors || [], cssCode
    })
  }

  isDuplicate(cfg) {
    return Object.values(themeJsInjectedMap).some(({_data: curCfg}) => {
      return this._getCfgHash(curCfg) === this._getCfgHash(cfg)
    })
  }

  dropDuplicate(cfg) {
    Object.keys({ ...themeJsInjectedMap }).forEach(key => {
      const preCfg = themeJsInjectedMap[key]
      if (this._getCfgHash(preCfg) === this._getCfgHash(cfg)) {
        delete themeJsInjectedMap[key]
      }
    })
  }

  mergeConfigJS() {
    var configJs = `
this.${this.options.variables.themeCfg}={};
this.${this.options.variables.themeCss}={};
      `

    Object.keys(themeJsInjectedMap).sort((a, b) => a - b).forEach((key) => {
      const {_data} = themeJsInjectedMap[key]
      const {config, cssCode} = _data

      configJs = `${configJs}
this.${this.options.variables.themeCfg}[${key}]=${JSON.stringify(config)};
this.${this.options.variables.themeCss}[${key}]=${JSON.stringify(cssCode.replace(LineReg, ''))};
        `
    })

    return configJs
  }


  getEntryJs(outputName, assetSource, cssCode) {
    const config = {url: outputName, colors: this.options.matchColors}

    if(this.isDuplicate({config, cssCode})) {
      this.dropDuplicate({config, cssCode})
    }

    themeJsInjectedMap[this.cfgKey] = {
      _data: {
        outputName,
        config,
        cssCode
      }
    }

    return this.mergeConfigJS()
  }
}


