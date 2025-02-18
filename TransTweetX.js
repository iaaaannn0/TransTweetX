// ==UserScript==
// @name         TransTweetX
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  TransTweetX offers precise, emoji-friendly translations for Twitter/X feed.
// @author       Ian
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        GM_xmlhttpRequest
// @connect      translate.googleapis.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        tweetSelector: '[data-testid="tweetText"]',
        targetLang: 'zh-CN',
        languages: {
            'zh-CN': '中文',
            'en': 'English',
            'ja': '日本語',
            'ru': 'Русский',
            'fr': 'Français',
            'de': 'Deutsch'
        },
        translationInterval: 200,
        maxRetry: 3,
        translationStyle: {
            color: 'inherit',
            fontSize: '0.9em',
            borderLeft: '2px solid #1da1f2',
            padding: '0 10px',
            margin: '4px 0',
            whiteSpace: 'pre-wrap',
            opacity: '0.8'
        }
    };

    let processingQueue = new Set();
    let requestQueue = [];
    let isTranslating = false;

    // 初始化控制面板
    function initControlPanel() {
        const panelHTML = `
            <div id="trans-panel">
                <div id="trans-icon"><i class="fa-solid fa-language"></i></div>
                <div id="trans-menu">
                    ${Object.entries(config.languages).map(([code, name]) => `
                        <div class="lang-item" data-lang="${code}">${name}</div>
                    `).join('')}
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            #trans-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            #trans-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(29, 161, 242, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            #trans-icon:hover {
                transform: scale(1.1);
                background: rgba(29, 161, 242, 0.95);
            }

            #trans-icon i {
                color: white;
                font-size: 20px;
            }

            #trans-menu {
                width: 150px;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 8px 0;
                margin-top: 10px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }

            #trans-menu.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .lang-item {
                padding: 12px 16px;
                font-size: 14px;
                color: #333;
                cursor: pointer;
                transition: all 0.2s;
            }

            .lang-item:hover {
                background: rgba(29, 161, 242, 0.1);
            }

            .lang-item[data-lang="${config.targetLang}"] {
                color: #1da1f2;
                font-weight: 500;
            }

            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #ddd;
                border-top-color: #1da1f2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (prefers-color-scheme: dark) {
                #trans-menu {
                    background: rgba(21, 32, 43, 0.9);
                }
                .lang-item {
                    color: #fff;
                }
            }
        `;
        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', panelHTML);

        // 事件绑定
        const icon = document.getElementById('trans-icon');
        const menu = document.getElementById('trans-menu');

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        menu.querySelectorAll('.lang-item').forEach(item => {
            item.addEventListener('click', function() {
                config.targetLang = this.dataset.lang;
                refreshAllTranslations();
                menu.classList.remove('show');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#trans-panel')) {
                menu.classList.remove('show');
            }
        });
    }

    // 刷新所有翻译
    function refreshAllTranslations() {
        document.querySelectorAll('.translation-container').forEach(el => el.remove());
        processingQueue.clear();
        requestQueue = [];
        document.querySelectorAll(config.tweetSelector).forEach(tweet => {
            delete tweet.dataset.transProcessed;
            processTweet(tweet);
        });
    }

    // 队列处理系统
    async function processQueue() {
        if (isTranslating || requestQueue.length === 0) return;
        isTranslating = true;

        while (requestQueue.length > 0) {
            const { tweet, text, retryCount } = requestQueue.shift();
            try {
                const translated = await translateWithEmoji(text);
                updateTranslation(tweet, translated);
                await delay(config.translationInterval);
            } catch (error) {
                if (retryCount < config.maxRetry) {
                    requestQueue.push({ tweet, text, retryCount: retryCount + 1 });
                } else {
                    markTranslationFailed(tweet);
                }
            }
        }

        isTranslating = false;
    }

    // 精准文本提取
    function extractPerfectText(tweet) {
        const clone = tweet.cloneNode(true);
        clone.querySelectorAll('a, button, [data-testid="card.wrapper"]').forEach(el => {
            if (!el.innerHTML.match(/[\p{Extended_Pictographic}\p{Emoji_Component}]/gu)) el.remove();
        });

        clone.innerHTML = clone.innerHTML
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/div><div/g, '\n</div><div');

        clone.querySelectorAll('span, div').forEach(el => {
            const style = window.getComputedStyle(el);
            if (['block', 'flex'].includes(style.display)) {
                el.after(document.createTextNode('\n'));
            }
        });

        return clone.textContent
            .replace(/\u00A0/g, ' ')
            .replace(/^[\s\u200B]+|[\s\u200B]+$/g, '')
            .replace(/(\S)[ \t]+\n/g, '$1\n')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/(\n){3,}/g, '\n\n')
            .trim();
    }

    // Emoji感知翻译
    async function translateWithEmoji(text) {
        const segments = [];
        let lastIndex = 0;
        const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Component}+)/gu;

        for (const match of text.matchAll(emojiRegex)) {
            const [emoji] = match;
            const index = match.index;
            if (index > lastIndex) {
                segments.push({ type: 'text', content: text.slice(lastIndex, index) });
            }
            segments.push({ type: 'emoji', content: emoji });
            lastIndex = index + emoji.length;
        }

        if (lastIndex < text.length) {
            segments.push({ type: 'text', content: text.slice(lastIndex) });
        }

        const translated = [];
        for (const seg of segments) {
            if (seg.type === 'emoji') {
                translated.push(seg.content);
            } else {
                const text = seg.content.trim();
                if (text) {
                    translated.push(await translateText(text));
                    await delay(config.translationInterval);
                }
            }
        }
        return translated.join(' ');
    }

    // 核心翻译功能
    function translateText(text, retry = 0) {
        return new Promise((resolve, reject) => {
            if (retry > config.maxRetry) return resolve(text);

            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${config.targetLang}&dt=t&q=${encodeURIComponent(text)}`,
                onload: (res) => {
                    try {
                        const data = JSON.parse(res.responseText);
                        resolve(data[0].map(i => i[0]).join('').trim());
                    } catch {
                        translateText(text, retry + 1).then(resolve);
                    }
                },
                onerror: () => {
                    translateText(text, retry + 1).then(resolve);
                }
            });
        });
    }

    // 推文处理流程
    function processTweet(tweet) {
        if (processingQueue.has(tweet) || tweet.dataset.transProcessed) return;
        processingQueue.add(tweet);
        tweet.dataset.transProcessed = true;

        const originalText = extractPerfectText(tweet);
        if (!originalText) return;

        const container = createTranslationContainer();
        tweet.after(container);

        requestQueue.push({
            tweet,
            text: originalText,
            retryCount: 0
        });

        processQueue();
    }

    // 创建翻译容器
    function createTranslationContainer() {
        const container = document.createElement('div');
        container.className = 'translation-container';
        Object.assign(container.style, config.translationStyle);
        container.innerHTML = '<div class="loading-spinner"></div>';
        return container;
    }

    // 更新翻译显示
    function updateTranslation(tweet, translated) {
        const container = tweet.nextElementSibling;
        if (container?.classList.contains('translation-container')) {
            container.innerHTML = translated.split('\n').join('<br>');
            processingQueue.delete(tweet);
        }
    }

    // 标记翻译失败
    function markTranslationFailed(tweet) {
        const container = tweet.nextElementSibling;
        if (container?.classList.contains('translation-container')) {
            container.innerHTML = '<span style="color:red">翻译失败</span>';
            processingQueue.delete(tweet);
        }
    }

    // 动态内容监听
    function setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            node.querySelectorAll(config.tweetSelector).forEach(processTweet);
                        }
                    });
                }
                else if (mutation.type === 'characterData') {
                    const tweet = mutation.target.closest(config.tweetSelector);
                    if (tweet) processTweet(tweet);
                }
            });
        });

        observer.observe(document, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    // 工具函数
    const delay = ms => new Promise(r => setTimeout(r, ms));

    // 初始化入口
    function init() {
        initControlPanel();
        setupMutationObserver();
        document.querySelectorAll(config.tweetSelector).forEach(processTweet);
    }

    // 启动脚本
    window.addEventListener('load', init);
    if (document.readyState === 'complete') init();
})();