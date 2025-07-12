window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const sitePages = [
    { name: '首页', url: 'index.html' },
    { name: '职级划分', url: 'ranks.html' },
    { name: '米兰达', url: 'miranda.html' },
    { name: '10-X代码', url: 'radio.html' },
    { name: 'Code代码', url: 'codes.html' },
    { name: 'Code 5 战术操作', url: 'code5.html' },
    { name: '武力使用条例', url: 'force.html' }
];

function initSearch() {
    const searchIcon = document.querySelector('.search-icon');
    if (!searchIcon) return;

    searchIcon.addEventListener('click', function(e) {
        e.preventDefault();
        
        const searchBox = document.createElement('div');
        searchBox.className = 'search-overlay';
        searchBox.innerHTML = `
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="搜索整个网站内容..." autofocus>
                <button id="searchBtn">搜索</button>
                <button id="closeSearch">关闭</button>
                <div id="searchResults" class="search-results"></div>
            </div>
        `;
        
        document.body.appendChild(searchBox);
        
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const closeBtn = document.getElementById('closeSearch');
        const resultsDiv = document.getElementById('searchResults');
        
        async function performSiteSearch() {
            const query = searchInput.value.trim();
            if (!query) {
                resultsDiv.innerHTML = '';
                return;
            }
            
            resultsDiv.innerHTML = '<div class="search-loading">搜索中...</div>';
            
            try {
                const results = await searchAllPages(query);
                displaySearchResults(results, query, resultsDiv);
            } catch (error) {
                resultsDiv.innerHTML = '<div class="search-error">搜索出错，请重试</div>';
            }
        }
        
        searchBtn.addEventListener('click', performSiteSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSiteSearch();
            }
        });
        
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSiteSearch, 300);
        });
        
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(searchBox);
        });
        
        searchBox.addEventListener('click', function(e) {
            if (e.target === searchBox) {
                document.body.removeChild(searchBox);
            }
        });
    });
}

async function searchAllPages(query) {
    const results = [];
    const searchPromises = sitePages.map(async (page) => {
        try {
            const response = await fetch(page.url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const content = doc.querySelector('main');
            if (content) {
                const text = content.textContent || content.innerText;
                const matches = findMatches(text, query);
                
                if (matches.length > 0) {
                    results.push({
                        pageName: page.name,
                        pageUrl: page.url,
                        matches: matches
                    });
                }
            }
        } catch (error) {
            console.error(`搜索页面 ${page.url} 时出错:`, error);
        }
    });
    
    await Promise.all(searchPromises);
    return results;
}

function findMatches(text, query) {
    const matches = [];
    const regex = new RegExp(query, 'gi');
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
        if (regex.test(line)) {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {
                matches.push({
                    line: index + 1,
                    content: trimmedLine.substring(0, 200) + (trimmedLine.length > 200 ? '...' : '')
                });
            }
        }
    });
    
    return matches.slice(0, 3);
}

function displaySearchResults(results, query, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results">未找到相关内容</div>';
        return;
    }
    
    let html = `<div class="results-header">找到 ${results.length} 个页面包含 "${query}"</div>`;
    
    results.forEach(result => {
        html += `
            <div class="result-item">
                <div class="result-page">
                    <a href="${result.pageUrl}" class="page-link">${result.pageName}</a>
                </div>
                <div class="result-matches">`;
        
        result.matches.forEach(match => {
            const highlightedContent = match.content.replace(
                new RegExp(query, 'gi'), 
                `<mark class="search-highlight">$&</mark>`
            );
            html += `<div class="match-item">${highlightedContent}</div>`;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
}

function highlightText(element, query) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const regex = new RegExp(query, 'gi');
        if (regex.test(text)) {
            const highlightedText = text.replace(regex, `<mark class="search-highlight">$&</mark>`);
            const span = document.createElement('span');
            span.innerHTML = highlightedText;
            textNode.parentNode.replaceChild(span, textNode);
        }
    });
}

function clearHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
    
    const spans = document.querySelectorAll('span');
    spans.forEach(span => {
        if (span.innerHTML === span.textContent) {
            span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initSearch();
    console.log('LSSD网站已加载完成');
});