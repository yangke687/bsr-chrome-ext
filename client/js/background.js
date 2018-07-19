chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({
      'url': chrome.extension.getURL('page.html')
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  const { asins, baseUrl } = request;
  callAllFetch(asins, baseUrl).then(res => {
    sendResponse({ data: res });
  });
  return true;
});

const callAllFetch = async(asins, baseUrl) => {
  return await Promise.all(asins.map(asin => callFetch(`${baseUrl}/${asin}`)));
}

const getDomain = (key) => {
  const domains = {
    'https://www.amazon.com/dp': 'US',
    'https://www.amazon.co.jp/dp': 'Japan',
    'https://www.amazon.co.uk/dp': 'UK',
    'https://www.amazon.ca/dp': 'Canada',
    'https://www.amazon.com.mx/dp': 'Mexico',
    'https://www.amazon.de/dp': 'Germany',
    'https://www.amazon.fr/dp': 'France',
    'https://www.amazon.es/dp': 'Spain',
    'https://www.amazon.com.au/dp': 'Australia',
    'https://www.amazon.in/dp': 'India',
  };
  return domains.hasOwnProperty(key) ? domains[key] : 'US';
}

const baseUrlAndDomainParse = (url) => {
  const splits = url.split('/');
  const asin = splits.slice(-1).pop();
  const baseUrl = `${splits[0]}//${splits[2]}/${splits[3]}`;
  return { asin: asin, domain: getDomain(baseUrl) };
}

const callFetch = async (url) => {
  const { asin, domain } = baseUrlAndDomainParse(url);
  try {
    const res = await fetch(url, {
      method: 'GET',
    });
    const htmlText = await res.text();
    return callParse(htmlText, asin, domain);
  } catch (err) {
    console.error(err);
  } finally {
    chrome.runtime.sendMessage({
      type: 'bsr-scrape',
      asin: asin,
      success: true
    }, () => null);
  }
}

const topTextParse = (topText, domain) => {
  switch(domain) {
    case 'Japan':
      return topText.split(' - ')[0].trim();
    case 'Mexico':
    case 'Spain':
      return topText.split(' en ')[1].trim();
    case 'France':
      return topText.split(' dans la ')[1].trim();
    default:
      return topText.split(' in ')[1].trim();
  }
}

const topLineParse = (html, domain) => {
  let topText = '';
  const topEl = $(html).find('#SalesRank');
  const lastTd = $(html).find('.prodDetSectionEntry').last().next();

  /** parse DOM with id 'SalesRank' */
  if(topEl && $(topEl).length===1) {
    if($(topEl).is('li')) {
      topText = $(topEl).clone().children().remove().end().text();
    }

    if($(topEl).is('tr')) {
      /** amazon.com.mx */
      topText = $(topEl).children('td').eq(1).clone().children().remove().end().text();
    }
  } else if(lastTd && $(lastTd).length===1) {
    /** parse DOM without id */
    const span = $(lastTd).children('span').children('span').first();
    topText = $(span).clone().children().remove().end().text();
  }

  /** parse top line text */
  if(topText) {
    topText = topText.replace('(','').replace(')','').trim();
    /** top line rank */
    let rank = topText.replace(/[^\d+]/g,'');
    /** top line text */
    topText = topTextParse(topText, domain);
    let cats = Boolean(topText) ? [topText] : [];
    return { rank: rank, cats: cats };
  } else {
    return { ranK: null, cats: [] };
  }
}

const rankingLinesParse = (html) => {
  let ret = [];
  const els = $(html).find('.zg_hrsr_item');
  const lastTd = $(html).find('.prodDetSectionEntry').last().next();

  if($(els).length) {
    $(els).each((i, el) => {
      /** rank */
      let rank = $(el).find('.zg_hrsr_rank').text();
      rank = rank ? rank.replace(/[^0-9]+/, '') : null;
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
      ret.push({ rank: rank, cats: cats })
    })
  }

  if(lastTd && $(lastTd).length===1) {
    const spans =  $(lastTd).children('span').children('span');
    $(spans).each((i, el) => {
      /** skip top line */
      if(i>0) {
        /** rank */
        let rank = $(el).clone().children().remove().end().text();
        console.log(rank);
        rank = rank ? rank.replace(/[^0-9]+/g, '') : null;
        console.log(rank);
        let cats = [];
        let links = $(el).find('a');
        if(links.length) {
          $(links).each((j, lnk) => {
            let cat = $(lnk).text();
            cat = cat.replace(',','');
            cats.push(cat);
          })
        }
        ret.push({ rank: rank, cats: cats })
      }
    })
  }

  return ret;
}

const callParse = (text, asin, domain) => {
  const obj = { asin: asin, ranks: [] }
  const html = $.parseHTML(text);

  /** parse top line */
  const { rank, cats } = topLineParse(html, domain);
  if(rank && cats.length ) {
    obj.ranks.push({ rank: rank, cats: cats });
  }

  /** parse ranking lines */
  const ranks = rankingLinesParse(html);
  ranks.map((rank) => {
    obj.ranks.push(rank);
  });

  return obj;
}

