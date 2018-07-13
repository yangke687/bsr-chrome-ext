const composeTable = (data, domain) => {
  let tpl = '';
  for(const id in data) {
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
  $('a#export-csv').hide();
  $('table').hide().children('tbody').html('');
}

const loadingEnd = (table, csv) => {
  $('.spin-loading').hide();
  $('table').show().children('tbody').html(table);
  if(csv) {
    $('a#export-csv')
      .attr('href', `data:text/csv;charset=utf-8,${csv}`)
      .show();
  }
}

const init = () => {
  $('table').hide();
  $('.spin-loading').hide();
  $('a#export-csv').hide();
}

$(document).ready(function(){
  init();

  $('#start-btn').click(() => {
    let asins = $('input#asins').val();
    const domain = $('select#amazon-domain').val();
    if(asins) {
      asins = asins.split(',');
      loadingStart();
      sendMessageToBackground(asins, domain);
    }
    return false;
  })
});

function getBaseUrl(key) {
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

function sendMessageToBackground(asins, domain) {
	chrome.runtime.sendMessage({ asins, baseUrl: getBaseUrl(domain) }, (res) => {
    const table = composeTable(res.data, domain);
    const csv = composeCSV(res.data, domain);
    loadingEnd(table, csv);
  });
}
