require([
  "jquery",
  "store",
  "ndlsearch",
  "settings",
  "mocha",
  "chai",
  "widgets/ResultWidget",
  "widgets/CurrentSearchWidget",
  "widgets/FacetWidget",
  "widgets/AdvancedSearchWidget",
  "widgets/SuggestWidget",
  "widgets/BookmarkWidget",
  "widgets/RecommenderWidget",
  "widgets/TagcloudWidget",
], function ($, store, NdlSearch, settings, mocha, chai){

  //mochaのセットアップ
  mocha.setup('bdd');
  var assert = chai.assert;
  var expect = chai.expect;
  chai.should();

  //テストケース
  describe('test', function (){
    it('is test', function (){ expect(true).to.eql(true); });
  });

  //テストの実行
  mocha.checkLeaks();
  mocha.run();
});
