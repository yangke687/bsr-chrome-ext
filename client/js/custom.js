/**
 * amazon.com
 *  B01EG68XSO,B0721JS9ZW,B00DGN23UI,B079Z33Y8X,
 *  B07B725M81,B07D1MC47L,B07FB6VRYH,B0180FYJTY,
 *  B07BNXPG3X,B07BC6R1M4,B0787G22NR,B00374F5CY,
 *  B00AGG3MNU,B00008RH16,B06WWPZP3R,B012TPRX6W,
 *  1935072137,B00FEFQSYS,B000HBILB2,B073PX8WN7
 * amazon.co.jp
 *  B0742J781D,B07F54P3KD
 * amazon.co.uk
 *  B0757Z2F3P,B073Q6L13P,B073T1Z5M8
 * amazon.ca
 *  B00ABA0ZOA,B01N1IGKE4
 * amazon.com.mx
 *  B000EN82EY,B073ZKFNBZ
 * amazon.de
 *  B01M0W7NIP,B000JWJDXY
 * amazon.fr
 *  B076P9S39Z,B075L6CCFZ
 * amazon.es
 *  B001HN6EF4,B073T22LYZ
 * amazon.com.au
 *  B00UCY3HX6,B0721MP41Q
 * amazon.in
 *  B00MEDZMJ0,B00SIWUU2A
 */
const composeTable = (data, domain) => {
  let tpl = '';
  for(const id in data) {
    if(!data[id]) return;
    const { asin, ranks } = data[id];
    ranks.map( rankItem => {
      const { rank, cats } = rankItem;
      tpl += `
        <tr>
          <td>${asin}</td>
          <td>${domain}</td>
          <td>${rank}</td>
          <td>${cats.join(' > ')}</td>
        </tr>
      `;
    })
  }
  return tpl;
}

const composeCSV = (data, domain) => {
  let str = 'ASIN,Domain,Rank,Categories\n';
  for(const id in data) {
    if(!data[id]) return;
    const { asin, ranks } = data[id];
    ranks.map(rankItem => {
      const { rank, cats } = rankItem;
      str += `${asin},${domain},${rank},${cats.join(' > ')}\n`;
    })
  }
  return encodeURIComponent(str);
}

const loadingStart = () => {
  $('.spin-loading').show();
  $('a#export-csv')
    .removeAttr('download')
    .attr('href','#')
    .attr('disabled','disabled');
  $('table').hide().children('tbody').html('');
}

const loadingEnd = (table, csv) => {
  $('.spin-loading').hide();
  $('table').show().children('tbody').html(table);
  $('table').DataTable();
  if(csv) {
    $('a#export-csv')
      .removeAttr('disabled')
      .attr('download','download.csv')
      .attr('href', `data:text/csv;charset=utf-8,${csv}`);
  }
}

const init = () => {
  $('table').hide();
  $('.spin-loading').hide();
  $('a#export-csv')
    .removeAttr('download')
    .attr('href','#')
    .attr('disabled', 'disabled');
}

$(document).ready(function(){
  init();

  $('#start-btn').click(() => {
    let asins = $('input#asins').val();
    const domain = $('select#amazon-domain').val();
    if(asins) {
      asins = asins.split(',');
      updateAsinText('ASIN');
      updateCompletedTasksCount(0);
      updateTotalTasksCount(asins.length);
      loadingStart();
      sendMessageToBackground(asins, domain);
    }
    return false;
  })
});

const getBaseUrl = (key) => {
  const urls = {
    US: 'http://www.amazon.com/dp',
    Japan: 'https://www.amazon.co.jp/dp',
    UK: 'https://www.amazon.co.uk/dp',
    Canada: 'https://www.amazon.ca/dp',
    Mexico: 'https://www.amazon.com.mx/dp',
    Germany: 'https://www.amazon.de/dp',
    France: 'https://www.amazon.fr/dp',
    Spain: 'https://www.amazon.es/dp',
    Australia: 'https://www.amazon.com.au/dp',
    India: 'https://www.amazon.in/dp'
  };
  return urls.hasOwnProperty(key) ? urls[key] : urls.US;
}

const sendMessageToBackground = (asins, domain) => {
	chrome.runtime.sendMessage({ asins, baseUrl: getBaseUrl(domain) }, (res) => {
    const table = composeTable(res.data, domain);
    const csv = composeCSV(res.data, domain);
    loadingEnd(table, csv);
  });
}

const getCompletedTasksCount = () => {
  let count = $('#completed').text();
  return parseInt(count) ? parseInt(count) : 0;
}

const updateAsinText = (val) => {
  $('#asin').html(val);
}

const updateCompletedTasksCount = (val) => {
  $('#completed').html(val);
}

const updateTotalTasksCount = (val) => {
  $('#total').html(val);
}

chrome.runtime.onMessage.addListener((msg) => {
  if(msg.type === 'bsr-scrape' && msg.success) {
    let count = getCompletedTasksCount();
    updateAsinText(msg.asin);
    updateCompletedTasksCount(count+1);
  }
});

$(document).ready(function(){
  /** loading manifest settings */
  $.getJSON(chrome.extension.getURL('../manifest.json'), function(settings) {
    const version = settings.version || '';
    const title = settings.name || '';
    $('#footer-version').html(version);
    $('#header-title').html(title);
  });
  /** insert flags into domain dropdown menu */
  $("select#amazon-domain").selectBoxIt();
});
