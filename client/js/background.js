chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({
      'url': chrome.extension.getURL('page.html')
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  const url = 'https://www.amazon.com/dp';
  const { asins } = request;
  callAllFetch(asins, url).then(res => {
    sendResponse({ data: res });
  });
  return true;
});

const callAllFetch = async(asins, baseUrl) => {
  return await Promise.all(asins.map(asin => callFetch(`${baseUrl}/${asin}`)));
}

const callFetch = async (url) => {
  try {
    const res = await fetch(url, {
      method: 'GET',
    });
    const htmlText = await res.text();
    const splits = url.split('/');
    const asin = splits.slice(-1).pop();
    return callParse(htmlText, asin);
  } catch (err) {
    console.error(err);
  }
}

const callParse = (text, asin) => {
  const obj = { asin: asin, ranks: [] }
  const html = $.parseHTML(text);
  const els = $(html).find('.zg_hrsr_item');

  if($(els).length) {
    $(els).each((i, el) => {
      /** rank */
      let rank = $(el).find('.zg_hrsr_rank').text();
      rank = rank ? rank.replace(/[^0-9]/, '') : null;
      /** categories */
      let cats = [];
      let links = $(el).find('a');
      if(links.length) {
        $(links).each((j, lnk) => {
          let cat = $(lnk).text();
          cat = cat.replace(',','');
          cats.push(cat);
        })
      }
      obj.ranks.push({ rank: rank, cats: cats })
    })
  }
  return obj;
}

