'use strict';

/**
 * 合并站点与主题的 Waline 配置。
 * 优先级：站点根级 config.waline > theme_config / 主题 _config 的 theme.waline
 */
hexo.extend.helper.register('waline_config', function () {
  const themeCfg = (this.theme && this.theme.waline) || {};
  const siteCfg = (this.config && this.config.waline) || {};
  return Object.assign({}, themeCfg, siteCfg);
});

hexo.extend.helper.register('waline_enabled', function () {
  const cfg = this.waline_config();
  return !!(cfg && cfg.enable && cfg.serverURL);
});
