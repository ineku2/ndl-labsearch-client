require([
  "mocha"
], function (mocha){

  //mochaのセットアップ
  mocha.setup('bdd');

  //テストケースの読み込み
  require([
      "test/cases/AjaxSolr-Manager_spec"
    ], function (require){
      //読み込み終了後にテスト実行
      mocha.checkLeaks();
      if (window.mochaPhantomJS) {
	window.mochaPhantomJS.run();
      } else {
	mocha.run();
      }
  });

});
