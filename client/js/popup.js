const baseUrl = 'http://45.76.106.184:81/bsr-chrome-ext/server/';
// const baseUrl = 'http://localhost/bsr-chrome-ext/server/';

const composeTable = (data, domain) => {
  let tpl = '';
  for(const id in data) {
    const asins = data[id];
    if(Array.isArray(asins)) {
      asins.map(asin => {
        const { rank, cats, } = asin;
        tpl += `
          <tr>
            <td>${id}</td>
            <td>${domain}</td>
            <td>${rank}</td>
            <td>${cats.join(' > ')}</td>
          </tr>
        `;
      })
    }
  }
  return tpl;
}

const composeCSV = (data, domain) => {
  let str = 'ASIN,Domain,Rank,Categories\n';
  for(const id in data) {
    const asins = data[id];
    if(Array.isArray(asins)) {
      asins.map(asin => {
        const { rank, cats } = asin;
        str += `${id},${domain},${rank},${cats.join(' > ')}\n`;
      })
    }
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

const request = (url, domain) => {
  loadingStart();
  $.get(url, (res) => {
    const table = composeTable(res.data, domain);
    const csv = composeCSV(res.data, domain);
    loadingEnd(table, csv);
  }, 'json');
}

const init = () => {
  $('table').hide();
  $('.spin-loading').hide();
  $('a#export-csv').hide();
}

const textInputTpl = `
  <div class="row">
    <div class="seven columns">
      <input class="u-full-width asins" placeholder="eg: B00DGN23UI" type="text" />
    </div>
    <div class="five columns">
      <button class="button float float-right remove">Remove</button>
    </div>
  </div>
`;

$(document).ready(function(){
  init();
  $('#append-btn').click(() => {
    $('#asins-wrapper').append(textInputTpl);
    /** bind events listener on dynamic button */
    $(document).on("click", "button.remove" , function() {
        $(this).parent().parent().remove();
    });
    /** stop page reloading */
    return false;
  });

  $('#start-btn').click(() => {
    const asins = [];
    $('input.asins').each((i, el) => {
      if($(el).val()) {
        asins.push($(el).val());
      }
    });
    const domain = $('select#amazon-domain').val();
    const url = `${baseUrl}?domain=${domain}&asins=${asins.join(',')}`;
    request(url, domain);
    return false;
  })
});
