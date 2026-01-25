# DBLP-BibTex-dump - Batch Export BibTeX from Paper Titles

Generate a button at the bottom left of the webpage to fetch the BibTeX of the selected text from DBLP and copy it to the clipboard. Supports batch fetching, reading from clipboard, downloading at any time, exporting URL and CSV.

![Get BibTeX Button](imgs/页面左下角的获取BibTex按钮.png)

## Download

[https://greasyfork.org/en/scripts/522825-dblp-bibtex-dump](https://greasyfork.org/en/scripts/522825-dblp-bibtex-dump)

## Features

### Core Functions
- **One-Click Fetch** - Select paper titles to automatically get BibTeX citations
  ![Single Entry to Clipboard](imgs/单个数据直接上剪切板.png)
- **Batch Processing** - Select multiple titles at once for automatic batch extraction
  ![Batch Extraction and Export](imgs/批量提取并导出特定格式.png)
- **Smart Clipboard** - Automatically reads clipboard content when no text is selected
- **Multiple Export Formats** - Support for .bib files, CSV spreadsheets, and URL lists

### Advanced Features
- **Custom Citation Format** - Support multiple citation key templates (author+year, title keyword, etc.) with customizable placeholders
  ![Custom Citation Format](imgs/自定义引用格式.png)
- **Whitelist Mode** - Only show button on specified websites to avoid interference
  ![Configure Site Whitelist](imgs/设置站点白名单.png)
- **Global Toggle** - One-click disable/enable functionality
- **Real-time Preview** - Display current progress and status during batch processing

### Citation Format Examples
- `Default Format` - Keep DBLP original format (e.g., `DBLP:conf/aaai/Smith2024`)
- `Author+Year` - Simple format (e.g., `Smith2024`)
- `First Word+Year+Author` - Semantic format (e.g., `Deep2024Smith`)
- `Custom Template` - Support placeholders like `{firstAuthor}`, `{year}`, `{firstWord}`, `{titleWords:N}`, etc.

## Usage

1. First, install Tampermonkey extension. If you don't know how, watch my video: [Browser Script Tutorial ① - Install Tampermonkey (Bilibili)](https://www.bilibili.com/video/BV1AN4y1Y7mo)
2. Install the script from Greasy Fork: [https://greasyfork.org/en/scripts/522825-dblp-bibtex-dump](https://greasyfork.org/en/scripts/522825-dblp-bibtex-dump)
3. Configure citation format: Click Tampermonkey icon → "Configure Citation Key Format" → Select preset or custom template
4. Configure whitelist (optional): Click Tampermonkey icon → "Configure Site Whitelist"

## Tutorial

For more usage tips and feature demonstrations, check out the blog post:
[[Open Source Tool] DBLP-BibTex-dump - Batch Extract DBLP BibTeX with Just Paper Titles, Support CSV and URL Export!](https://shandianchengzi.blog.csdn.net/article/details/144936343)

## Version History

### v3.0 (Latest)
- ✨ **New**: Custom citation key format feature
  - 4 preset formats (default, author+year, first word+year+author, author+year+title keyword)
  - Custom template support with free placeholder combination
  - Real-time preview of citation format effects
  - Automatic parsing of author, year, and title fields to generate new citation keys

### v2.0
- ✨ **New**: Whitelist settings feature
  - Only show button on specified websites
  - Add current domain to whitelist
  - Global disable/enable toggle

### v1.4
- ✨ **New**: Batch fetch mode
- ✨ **New**: CSV export feature
- ✨ **New**: URL list export feature
- ✨ **New**: Smart clipboard reading

## Contribution

If you have any suggestions or want to add new features, feel free to submit an issue or PR.
