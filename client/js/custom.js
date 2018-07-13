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

function sendMessageToBackground(asins, domain) {
	chrome.runtime.sendMessage({ asins, domain }, (res) => {
    const table = composeTable(res.data, domain);
    const csv = composeCSV(res.data, domain);
    loadingEnd(table, csv);
  });
}
