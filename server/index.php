<?php
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

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include('simple_html_dom.php');
include('mock.php');
header("Access-Control-Allow-Origin: *");

// default
$base_url = "http://www.amazon.com/dp/";

if(!empty($_GET) && $_GET['domain']) {
  switch($_GET['domain']) {
    case 'Japan':
      $base_url = 'https://www.amazon.co.jp/dp/';
      break;
    case 'UK':
      $base_url = 'https://www.amazon.co.uk/dp/';
      break;
    case 'Canada':
      $base_url = 'https://www.amazon.ca/dp/';
      break;
    case 'Mexico':
      $base_url = 'https://www.amazon.com.mx/dp/';
      break;
    case 'Germany':
      $base_url = 'https://www.amazon.de/dp/';
      break;
    case 'France':
      $base_url = 'https://www.amazon.fr/dp/';
      break;
    case 'Spain':
      $base_url = 'https://www.amazon.es/dp/';
      break;
    case 'Australia':
      $base_url = 'https://www.amazon.com.au/dp/';
      break;
    case 'India':
      $base_url = 'https://www.amazon.in/dp/';
      break;
  }
}

function getPage($url) {
  $headers = [
    'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux i686; rv:28.0) Gecko/20100101 Firefox/28.0',
  ];
  $curl = curl_init($url);
  curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
	curl_setopt($curl, CURLOPT_FAILONERROR, true);
	curl_setopt($curl, CURLOPT_FOLLOWLOCATION, true);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	$html = curl_exec($curl);
	curl_close($curl);
	return $html;
}

function parse($html) {
  $ret = [];
  if(method_exists($html, 'find')) {
    /** each rank group item */
    $els = $html->find('li.zg_hrsr_item');
    foreach( $els as $i => $el) {
      $ret[$i]=[ 'rank' => '#', 'cats' => [] ];
      $inner_dom = str_get_html($el->innertext);
      // rank num
      $rank_dom = $inner_dom->find('span.zg_hrsr_rank');
      $rank = is_array($rank_dom) && count($rank_dom)? $rank_dom[0]->innertext : '#';
      $ret[$i]['rank'] = preg_replace('/[^0-9]/', '', $rank);

      // rank categories
      foreach( $inner_dom->find('a') as $a ) {
        /** export to CSV */
        $innertext = str_replace(',',' ',$a->innertext);
        $ret[$i]['cats'][] = $innertext;
      }
    }
  }
  return $ret;
}

$ret = [];

if( !empty($_GET) && $_GET['asins'] ) {
  $asins = explode(',', $_GET['asins']);
  $asins = array_unique($asins);
  foreach($asins as $asin) {
    if($asin) {
      $page = getPage($base_url.$asin);
      $html = str_get_html($page);
      $ret[$asin] = parse($html);
    }
  }
}

// echo '<pre>';
  // print_r( $ret );
  echo json_encode(['data' => $ret]);
// echo '</pre>';
