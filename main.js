// ==UserScript==
// @name         标题批量导出DBLP的BibTeX
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  在网页左下角生成一个按钮，从dblp中获取选定文本的BibTeX并复制到剪贴板。支持批量获取，支持从剪贴板读取，支持随时下载，支持导出URL和CSV。白名单模式。
// @author       shandianchengzi
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @license      GPL-3.0
// @noframes
// ==/UserScript==

// Inject Custom CSS
const css = `
#dblp-batch-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 25px;
    padding-top: 35px;
    border-radius: 10px;
    z-index: 100000;
    text-align: center;
    min-width: 400px;
    max-width: 90%;
    backdrop-filter: blur(5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: none;
}

#dblp-batch-title {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
}

#dblp-batch-current {
    font-size: 14px;
    margin-bottom: 20px;
    color: #ccc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
    min-height: 5px;
}

#dblp-failed-section {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255,255,255,0.2);
    display: none;
    text-align: left;
}

#dblp-failed-title {
    font-size: 13px;
    color: #ff6b6b;
    margin-bottom: 8px;
    font-weight: bold;
}

#dblp-failed-textarea {
    width: 100%;
    min-height: 80px;
    max-height: 150px;
    background: rgba(255,255,255,0.1);
    color: #ffcccc;
    border: 1px solid rgba(255,107,107,0.3);
    border-radius: 6px;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    resize: vertical;
    box-sizing: border-box;
    outline: none;
}

#dblp-failed-textarea:focus {
    border-color: rgba(255,107,107,0.6);
    background: rgba(255,255,255,0.15);
}

#dblp-close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.3);
    border: 1px solid rgba(255,255,255,0.2);
    color: #ddd;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    padding: 0;
}

#dblp-close-btn:hover {
    background: rgba(128, 128, 128, 0.5);
    color: white;
    transform: scale(1.1);
}

#dblp-failed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

#dblp-retry-btn {
    background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

#dblp-retry-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(66, 133, 244, 0.4);
}

#dblp-success-section {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255,255,255,0.2);
    display: none;
    text-align: left;
}

#dblp-success-title {
    font-size: 13px;
    color: #51cf66;
    font-weight: bold;
}

#dblp-success-textarea {
    width: 100%;
    min-height: 100px;
    max-height: 200px;
    background: rgba(255,255,255,0.1);
    color: #ccffdd;
    border: 1px solid rgba(81, 207, 102, 0.3);
    border-radius: 6px;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    resize: vertical;
    box-sizing: border-box;
    outline: none;
}

#dblp-success-textarea:focus {
    border-color: rgba(81, 207, 102, 0.6);
    background: rgba(255,255,255,0.15);
}

#dblp-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.dblp-copy-icon {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 4px;
    color: #ddd;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 14px;
    transition: all 0.2s;
    flex-shrink: 0;
}

.dblp-copy-icon:hover {
    background: rgba(255,255,255,0.2);
    color: white;
    transform: scale(1.05);
}

.dblp-btn {
    border: none;
    border-radius: 6px;
    padding: 8px 15px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
    margin: 5px;
    outline: none;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

#dblp-btn-download {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}
#dblp-btn-download:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(118, 75, 162, 0.4); }

#dblp-btn-copy-urls {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
}
#dblp-btn-copy-urls:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(56, 239, 125, 0.4); }

#dblp-btn-csv {
    background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%);
    color: white;
}
#dblp-btn-csv:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(255, 94, 98, 0.4); }

#dblp-btn-close {
    background: rgba(255, 255, 255, 0.15);
    color: #ddd;
    border: 1px solid rgba(255,255,255,0.2);
}
#dblp-btn-close:hover { background: rgba(255, 255, 255, 0.25); color: white; }

/* Confirm Modal */
#dblp-confirm-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: #333;
    padding: 20px;
    border-radius: 8px;
    z-index: 100001;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    text-align: center;
    max-width: 400px;
    display: none;
}
#dblp-confirm-text {
    background: #f5f5f5;
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
    font-family: monospace;
    text-align: left;
    max-height: 100px;
    overflow-y: auto;
    font-size: 12px;
}

/* Scholar Confirm Modal */
#dblp-scholar-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 100004;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    text-align: center;
    max-width: 500px;
    width: 90%;
    display: none;
    backdrop-filter: blur(5px);
}
#dblp-scholar-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 15px;
}
#dblp-scholar-list {
    background: rgba(255,255,255,0.1);
    padding: 10px;
    margin: 10px 0;
    border-radius: 6px;
    max-height: 200px;
    overflow-y: auto;
    text-align: left;
    font-size: 12px;
    font-family: monospace;
}
#dblp-scholar-item {
    padding: 4px 8px;
    margin: 2px 0;
    background: rgba(255,255,255,0.05);
    border-radius: 4px;
    word-break: break-all;
}
#dblp-scholar-item:hover {
    background: rgba(255,255,255,0.15);
}

/* Whitelist Modal */
#dblp-whitelist-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9); color: white; padding: 25px;
    border-radius: 10px; z-index: 100002; display: none;
    width: 400px; max-width: 90%; text-align: center;
    backdrop-filter: blur(5px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}
#dblp-whitelist-textarea {
    width: 100%; height: 150px; background: rgba(255,255,255,0.1); color: #fff;
    border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 10px;
    margin: 15px 0; font-family: monospace; resize: vertical; box-sizing: border-box; outline: none;
}
#dblp-whitelist-textarea:focus { border-color: #007BFF; }

/* Citation Format Modal */
#dblp-citation-modal {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9); color: white; padding: 25px;
    border-radius: 10px; z-index: 100003; display: none;
    width: 450px; max-width: 90%; text-align: left;
    backdrop-filter: blur(5px); box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}
#dblp-citation-modal h3 {
    font-size: 18px; font-weight: bold; margin-bottom: 15px; text-align: center;
}
#dblp-citation-presets {
    display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;
}
.dblp-citation-preset {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s;
    display: flex; align-items: center; gap: 10px;
}
.dblp-citation-preset:hover { background: rgba(255,255,255,0.2); }
.dblp-citation-preset.active {
    background: rgba(0, 123, 255, 0.3); border-color: #007BFF;
}
.dblp-citation-preset input[type="radio"] {
    margin: 0; cursor: pointer;
}
.dblp-citation-preset-label {
    flex: 1; font-size: 13px;
}
.dblp-citation-preset-example {
    font-size: 11px; color: #aaa; font-family: monospace;
}
#dblp-citation-custom-section {
    border-top: 1px solid rgba(255,255,255,0.2); padding-top: 15px; margin-top: 10px;
}
#dblp-citation-custom-input {
    width: 100%; background: rgba(255,255,255,0.1); color: #fff;
    border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; padding: 10px;
    margin: 10px 0; font-family: monospace; box-sizing: border-box; outline: none;
}
#dblp-citation-custom-input:focus { border-color: #007BFF; }
#dblp-citation-help {
    font-size: 11px; color: #aaa; line-height: 1.6; margin-bottom: 15px;
}
#dblp-citation-preview {
    background: rgba(0, 123, 255, 0.2); border-radius: 6px; padding: 10px;
    margin: 10px 0; font-family: monospace; font-size: 12px; text-align: center;
    min-height: 40px; display: flex; align-items: center; justify-content: center;
}
.dblp-modal-buttons {
    display: flex; justify-content: center; gap: 10px; margin-top: 15px;
}
`;

if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(css);
} else {
    const styleNode = document.createElement('style');
    styleNode.innerHTML = css;
    document.head.appendChild(styleNode);
}

// Toast function
function Toast(msg, duration) {
  duration = isNaN(duration) ? 3000 : duration;
  var m = document.createElement('div');
  m.innerHTML = msg;
  m.style.cssText = "font-family: 'siyuan'; max-width: 60%; min-width: 150px; padding: 10px 14px; height: auto; color: rgb(255, 255, 255); line-height: 1.5; text-align: center; border-radius: 4px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999999; background: rgba(0, 0, 0, 0.7); font-size: 16px;";
  document.body.appendChild(m);
  setTimeout(function() {
      m.style.transition = 'opacity 0.5s ease-in';
      m.style.opacity = '0';
      setTimeout(function() {
          if(m.parentNode) document.body.removeChild(m);
      }, 500);
  }, duration);
}

var headers = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36",
  'Referer': 'https://dblp.org/'
};

(function() {
  'use strict';

  var lang=navigator.appName=="Netscape"?navigator.language:navigator.userLanguage;
  var lang_hint = {
    error_no_text: "没有选中文本且剪贴板为空！",
    clipboard_confirm: "未选中文本。是否使用剪贴板内容？",
    clipboard_read_err: "无法读取剪贴板，请手动选择文本。",
    fetching_one: "正在获取...",
    done_copy: "已完成并复制！",
    batch_title: (cur, total) => `批量提取中: ${cur} / ${total}`,
    batch_done_title: (total) => `批量提取完成（${total}条）`,
    download_btn: "下载 BibTeX (.bib)",
    copy_urls_btn: "仅复制 URL",
    csv_btn: "下载表格 (.csv)",
    close_btn: "关闭面板",
    current_prefix: "正在搜索: ",
    default_btn: "获取 BibTeX",
    urls_copied: "URLs 已复制到剪贴板！",
    // 失败提示
    failed_summary: (failed) => `以下是获取失败的（${failed} 条），可以去谷歌学术搜索：`,
    success_summary: (total) => `完整提取结果（${total} 条）：`,
    copied_to_clipboard: "已复制到剪贴板",
    scholar_confirm_title: "确认打开以下 Google Scholar 搜索？",
    scholar_confirm_open: "打开",
    scholar_confirm_cancel: "取消",
    // 白名单相关提示
    menu_whitelist_config: "设置站点白名单",
    menu_add_current: "将本域名添加到白名单",
    menu_disable: "全局禁用",
    menu_enable: "启用功能",
    whitelist_prompt: "请输入白名单域名（每行一个）：",
    whitelist_saved: "白名单已保存",
    domain_added: "域名已添加到白名单",
    domain_already_exists: "该域名已在白名单中",
    feature_disabled: "功能已全局禁用",
    feature_enabled: "功能已启用",
    // 引用格式相关提示
    menu_citation_config: "设置引用标志格式",
    citation_title: "引用标志格式设置",
    citation_preset_default: "默认（DBLP原始）",
    citation_preset_author_year: "作者姓氏 + 年份",
    citation_preset_firstword_year_author: "题目首词 + 年份 + 作者首词",
    citation_preset_author_year_title: "作者 + 年份 + 题目关键词",
    citation_custom_label: "自定义模板",
    citation_help: "可用占位符：{firstAuthor}第一作者姓氏, {year}年份, {firstWord}标题首词, {titleWords:N}标题前N词",
    citation_preview: "预览：",
    citation_saved: "引用格式已保存",
    citation_example_title: "示例：Deep Learning for NLP (2024, 作者: Smith, Johnson)"
  };

  if (!lang.startsWith('zh')) {
      lang_hint = {
          error_no_text: "No text selected and clipboard is empty!",
          clipboard_confirm: "No text selected. Use clipboard content?",
          clipboard_read_err: "Cannot read clipboard.",
          fetching_one: "Fetching...",
          done_copy: "Done & Copied!",
          batch_title: (cur, total) => `Processing: ${cur} / ${total}`,
          batch_done_title: (total) => `Batch Complete (${total} items)`,
          download_btn: "Download BibTeX",
          copy_urls_btn: "Copy URLs",
          csv_btn: "Download CSV",
          close_btn: "Close",
          current_prefix: "Searching: ",
          default_btn: "Get BibTeX",
          urls_copied: "URLs copied to clipboard!",
          // 失败提示
          failed_summary: (failed) => `Failed items (${failed}), you can search on Google Scholar:`,
          success_summary: (total) => `Complete results (${total} items):`,
          copied_to_clipboard: "Copied to clipboard",
          scholar_confirm_title: "Open the following Google Scholar searches?",
          scholar_confirm_open: "Open",
          scholar_confirm_cancel: "Cancel",
          // 白名单相关提示
          menu_whitelist_config: "Configure Site Whitelist",
          menu_add_current: "Add Current Domain to Whitelist",
          menu_disable: "Disable Globally",
          menu_enable: "Enable Feature",
          whitelist_prompt: "Enter whitelist domains (one per line):",
          whitelist_saved: "Whitelist saved",
          domain_added: "Domain added to whitelist",
          domain_already_exists: "Domain already in whitelist",
          feature_disabled: "Feature disabled globally",
          feature_enabled: "Feature enabled",
          // 引用格式相关提示
          menu_citation_config: "Configure Citation Key Format",
          citation_title: "Citation Key Format Settings",
          citation_preset_default: "Default (DBLP Original)",
          citation_preset_author_year: "Author Surname + Year",
          citation_preset_firstword_year_author: "First Word + Year + First Author",
          citation_preset_author_year_title: "Author + Year + Title Keyword",
          citation_custom_label: "Custom Template",
          citation_help: "Available placeholders: {firstAuthor} first author surname, {year} year, {firstWord} first title word, {titleWords:N} first N title words",
          citation_preview: "Preview: ",
          citation_saved: "Citation format saved",
          citation_example_title: "Example: Deep Learning for NLP (2024, Authors: Smith, Johnson)"
      };
  }

  // --- 白名单配置管理函数 ---
  const DEFAULT_WHITELIST = ['dblp.org', 'scholar.google.com'];

  function getWhitelist() {
    const saved = GM_getValue('dblp_whitelist', '');
    if (!saved) {
      return DEFAULT_WHITELIST;
    }
    return saved.split('\n').filter(domain => domain.trim() !== '');
  }

  function saveWhitelist(domains) {
    GM_setValue('dblp_whitelist', domains.join('\n'));
  }

  function isInWhitelist() {
    const currentDomain = window.location.hostname;
    const whitelist = getWhitelist();

    return whitelist.some(domain => {
      // 支持完整匹配或子域名匹配
      return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
  }

  function isGloballyEnabled() {
    return GM_getValue('dblp_enabled', true);
  }

  function setGlobalEnabled(enabled) {
    GM_setValue('dblp_enabled', enabled);
  }

  // --- 引用格式配置管理函数 ---

  // 预设格式定义
  const CITATION_PRESETS = {
    default: {
      name: 'citation_preset_default',
      template: null, // null表示保持原始格式
      example: 'DBLP:conf/aaai/Smith2024'
    },
    author_year: {
      name: 'citation_preset_author_year',
      template: '{firstAuthor}{year}',
      example: 'Smith2024'
    },
    firstword_year_author: {
      name: 'citation_preset_firstword_year_author',
      template: '{firstWord}{year}{firstAuthor}',
      example: 'Deep2024Smith'
    },
    author_year_title: {
      name: 'citation_preset_author_year_title',
      template: '{firstAuthor}{year}{firstWord}',
      example: 'Smith2024Deep'
    }
  };

  function getCitationFormat() {
    return GM_getValue('dblp_citation_format', 'default');
  }

  function getCustomTemplate() {
    return GM_getValue('dblp_custom_template', '{firstAuthor}{year}');
  }

  function saveCitationFormat(format) {
    GM_setValue('dblp_citation_format', format);
  }

  function saveCustomTemplate(template) {
    GM_setValue('dblp_custom_template', template);
  }

  // 解析BibTeX字段并生成新的引用标志
  function generateCitationKey(bibtex) {
    if (!bibtex || bibtex === "None") return null;

    const format = getCitationFormat();
    let template = null;

    if (format === 'custom') {
      template = getCustomTemplate();
    } else if (CITATION_PRESETS[format]) {
      template = CITATION_PRESETS[format].template;
    }

    // 如果模板为null，保持原始格式
    if (!template) return null;

    // 提取BibTeX字段
    const author = extractBibField(bibtex, "author");
    const title = extractBibField(bibtex, "title");
    const year = extractBibField(bibtex, "year");

    // 解析作者
    let firstAuthorSurname = "Unknown";
    if (author && author !== "None") {
      // 作者格式通常是 "Surname, Name" 或 "Surname, Name and Surname, Name"
      const firstAuthor = author.split(' and ')[0].trim();
      const surnameMatch = firstAuthor.match(/^([A-Za-z]+),/);
      if (surnameMatch) {
        firstAuthorSurname = surnameMatch[1];
      } else {
        // 如果没有逗号，取整个第一个部分
        firstAuthorSurname = firstAuthor.split(' ')[0];
      }
    }

    // 解析年份
    let citationYear = year && year !== "None" ? year : "n.d.";

    // 解析标题首词
    let firstWord = "Unknown";
    if (title && title !== "None") {
      // 移除特殊字符，取第一个单词
      const cleanTitle = title.replace(/[{}]/g, '').trim();
      const words = cleanTitle.split(/\s+/);
      if (words.length > 0) {
        firstWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
      }
    }

    // 替换模板占位符
    let newKey = template
      .replace(/{firstAuthor}/g, firstAuthorSurname)
      .replace(/{year}/g, citationYear)
      .replace(/{firstWord}/g, firstWord);

    // 处理 {titleWords:N} 占位符
    const titleWordsMatch = template.match(/{titleWords:(\d+)}/g);
    if (titleWordsMatch && title && title !== "None") {
      const cleanTitle = title.replace(/[{}]/g, '').trim();
      const words = cleanTitle.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, '')).filter(w => w);

      titleWordsMatch.forEach(match => {
        const n = parseInt(match.match(/{titleWords:(\d+)}/)[1]);
        const selectedWords = words.slice(0, Math.min(n, words.length));
        const wordsStr = selectedWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        newKey = newKey.replace(match, wordsStr);
      });
    }

    // 确保首字母大写，其余小写（对于作者和首词）
    newKey = newKey.replace(/(^|[^a-zA-Z])([a-z])/g, (_, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });

    return newKey;
  }

  // 替换BibTeX中的引用标志
  function rewriteBibTeXCitationKey(bibtex) {
    if (!bibtex || bibtex === "None") return bibtex;

    const newKey = generateCitationKey(bibtex);
    if (!newKey) return bibtex;

    // 匹配 @type {oldKey, 替换为 @type {newKey,
    const citeKeyMatch = bibtex.match(/^@\w+\s*\{([^,]+),/);
    if (citeKeyMatch) {
      const oldKey = citeKeyMatch[1];
      return bibtex.replace(/^@\w+\s*\{([^,]+),/, `@${citeKeyMatch[0].match(/^@(\w+)/)[1]} {${newKey},`);
    }

    return bibtex;
  }

  // --- UI Elements Creation ---

  // 1. Trigger Button (不再需要关闭按钮)
  const button = document.createElement('button');
  button.innerText = lang_hint.default_btn;
  button.style.cssText = "position: fixed; bottom: 10px; left: 10px; z-index: 9999; padding: 10px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer; white-space: pre; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);";
  document.body.appendChild(button);

  // 2. Batch Overlay
  const overlay = document.createElement('div');
  overlay.id = 'dblp-batch-overlay';
  overlay.innerHTML = `
      <button id="dblp-close-btn">&times;</button>
      <div id="dblp-batch-title"></div>
      <div id="dblp-batch-current"></div>
      <div id="dblp-success-section">
          <div id="dblp-result-header">
              <div id="dblp-success-title"></div>
              <button id="dblp-copy-success" class="dblp-copy-icon">📋</button>
          </div>
          <textarea id="dblp-success-textarea" readonly></textarea>
      </div>
      <div id="dblp-failed-section">
          <div id="dblp-result-header">
              <div id="dblp-failed-header">
                  <div id="dblp-failed-title"></div>
                  <button id="dblp-retry-btn">Scholar</button>
              </div>
              <button id="dblp-copy-failed" class="dblp-copy-icon">📋</button>
          </div>
          <textarea id="dblp-failed-textarea"></textarea>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
             <button id="dblp-btn-download" class="dblp-btn">${lang_hint.download_btn}</button>
             <button id="dblp-btn-csv" class="dblp-btn">${lang_hint.csv_btn}</button>
             <button id="dblp-btn-copy-urls" class="dblp-btn">${lang_hint.copy_urls_btn}</button>
        </div>
      </div>
  `;
  document.body.appendChild(overlay);

  // 3. Confirm Modal
  const confirmModal = document.createElement('div');
  confirmModal.id = 'dblp-confirm-modal';
  confirmModal.innerHTML = `
      <div style="font-weight:bold; margin-bottom:10px;">${lang_hint.clipboard_confirm}</div>
      <div id="dblp-confirm-text"></div>
      <div style="display:flex; justify-content:center; gap:10px;">
          <button id="dblp-confirm-yes" class="dblp-btn" style="background:#28a745; color:white;">Yes</button>
          <button id="dblp-confirm-no" class="dblp-btn" style="background:#dc3545; color:white;">No</button>
      </div>
  `;
  document.body.appendChild(confirmModal);

  // 3.1. Scholar Confirm Modal
  const scholarModal = document.createElement('div');
  scholarModal.id = 'dblp-scholar-modal';
  scholarModal.innerHTML = `
      <div id="dblp-scholar-title">${lang_hint.scholar_confirm_title}</div>
      <div id="dblp-scholar-list"></div>
      <div style="display:flex; justify-content:center; gap:10px; margin-top:15px;">
          <button id="dblp-scholar-confirm" class="dblp-btn" style="background:#28a745; color:white;">${lang_hint.scholar_confirm_open}</button>
          <button id="dblp-scholar-cancel" class="dblp-btn" style="background:#6c757d; color:white;">${lang_hint.scholar_confirm_cancel}</button>
      </div>
  `;
  document.body.appendChild(scholarModal);

  // 4. Whitelist Modal (新增面板)
  const whitelistModal = document.createElement('div');
  whitelistModal.id = 'dblp-whitelist-modal';
  whitelistModal.innerHTML = `
      <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">${lang_hint.menu_whitelist_config}</div>
      <div style="font-size:12px; color:#aaa; margin-bottom:5px; text-align:left;">${lang_hint.whitelist_prompt}</div>
      <textarea id="dblp-whitelist-textarea"></textarea>
      <div style="display:flex; justify-content:center; gap:10px;">
          <button id="dblp-whitelist-save" class="dblp-btn" style="background:#28a745; color:white;">Save</button>
          <button id="dblp-whitelist-cancel" class="dblp-btn" style="background:#6c757d; color:white;">Cancel</button>
      </div>
  `;
  document.body.appendChild(whitelistModal);

  // 5. Citation Format Modal (引用格式配置面板)
  const citationModal = document.createElement('div');
  citationModal.id = 'dblp-citation-modal';
  citationModal.innerHTML = `
      <h3>${lang_hint.citation_title}</h3>

      <div id="dblp-citation-presets"></div>

      <div id="dblp-citation-custom-section" style="display:none;">
          <div style="font-size:14px; font-weight:bold; margin-bottom:5px;">${lang_hint.citation_custom_label}</div>
          <input type="text" id="dblp-citation-custom-input" placeholder="{firstAuthor}{year}" />
          <div id="dblp-citation-help">${lang_hint.citation_help}</div>
      </div>

      <div id="dblp-citation-preview">${lang_hint.citation_preview}</div>

      <div class="dblp-modal-buttons">
          <button id="dblp-citation-save" class="dblp-btn" style="background:#28a745; color:white;">Save</button>
          <button id="dblp-citation-cancel" class="dblp-btn" style="background:#6c757d; color:white;">Cancel</button>
      </div>
  `;
  document.body.appendChild(citationModal);

  // 生成预设选项
  function renderCitationPresets() {
      const container = document.getElementById('dblp-citation-presets');
      container.innerHTML = '';

      const currentFormat = getCitationFormat();

      Object.entries(CITATION_PRESETS).forEach(([key, preset]) => {
          const label = lang_hint[preset.name];
          const div = document.createElement('div');
          div.className = 'dblp-citation-preset' + (currentFormat === key ? ' active' : '');
          div.innerHTML = `
              <input type="radio" name="citation-preset" value="${key}" ${currentFormat === key ? 'checked' : ''} />
              <div style="flex:1;">
                  <div class="dblp-citation-preset-label">${label}</div>
                  <div class="dblp-citation-preset-example">${preset.example}</div>
              </div>
          `;
          div.onclick = (e) => {
              if (e.target.type !== 'radio') {
                  const radio = div.querySelector('input[type="radio"]');
                  radio.checked = true;
              }
              // 更新选中状态
              document.querySelectorAll('.dblp-citation-preset').forEach(el => el.classList.remove('active'));
              div.classList.add('active');

              // 显示/隐藏自定义输入框
              const customSection = document.getElementById('dblp-citation-custom-section');
              if (key === 'custom') {
                  customSection.style.display = 'block';
                  const customInput = document.getElementById('dblp-citation-custom-input');
                  customInput.value = getCustomTemplate();
                  updateCitationPreview(customInput.value);
              } else {
                  customSection.style.display = 'none';
                  updateCitationPreview(preset.template);
              }
          };
          container.appendChild(div);
      });

      // 添加自定义选项
      const customDiv = document.createElement('div');
      customDiv.className = 'dblp-citation-preset' + (currentFormat === 'custom' ? ' active' : '');
      customDiv.innerHTML = `
          <input type="radio" name="citation-preset" value="custom" ${currentFormat === 'custom' ? 'checked' : ''} />
          <div style="flex:1;">
              <div class="dblp-citation-preset-label">${lang_hint.citation_custom_label}</div>
          </div>
      `;
      customDiv.onclick = (e) => {
          if (e.target.type !== 'radio') {
              const radio = customDiv.querySelector('input[type="radio"]');
              radio.checked = true;
          }
          document.querySelectorAll('.dblp-citation-preset').forEach(el => el.classList.remove('active'));
          customDiv.classList.add('active');

          const customSection = document.getElementById('dblp-citation-custom-section');
          customSection.style.display = 'block';
          const customInput = document.getElementById('dblp-citation-custom-input');
          customInput.value = getCustomTemplate();
          updateCitationPreview(customInput.value);
      };
      container.appendChild(customDiv);

      // 如果当前是自定义格式，显示自定义输入框
      if (currentFormat === 'custom') {
          document.getElementById('dblp-citation-custom-section').style.display = 'block';
          document.getElementById('dblp-citation-custom-input').value = getCustomTemplate();
      }
  }

  // 更新预览
  function updateCitationPreview(template) {
      const previewEl = document.getElementById('dblp-citation-preview');

      if (!template) {
          previewEl.textContent = lang_hint.citation_preview + ' ' + lang_hint.citation_preset_default;
          return;
      }

      // 生成示例
      const example = template
          .replace(/{firstAuthor}/g, 'Smith')
          .replace(/{year}/g, '2024')
          .replace(/{firstWord}/g, 'Deep')
          .replace(/{titleWords:(\d+)}/g, (_, n) => {
              const words = ['Deep', 'Learning', 'for', 'NLP'];
              return words.slice(0, parseInt(n)).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
          });

      previewEl.textContent = lang_hint.citation_preview + ' ' + example;
  }

  // 面板按钮事件
  const whitelistTextarea = document.getElementById('dblp-whitelist-textarea');

  document.getElementById('dblp-whitelist-save').onclick = () => {
      const text = whitelistTextarea.value;
      const domains = text.split('\n').map(d => d.trim()).filter(d => d !== '');
      saveWhitelist(domains);
      Toast(lang_hint.whitelist_saved);
      updateButtonVisibility();
      whitelistModal.style.display = 'none';
  };

  document.getElementById('dblp-whitelist-cancel').onclick = () => {
      whitelistModal.style.display = 'none';
  };

  // 引用格式模态框按钮事件
  const customInput = document.getElementById('dblp-citation-custom-input');

  customInput.addEventListener('input', (e) => {
      updateCitationPreview(e.target.value);
  });

  document.getElementById('dblp-citation-save').onclick = () => {
      // 获取选中的格式
      const selectedPreset = document.querySelector('input[name="citation-preset"]:checked');
      if (!selectedPreset) return;

      const format = selectedPreset.value;

      if (format === 'custom') {
          const template = customInput.value.trim();
          if (!template) {
              Toast(lang.startsWith('zh') ? '请输入自定义模板' : 'Please enter custom template');
              return;
          }
          saveCustomTemplate(template);
      }

      saveCitationFormat(format);
      Toast(lang_hint.citation_saved);
      citationModal.style.display = 'none';
  };

  document.getElementById('dblp-citation-cancel').onclick = () => {
      citationModal.style.display = 'none';
  };

  // --- Logic Variables ---
  let batchResults = []; // Stores BibTeX strings
  let batchLines = [];   // Stores original queries
  let isBatchProcessing = false;

  // --- Helper Functions ---

  // 清理中文字符和中文标点符号
  function cleanChineseText(text) {
    if (!text) return text;
    // 移除中文字符、中文标点符号和全角字符
    return text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '').trim();
  }

  function extractBibField(bibtex, fieldName) {
    if (!bibtex || bibtex === "None") return "None";

    const regex = new RegExp(`${fieldName}\\s*=\\s*\\{`, "i");
    const match = bibtex.match(regex);

    if (!match) return "None";

    let openCount = 1;
    let content = "";
    let startIndex = match.index + match[0].length;

    for (let i = startIndex; i < bibtex.length; i++) {
        const char = bibtex[i];
        if (char === '{') {
            openCount++;
        } else if (char === '}') {
            openCount--;
        }

        if (openCount === 0) {
            break;
        }
        content += char;
    }

    return content.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function downloadContent(content, filename) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download.txt';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  function fetchBibTeX(query, silent, callback) {
    const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(query)}`;
    GM_xmlhttpRequest({
        method: 'GET',
        url: searchUrl,
        headers: headers,
        onload: function(response) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.responseText, 'text/html');
            const bibLink = doc.querySelector('a[href*="?view=bibtex"]');
            if (!bibLink) {
                if(!silent) Toast("BibTeX Not Found");
                callback("None");
                return;
            }
            const bibUrl = bibLink.href.replace('.html?view=bibtex', '.bib');
            GM_xmlhttpRequest({
                method: 'GET',
                url: bibUrl,
                headers: headers,
                onload: function(bibResponse) {
                    let bibtex = bibResponse.responseText;
                    // 应用引用格式转换
                    bibtex = rewriteBibTeXCitationKey(bibtex);
                    callback(bibtex);
                },
                onerror: function() {
                    if(!silent) Toast("Error fetching bib file");
                    callback("None");
                }
            });
        },
        onerror: function() {
            if(!silent) Toast("Error searching DBLP");
            callback("None");
        }
    });
  }

  // --- Event Handlers ---

  const titleEl = document.getElementById('dblp-batch-title');
  const currentEl = document.getElementById('dblp-batch-current');
  const downloadBtn = document.getElementById('dblp-btn-download');
  const csvBtn = document.getElementById('dblp-btn-csv');
  const copyUrlsBtn = document.getElementById('dblp-btn-copy-urls');
  const closeBtn = document.getElementById('dblp-close-btn');
  const retryBtn = document.getElementById('dblp-retry-btn');

  // Helper to get valid results so far
  function getResultsSoFar() {
      return batchLines.map((line, idx) => ({
          line: line,
          bib: batchResults[idx]
      })).filter(item => item.bib !== null && item.bib !== undefined);
  }

  downloadBtn.onclick = () => {
      const results = getResultsSoFar();
      if(results.length === 0) { Toast("Nothing fetched yet."); return; }
      const content = results.map(r => r.bib === "None" ? `% Failed to fetch: ${r.line}` : r.bib).join('\n\n');
      downloadContent(content, 'dblp_bibtex.bib');
  };

  copyUrlsBtn.onclick = () => {
      const results = getResultsSoFar();
      if(results.length === 0) { Toast("Nothing fetched yet."); return; }

      const urlList = results.map(r => {
          if (r.bib === "None") return "None";
          return extractBibField(r.bib, "url");
      }).join('\n');

      GM_setClipboard(urlList);
      Toast(lang_hint.urls_copied);
  };

  csvBtn.onclick = () => {
      const results = getResultsSoFar();
      if(results.length === 0) { Toast("Nothing fetched yet."); return; }

      let csvContent = "\uFEFF原始搜索词,提取标题,URL,BibTeX\n";

      const esc = (val) => {
          if (val === null || val === undefined) return "";
          val = String(val);
          if (val.search(/("|,|\n|\r)/g) >= 0) {
              return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
      };

      csvContent += results.map(r => {
          if (r.bib === "None") {
              return `${esc(r.line)},None,None,None`;
          }
          const title = extractBibField(r.bib, "title");
          const url = extractBibField(r.bib, "url");
          return `${esc(r.line)},${esc(title)},${esc(url)},${esc(r.bib)}`;
      }).join('\n');

      downloadContent(csvContent, 'dblp_results.csv');
  };

  closeBtn.onclick = () => {
      overlay.style.display = 'none';
      isBatchProcessing = false;
  };

  // Scholar重试按钮
  retryBtn.onclick = () => {
      const failedTextarea = document.getElementById('dblp-failed-textarea');
      const failedText = failedTextarea.value.trim();
      if (!failedText) {
          Toast(lang.startsWith('zh') ? '没有失败的项目' : 'No failed items');
          return;
      }

      const failedLines = failedText.split('\n').map(s => s.trim()).filter(s => s);
      if (failedLines.length === 0) return;

      // 生成搜索URL列表
      const searchUrls = failedLines.map(line => ({
          query: line,
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(line)}`
      }));

      // 显示确认对话框
      const scholarList = document.getElementById('dblp-scholar-list');
      scholarList.innerHTML = searchUrls.map((item, idx) =>
          `<div class="dblp-scholar-item">${idx + 1}. ${item.url}</div>`
      ).join('');

      scholarModal.style.display = 'block';

      // 确认按钮
      document.getElementById('dblp-scholar-confirm').onclick = () => {
          scholarModal.style.display = 'none';

          // 打开多个标签页
          searchUrls.forEach(item => {
              window.open(item.url, '_blank');
          });
      };

      // 取消按钮
      document.getElementById('dblp-scholar-cancel').onclick = () => {
          scholarModal.style.display = 'none';
      };
  };

  // 复制成功结果按钮
  document.getElementById('dblp-copy-success').onclick = () => {
      const successTextarea = document.getElementById('dblp-success-textarea');
      const content = successTextarea.value;
      if (!content) return;
      GM_setClipboard(content);
      Toast(lang_hint.copied_to_clipboard);
  };

  // 复制失败结果按钮
  document.getElementById('dblp-copy-failed').onclick = () => {
      const failedTextarea = document.getElementById('dblp-failed-textarea');
      const content = failedTextarea.value;
      if (!content) return;
      GM_setClipboard(content);
      Toast(lang_hint.copied_to_clipboard);
  };

  // Clipboard Confirm Logic
  function askClipboard(text) {
      return new Promise((resolve) => {
          document.getElementById('dblp-confirm-text').innerText = text.length > 200 ? text.substring(0, 200) + '...' : text;
          confirmModal.style.display = 'block';

          document.getElementById('dblp-confirm-yes').onclick = () => {
              confirmModal.style.display = 'none';
              resolve(true);
          };
          document.getElementById('dblp-confirm-no').onclick = () => {
              confirmModal.style.display = 'none';
              resolve(false);
          };
      });
  }

  // 主按钮点击事件
  button.addEventListener('click', async function() {
    if (isBatchProcessing) {
        Toast("正在批量处理中，请使用中间面板控制");
        return;
    }

    let selection = window.getSelection().toString().trim();

    // Fallback to clipboard
    if (!selection) {
        try {
            const clipText = await navigator.clipboard.readText();
            if (clipText && clipText.trim()) {
                const useClip = await askClipboard(clipText.trim());
                if (useClip) {
                    selection = clipText.trim();
                } else {
                    return;
                }
            } else {
                Toast(lang_hint.error_no_text);
                return;
            }
        } catch (e) {
            Toast(lang_hint.clipboard_read_err);
            return;
        }
    }

    if (!selection) return;

    const lines = selection.split(/[\r\n]+/).map(s => cleanChineseText(s.trim())).filter(s => s);

    if (lines.length === 0) return;

    if (lines.length === 1) {
        // Single Mode
        Toast(lang_hint.fetching_one, 1000);
        fetchBibTeX(lines[0], false, (res) => {
            if (res && res !== "None") {
                GM_setClipboard(res);
                Toast(lang_hint.done_copy);
            } else {
                Toast("Failed: " + lines[0]);
            }
        });
    } else {
        // Batch Mode
        isBatchProcessing = true;
        batchLines = lines;
        batchResults = new Array(lines.length).fill(null);
        let completedCount = 0;

        overlay.style.display = 'block';
        closeBtn.style.display = 'none';

        // 隐藏结果区域，重置状态
        document.getElementById('dblp-success-section').style.display = 'none';
        document.getElementById('dblp-failed-section').style.display = 'none';

        titleEl.innerText = lang_hint.batch_title(0, lines.length);
        currentEl.innerText = "Initializing...";

        lines.forEach((line, index) => {
            setTimeout(() => {
                if (!isBatchProcessing) return;

                currentEl.innerText = lang_hint.current_prefix + line;

                fetchBibTeX(line, true, (result) => {
                    batchResults[index] = result === "None" ? "None" : result;
                    completedCount++;

                    if (isBatchProcessing) {
                        titleEl.innerText = lang_hint.batch_title(completedCount, lines.length);
                    }

                    if (completedCount === lines.length) {
                        isBatchProcessing = false;
                        titleEl.innerText = lang_hint.batch_done_title(lines.length);
                        currentEl.innerText = "";
                        closeBtn.style.display = 'flex';

                        // 分离成功和失败的结果
                        const successResults = [];
                        const failedLines = [];

                        batchLines.forEach((line, idx) => {
                            if (batchResults[idx] === "None") {
                                failedLines.push(line);
                            } else {
                                successResults.push(batchResults[idx]);
                            }
                        });

                        // 显示成功结果
                        const successSection = document.getElementById('dblp-success-section');
                        const successTextarea = document.getElementById('dblp-success-textarea');
                        const successTitle = document.getElementById('dblp-success-title');

                        if (successResults.length > 0) {
                            successSection.style.display = 'block';
                            successTextarea.value = successResults.join('\n\n');
                            successTitle.innerText = lang_hint.success_summary(successResults.length);
                        } else {
                            successSection.style.display = 'none';
                        }

                        // 显示失败结果
                        const failedSection = document.getElementById('dblp-failed-section');
                        const failedTextarea = document.getElementById('dblp-failed-textarea');
                        const failedTitle = document.getElementById('dblp-failed-title');

                        if (failedLines.length > 0) {
                            failedSection.style.display = 'block';
                            failedTextarea.value = failedLines.join('\n');
                            failedTitle.innerText = lang_hint.failed_summary(failedLines.length);
                        } else {
                            failedSection.style.display = 'none';
                        }
                    }
                });
            }, index * 800);
        });
    }
  });

  // --- 注册菜单命令 ---

  // 1. 设置站点白名单
  // 1. 设置站点白名单 (已修改为面板模式)
  GM_registerMenuCommand(lang_hint.menu_whitelist_config, function() {
    const currentWhitelist = getWhitelist().join('\n');
    whitelistTextarea.value = currentWhitelist;
    whitelistModal.style.display = 'block';
  });

  // 2. 将本域名添加到白名单
  GM_registerMenuCommand(lang_hint.menu_add_current, function() {
    const currentDomain = window.location.hostname;
    const whitelist = getWhitelist();

    if (whitelist.includes(currentDomain)) {
      Toast(lang_hint.domain_already_exists);
      return;
    }

    whitelist.push(currentDomain);
    saveWhitelist(whitelist);
    Toast(lang_hint.domain_added);

    // 刷新按钮显示状态
    updateButtonVisibility();
  });

  // 3. 设置引用标志格式
  GM_registerMenuCommand(lang_hint.menu_citation_config, function() {
    renderCitationPresets();
    citationModal.style.display = 'block';
  });

  // 4. 全局禁用/启用（动态切换）
  let disableMenuId = null;

  function updateDisableMenu() {
    const isEnabled = isGloballyEnabled();
    const menuText = isEnabled ? lang_hint.menu_disable : lang_hint.menu_enable;

    if (disableMenuId !== null) {
      // Tampermonkey 不支持直接更新菜单，所以我们只能重新注册
      // 但由于 GM_registerMenuCommand 会累积菜单项，这里采用简单方案
    }

    disableMenuId = GM_registerMenuCommand(menuText, function() {
      const currentState = isGloballyEnabled();
      setGlobalEnabled(!currentState);
      Toast(!currentState ? lang_hint.feature_enabled : lang_hint.feature_disabled);

      // 刷新按钮显示状态
      updateButtonVisibility();

      // 刷新页面以更新菜单文本
      setTimeout(() => window.location.reload(), 1000);
    });
  }

  // 初始化禁用/启用菜单
  updateDisableMenu();

  // --- 按钮显示逻辑 ---
  function updateButtonVisibility() {
    if (!isGloballyEnabled()) {
      button.style.display = 'none';
      return;
    }

    if (isInWhitelist()) {
      button.style.display = 'block';
    } else {
      button.style.display = 'none';
    }
  }

  // 初始化按钮显示状态
  updateButtonVisibility();

})();
