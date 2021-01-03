import { ipcRenderer, WebviewTag, shell, remote } from 'electron'
import { isMacintosh } from '../common/platform';
import Vue from 'vue'
import { SyosetuParser } from '../parser/SyosetuParser';
import { PixivParser } from '../parser/PixivParser';
import { KakuyomuParser } from '../parser/KakuyomuParser';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
const { Menu, MenuItem, dialog } = remote;
const getCaretCoordinates = require('textarea-caret');

import modalSyosetu18 from './component/modal-syosetu18.vue';
import modalReplace from './component/modal-replace.vue';
import modalInfo from './component/modal-info.vue';
import modalReplaceEdit from './component/modal-replace-edit.vue';

new Vue({
    el: '#wrapper',
    components: {
        'modal-info': modalInfo,
        'modal-syosetu18': modalSyosetu18,
        'modal-replace': modalReplace,
        'modal-replace-edit': modalReplaceEdit,
    },
    data: {
        currentFile: '',
        translateString: '',
        working: {
            source: '',
            translation: '',
        },
        info: {
            novelName: {
                source: '',
                translation: '',
            },
            chapterTitle: {
                source: '',
                translation: '',
            },
            sourceUrl: '',
        },
        currentReplace: null,
        replaces: [],
        replaceSource: {
            'type': 'local',
            'path': ''
        },
    },
    mounted() {
        let _this = (this as any);

        _this.initWebviewEvent();
        _this.initIpcEvent();
        _this.initContextMenuEvent();
        _this.initUIStyle();
    },
    computed: {
        windowTitle() {
            let title = 'PIBBK Lite';

            if (this.info.novelName.source) {
                let novelName = this.info.novelName.translation || this.info.novelName.source;
                let chapterTitle = this.info.chapterTitle.translation || this.info.chapterTitle.source;
                title += ` - 《${novelName}》 ${chapterTitle}`;
            }

            if (this.currentFile) {
                let basename = path.basename(this.currentFile);
                title += ` - ${basename}`;
            }

            document.title = title;

            return title;
        },
        workingSource() {
            let _this = (this as any);
            let content = _this.working.source;
            content = _this._replaceProcess(content);
            content = _this._highlight(content);
            return content;
        },
        translatedWordCount() {
            let _this = (this as any);
            let factor = 0.7;
            let translatedCount = _this._getWordCount(_this.working.translation);
            let originalCount = _this._getWordCount(_this.working.source);
            let predictCount = Math.floor(originalCount * factor);
            return `${originalCount}-${translatedCount}/${predictCount}`;
        },
        translatedLineCount() {
            let _this = (this as any);
            let translatedCount = _this._getLineCount(_this.working.translation);
            let originalCount = _this._getLineCount(_this.working.source) / 2;
            return `${translatedCount}/${originalCount}`;
        }
    },
    methods: {
        initIpcEvent() {

            let _this = (this as any);

            ipcRenderer.send('render-inited');

            ipcRenderer.on('file-open', (event, arg) => {
                let json = _this._readPibbkFile(arg);

                if ('source' in json) {
                    _this.working.source = json.source;
                }

                if ('translation' in json) {
                    _this.working.translation = json.translation;
                }

                if ('replaces' in json) {
                    Vue.set(_this, 'replaces', json.replaces);
                }

                if ('info' in json) {
                    Vue.set(_this, 'info', json.info);
                }

                let replaceSource = {};

                if ('replaceSource' in json) {
                    if ('type' in json.replaceSource && json.replaceSource.type === 'external') {
                        _this._importPibbkFileReplace(json.replaceSource.path);
                    }
                    replaceSource = json.replaceSource;
                }
                else {
                    replaceSource = {
                        'type': 'local',
                        'path': ''
                    }
                }

                _this.replaceSource = replaceSource;

                _this.currentFile = arg;
            })

            ipcRenderer.on('file-save-current', (event, arg) => {
                if (!_this.currentFile) {
                    dialog.showSaveDialog({ filters: [ {name: '所有檔案', extensions: ['*'] } ] }).
                    then(result => {
                        if (result.filePath) {
                            let filename = result.filePath.replace(/.pibbk/g, '');
                            _this.currentFile = `${filename}.pibbk`;
                            _this._savePibbkFile(_this.currentFile);
                        }

                        return;
                    }).catch(err => {
                        console.log(err);
                        return;
                    });
                }

                _this._savePibbkFile(_this.currentFile);
            })

            ipcRenderer.on('file-save-current-new', (event, arg) => {
                dialog.showSaveDialog({ filters: [ {name: '所有檔案', extensions: ['*'] } ] }).
                then(result => {
                    if (result.filePath) {
                        _this.currentFile = `${result!.filePath}.pibbk`;
                        _this._savePibbkFile(_this.currentFile);
                    }
                }).catch(err => {
                    console.log(err);
                });
            })

            ipcRenderer.on('file-import-source', (event, arg) => {
                _this.working.source = _this._openAndReadTxt(arg);
                notification(`${arg} 檔案已匯入至原文`);
            })

            ipcRenderer.on('file-import-translation', (event, arg) => {
                _this.working.translation = _this._openAndReadTxt(arg);
                notification(`${arg} 檔案已匯入至翻譯`);
            })

            ipcRenderer.on('file-import-replace', (event, arg) => {
                _this._importPibbkFileReplace(arg);
            })

            ipcRenderer.on('file-export-translation', (event, arg) => {
                _this._exportTranslationFile(arg);
            })

            ipcRenderer.on('file-export-replaces', (event, arg) => {
                _this._exportReplacesFile(arg);
            })

            ipcRenderer.on('file-close-current', (event, arg) => {
                _this.working.source = '';
                _this.working.translation = '';
                _this.replaces = [];
                _this.currentFile = '';
                _this.translateString = '';

                Vue.set(_this, 'info', {
                    novelName: {
                        source: '',
                        translation: '',
                    },
                    chapterTitle: {
                        source: '',
                        translation: '',
                    },
                    sourceUrl: ''
                });

            })
        },
        initWebviewEvent() {
            Vue.nextTick(function() {
                let webviews = document.querySelectorAll('webview');

                Array.from(webviews).forEach(webview => {
                    webview.addEventListener('dom-ready', function(event) {
                        injectCSS(webview);
                        if (webview.classList.contains('webview-fts')) {
                            let webcontents = (<WebviewTag>webview).getWebContents();
                            webcontents.on('new-window', (event, url) => {
                                let time = new Date().valueOf();
                                if (time - lastTime < 500) {
                                    return;
                                }
                                lastTime = time;
                                shell.openExternal(url);
                            });
                        }
                        // if (webview.classList.contains('webview-google')) {
                        //     (<WebviewTag>webview).openDevTools();
                        // }
                        // if (webview.classList.contains('webview-baidu')) {
                        //     (<WebviewTag>webview).openDevTools();
                        // }
                        // if (webview.classList.contains('webview-deepl')) {
                        //     (<WebviewTag>webview).openDevTools();
                        // }
                    });
                });
            });
        },
        initContextMenuEvent() {
            let _this = (this as any);
            const menu = new Menu();
            menu.append(
                new MenuItem({
                    label: '新增到名詞取代',
                    click() {
                        _this.addSelectionToReplace(window.getSelection().toString());
                    }
                })
            );

            window.addEventListener(
                'contextmenu',
                e => {
                    e.preventDefault();
                    var element = e.srcElement as HTMLElement;
                    if (element.nodeName !== 'TEXTAREA' && element.nodeName !== 'P' && element.nodeName !== 'SPAN') {
                        return;
                    }
                    menu.popup({ window: remote.getCurrentWindow() });
                },
                false
            );
        },
        initUIStyle() {
            if (!isMacintosh) {
                document.getElementById('titlebar').style.display = 'none';
            }
            else {
                document.body.classList.add('mac');
            }
        },
        /* ------------------
            global event
        ------------------ */
        async eventFetchButtonClick() {

            let url = (<HTMLInputElement>document.getElementById('url')).value;
            if (url.length <= 0) {
                return;
            }

            let parser;

            if (url.indexOf('syosetu') >= 0) {
                parser = new SyosetuParser;
            }
            else if (url.indexOf('pixiv') >= 0) {
                parser = new PixivParser;
            }
            else if (url.indexOf('kakuyomu') >= 0) {
                parser = new KakuyomuParser;
            }

            if (!parser) {
                return;
            }

            let html = await parser.downloadHtml(url);
            let novelName = parser.parseNovelName(html);
            let chapterTitle = parser.parseChapterTitle(html);
            let content = parser.parseContent(html);

            this.info.novelName.source = novelName;
            this.info.chapterTitle.source = chapterTitle;
            this.info.sourceUrl = url;
            this.working.source = content;
        },
        eventOpenInfoButtonClick() {
            document.getElementById('modal-info').style.display = 'block';
        },
        eventSyosetuR18ButtonClick() {
            document.getElementById('modal-syosetu-r18-confirm').style.display = 'block';
        },
        eventTranslateThisLine(event) {
            if (event.target.nodeName == 'P' || event.target.nodeName == 'SPAN') {
                this.translateString = event.target.innerText;
                (this as any).eventTranslateThis(this.translateString);
            }
        },
        eventOpenReplaceButtonClick() {
            document.getElementById('modal-replace').style.display = 'block';
        },
        eventTranslateButtonClick() {
            (this as any).eventTranslateThis(this.translateString);
        },
        eventTranslateThis(string) {
            let _this = (this as any);
            string = encodeURIComponent(string);
            let webview = document.querySelector('.webview-google') as WebviewTag;
            if (webview) {
                // _this._webviewTranslationInjectJs(webview, '#source', string);
                (<WebviewTag>webview).loadURL('https://translate.google.com.tw/?sl=auto&tl=zh-TW&op=translate&text=' + string);
            }

            webview = document.querySelector('.webview-baidu') as WebviewTag;
            if (webview) {
                _this._webviewTranslationInjectJs(webview, '#baidu_translate_input', string);
                // (<WebviewTag>webview).loadURL('https://fanyi.baidu.com/#jp/zh/' + string);
            }

            webview = document.querySelector('.webview-caiyun') as WebviewTag;
            if (webview) {
                _this._webviewTranslationInjectJs(webview, '#textarea', string);
            }

            webview = document.querySelector('.webview-youdao') as WebviewTag;
            if (webview) {
                _this._webviewTranslationInjectJs(webview, '#inputOriginal', string);
            }

            webview = document.querySelector('.webview-deepl') as WebviewTag;
            if (webview) {
                _this._webviewTranslationInjectJs(webview, '.lmt__source_textarea', string);
            }

            // webview = document.querySelector('.webview-fts') as WebviewTag;
            // if (webview) {
            //     webview.loadURL('https://www.jpmarumaru.com/tw/toolJPAnalysis.asp?t=' + string);
            // }
        },
        eventWorkingAreaScroll(event) {
            let target = event.target as HTMLElement;
            if (target.scrollTop === 0) {
                let source = document.querySelector('#source') as HTMLInputElement;
                source.style.marginTop = '0';
            }
        },
        eventUpdateExternalReplaceSource() {
            let _this = this as any;
            remote.dialog.showOpenDialog({ properties: ['openFile'], filters: [ {name: 'PIBBK 檔案', extensions: ['pibbk'] } ] }).
            then(result => {
                if (result.filePaths.length === 1) {
                    _this.replaceSource.path = result!.filePaths[0];
                    _this._importPibbkFileReplace(_this.replaceSource.path);
                }
            }).catch(err => {
                console.log(err);
            });
        },
        /* ------------------
            file handler
        ------------------ */
        _readPibbkFile(path: string) {
            let data = fs.readFileSync(path);
            let inflated = zlib.inflateSync(Buffer.from(data)).toString();
            let json = JSON.parse(inflated);

            return json;
        },
        _importPibbkFileReplace(path: string) {
            let _this = this as any;
            let json = _this._readPibbkFile(path);

            if ('replaces' in json) {
                // _this.working.translation = json.translation;
                let replaces = _this.replaces.concat(json.replaces);
                Vue.set(_this, 'replaces', replaces);
                notification(`${path} 檔案已匯入至名詞取代`);
            }
        },
        _openAndReadTxt(path: string) {
            let data = fs.readFileSync(path, 'utf8');
            return data;
        },
        _savePibbkFile(path: string) {
            if (path.length <= 0) {
                return;
            }

            let _this = this;
            let data = {
                type: 'lite',
                source: _this.working.source,
                translation: _this.working.translation,
                replaceSource: _this.replaceSource,
                info: _this.info,
                replaces: [],
            };

            if (_this.replaceSource.type === 'local') {
                data.replaces = _this.replaces;
            }
            else if (_this.replaceSource.type === 'external') {
                _this._saveExternalReplaceSource(_this.replaceSource.path);
            }

            let json = JSON.stringify(data);
            let deflated = zlib.deflateSync(json);

            fs.writeFile(path, deflated, (err) => {
                if (err) throw err;
                notification(`檔案已儲存至 ${path}`);
            });
        },
        _saveExternalReplaceSource(path: string) {
            if (path.length <= 0) {
                return;
            }

            let _this = this;
            let data = {
                type: 'replace',
                replaces: _this.replaces
            };

            let json = JSON.stringify(data);
            let deflated = zlib.deflateSync(json);

            fs.writeFile(path, deflated, (err) => {
                if (err) throw err;
                // notification(`檔案已儲存至 ${path}`);
            });
        },
        _exportTranslationFile(path: string) {
            let translation = this.working.translation;
            fs.writeFile(path, translation, (err) => {
                if (err) throw err;
                notification(`檔案已匯出至 ${path}`);
            });
        },
        _exportReplacesFile(path: string) {
            this._saveExternalReplaceSource(path);
        },
        modalClose(modal) {
            if (modal === 'modal-replace-edit') {
                return this.currentReplace = null;
            }
            document.getElementById(modal).style.display = 'none';
        },
        addSelectionToReplace(text: string) {
            let _this = (this as any);
            _this.replaces.push({
                pattern: text,
                replace: '',
                type: 'other',
                note: ''
            });
            _this.replaceEdit(_this.replaces[_this.replaces.length - 1]);
        },
        replaceEdit(replace) {
            this.currentReplace = replace;
        },
        highlightCurrentLine(event) {

            if (event instanceof KeyboardEvent) {
                if (!(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace', 'Delete'].includes(event.key))) {
                    return;
                }
            }

            try {
                let translation = document.getElementById('translation') as HTMLInputElement;
                let selectionStart = translation.selectionStart;
                let lineNumber = translation.value.substr(0, selectionStart).split('\n').length;

                var elements = document.querySelectorAll('#source p');
                [].forEach.call(elements, function(el) {
                    (el as HTMLElement).classList.remove('active');
                });
                let paragraph = document.querySelectorAll('#source p')[lineNumber - 1]
                paragraph.classList.add('active');
                (this as any).calculateSourceMargin(event, translation, paragraph);
            } catch (e) {
                console.log([e]);
            }
        },
        calculateSourceMargin(event, translation, paragraph) {
            let workingHeight = document.querySelector('#working-area').clientHeight ?? 0;
            let source = document.querySelector('#source') as HTMLInputElement;
            let caret = getCaretCoordinates(translation, translation.selectionStart);
            if (paragraph.offsetTop < workingHeight) {
                source.style.marginTop = '0';
            }
            else {
                source.style.marginTop = (caret.top - paragraph.offsetTop) + 'px';
            }
        },
        _webviewTranslationInjectJs(webview: WebviewTag, element: string, string: string) {
            webview.executeJavaScript(`
                    document.querySelector('${element}').value = decodeURI('${string}');
                    e = document.createEvent('HTMLEvents');
                    e.initEvent('input', false, true);
                    document.querySelector('${element}').dispatchEvent(e);`);
        },
        /* ------------------
            text
        ------------------ */
        _getWordCount(input) {
            try {
                let pattern = /[\u2000-\u206f\u2e80-\u2eff\u3040-\u9fff\ufb00-\ufffd]+/g;
                let m = input.match(pattern);
                if (!m) {
                    return 0;
                }
                let count = 0;
                for (var i = 0; i < m.length; i++) {
                    count += m[i].length;
                }
                return count;
            } catch (e) {}
            return 0;
        },
        _getLineCount(input, type) {
            let matches = input.match(/\n/g);
            return matches ? matches.length : 0;
        },
        _replaceProcess(text: string) {
            let content = text;
            let replaces = (this as any).replaces;
            replaces.forEach(function(el) {
                try {
                    let pattern = el.pattern.replace('/', '').replace('/', '');
                    let replace = el.replace.replace('/', '').replace('/', '');

                    if (pattern.length <= 0 || replace.length <= 0) {
                        throw 'empty';
                    }

                    let re = new RegExp(pattern, 'gmu');
                    content = content.replace(re, `<span class="replaced">${replace}</span>`);
                } catch (e) {
                    console.log([el, e]);
                }
            });
            return content;
        },
        _highlight(content: string) {
            content = content.replace(/^(.*)$/gmu, '<p>$1</p>');
            content = content.replace(/「([^」]+)」/gmu, '<span class="quotes">「$1」</span>');
            content = content.replace(/『([^』]+)』/gmu, '<span class="double-quotes">『$1』</span>');
            content = content.replace(/（([^）]+)）/gmu, '<span class="parentheses">（$1）</span>');
            content = content.replace(/【([^】]+)】/gmu, '<span class="square-brackets">【$1】</span>');
            content = content.replace(/〈([^〉]+)〉/gmu, '<span class="double-angle-quotation-mark">〈$1〉</span>');
            content = content.replace(/《([^》]+)》/gmu, '<span class="double-angle-quotation-mark">《$1》</span>');

            return content;
        },
    }
});

let injectCSS = (webview:Element) => {
    (<WebviewTag>webview).insertCSS(`
#gb, #gt-ft-res, .gb_Hg, #gba, #gt-appbar, .gb_T, #gt-src-wrap, .gb_Ig.gb_Jf, .ls-wrap, .source-wrap, .gp-footer, .feedback-link, .tlid-result-view, #gt-text-c #gt-langs, .VjFXz, .aCQag, .OPPzxe .rm1UF, .VlPnLc, .a88hkc { display: none!important; }
#gt-res-c, .gt-cc-r { float: left!important; }
#gt-res-c, #gt-src-c { width: 100%!important; }
.frame { height: 1000px!important; overflow-y: hidden!important;}

.header, .footer, .trans-left, .trans-operation-wrapper, .divide-wrap { display: none!important; }
.container { width: 100%!important; }
.trans-right { float: left!important; width: 100%!important;}
.container .inner { width: auto!important; margin: 0!important;}
.trans-other-wrap { display: none!important; }

.choose-content, .text-source-box { display: none!important; }
header, .footer-distributed, .hamburger, .alert { display: none!important; }

.lang-new, .textpanel-source, .banner, .fanyi_nav_mobile { display: none!important; }
.lang-container { padding-top: 16px!important; }

.fanyi__nav, .inside__products, .fanyi__footer, .input__original, .fanyi__operations, .download__area, .side__nav, .textpanel-tool, .desktop-guide { display: none!important; }
html, body, .fanyi, .fanyi-page { min-width: 100%!important; }
.fanyi__input { margin: 0!important; }
.input__target { width: 100%!important;}
.fanyi__input__bg { padding: 0; margin: 0; }

.dl_header, #lmt_quotes_article, .dl_footer, #dl_cookie_footer, .lmt__side_container--source, .lmt__textarea_separator, #lmt__dict, .lmt__stickyMenubar_whiteBackground, #lmt_pro_ad_container, .lmt__docTrans-tab-container, .lmt__language_container { display: none!important; }
.lmt__side_container--target { width: 100%!important; }
#dl_translator { padding-top: 0!important; }
.lmt__target_textarea { height: auto !important; }
.lmt__side_container--target { float: none !important; flex-basis: 100% !important; }
`);
}

let delay = function(s){
    return new Promise(function(resolve, reject){
        setTimeout(resolve,s);
    });
};

let notification = (message) => {
    let wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <span class="toast-icon">
        <svg width="14" height="16" viewBox="0 0 14 16" class="octicon octicon-info" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
          />
        </svg>
      </span>
      <span class="toast-content">${message}</span>
    `;
    wrapper.classList.add('toast');
    document.body.appendChild(wrapper);

    delay(100).then(() => {
        wrapper.classList.add('active');
        return delay(3000);
    }).then(() => {
        wrapper.classList.remove('active');
        return delay(1000);
    }).then(() => {
        document.body.removeChild(wrapper);
    });
}

/* ------------------
    global event
   ------------------ */
let lastTime = 0;

document.addEventListener('click', (event: MouseEvent) => {
    var element = event.target as HTMLElement;
    if (element.tagName === 'BUTTON' && element.classList.contains('btn-insert')) {
        var target = document.getElementById('translation');

        (<HTMLTextAreaElement> target).insertAtCaret(element.textContent);

        target.focus();
    }
});

/* ------------------
    polyfill
   ------------------ */

declare global {
    interface HTMLTextAreaElement {
        insertAtCaret(text: string): any;
    }
}

HTMLTextAreaElement.prototype.insertAtCaret = function(text: string) {
    text = text || '';
    if (this.selectionStart || this.selectionStart === 0) {
        var startPos = this.selectionStart;
        var endPos = this.selectionEnd;
        this.value = this.value.substring(0, startPos) + text + this.value.substring(endPos, this.value.length);
        this.selectionStart = startPos + text.length;
        this.selectionEnd = startPos + text.length;
    } else {
        this.value += text;
    }
};