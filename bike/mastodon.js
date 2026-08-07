

if (typeof Array.prototype.reIndexOf === 'undefined') {
    Array.prototype.reIndexOf = function (rx) {
        for (var i in this) {
            if (this[i].toString().match(rx)) {
                return i;
            }
        }
        return -1;
    };
}

function isImage(url) {
    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
}

var flag = false;
var stringToHTML = function(str) {
    var dom = document.createElement('div');
    dom.innerHTML = str;
    return dom;
};

function decodeHtmlEntitiesWithDOM(encodedString) {
    if (!encodedString || typeof encodedString !== 'string') {
        return encodedString;
    }

    const element = document.createElement('div');
    element.innerHTML = encodedString;

    // Use textContent for broader compatibility and to prevent potential issues with innerText
    return element.textContent || element.innerText || '';
}

function getMastoStream(streamURL, filter = "", appendTo) {
    const RSS_URL = streamURL;
    pos = ["NotStarted", -1];
    fetch(RSS_URL)
        .then(response => response.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(data => {
        const items = data.querySelectorAll("item");
        let html = ``;
        for(var el of items) {
            var img = decodeHtmlEntitiesWithDOM(stringToHTML(el.innerHTML)).querySelector('media\\:content');
            var timecode = decodeHtmlEntitiesWithDOM(stringToHTML(el.innerHTML)).querySelector('pubdate').innerHTML;
            var txt = decodeHtmlEntitiesWithDOM(stringToHTML(el.innerHTML).querySelector('description').innerHTML);
            var hashtags = stringToHTML(txt).querySelectorAll('.hashtag');
            var hashtagHtml = [];
            hashtags.forEach( tag => {
                hashtagHtml.push(tag.innerHTML.replace("#", "").replace("<span>", "").replace("</span>", ""));
            });
            if (txt.includes(filter)){
                const imgString =  isImage(img.getAttribute('url')) ? "<img src="+img.getAttribute('url')+" alt="+'\"'+img.innerText.replace(/(\r\n|\n|\r)/g, "").trim()+'\"'+"><br>" : "";
                html += `
<div class = "step"> 
</div>
<article> 
<div class = "time"> 
<div>
${'🕰️ ' + new Date(timecode).toLocaleTimeString()}
</div>
<div>
${'📅 ' + new Date(timecode).toLocaleDateString()}
</div>
</div>
${imgString}
${txt}
</article>
`;
                updateProgress(hashtagHtml, timecode, 'bike-progress', '.indicator');
            }
        }
        if (html != "") {
            document.querySelector(appendTo).innerHTML= html;
        }
    });
}

function updateProgress(txt, timecode, progressElement, currentStop) {
    if(!flag) {
        var start = txt.reIndexOf(/prog\d/);
        if(start >= 0) {
            //var value = txt[start].substr(1);
            var value = txt[start].substr(4);
        }
        var startStop = txt.reIndexOf(/at\D/);
        if(startStop >= 0) {
            //var current = txt[startStop].substr(4);
            var current = txt[startStop].substr(2);
            pos = current;
        }
        if(typeof parseInt(value, 10) === "number") {
            document.getElementById(progressElement).value = parseInt(value, 10);
            pos[1] = parseInt(value, 10);
            if (!current) {
                pos[0] = null;
            }
        }
        if (current) {
            document.querySelector(currentStop).innerHTML = new Date(timecode).toLocaleTimeString() + '<br><div style="display: flex; gap: 8px;"><div style="transform: scale(-1, 1) translateY(-3px);">🚲</div>' + current.replace(/([A-Z])/g, ' $1').trim() + '</div>';
            document.querySelector(currentStop).style.setProperty('--left', 'calc(' + value +'% - 72px)');
            pos[0] = current;
        }
        flag = true;
    }
}