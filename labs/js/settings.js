define([], function (){

  //SolrのURLなど、環境に依存する設定情報はここに記述する
  var settings = {
    'labs': {
      'solrUrl': 'http://lab.ndl.go.jp/ndls/api/search/',
      'recommenderUrl': 'http://lab.ndl.go.jp/ndls/api/search/',
    }
  }

  return settings;
});
