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

  var Manager = new AjaxSolr.Manager({
                    solrUrl: settings.labs.solrUrl
  });

  //テストケース
  describe('AjaxSolr.Manager', function (){

    it('is object', function (){
      expect(Manager).to.be.a('object');
    });

    describe('#setVariantField', function (){
      var correct_case = function (){ 
	return Manager.setVariantField('__test__', "(%VALUE%)" );
      };

      it('is a method of AjaxSolr.Manager', function (){
	expect(Manager).to.have.property('setVariantField');
	expect(Manager.setVariantField).to.be.a('function');
      });

      it('has two arguments', function (){
	expect(function (){ Manager.setVariantField() }).to.throw(Error);
	expect(function (){ Manager.setVariantField('__test__') }).to.throw(Error);
	expect(correct_case).to.not.throw(Error);
      });

      it('type of two arguments should be string', function (){
	expect(function (){ Manager.setVariantField(12, 0) }).to.throw(Error);
	expect(function (){ Manager.setVariantField({test:'test'}, [1,2,3]) }).to.throw(Error);
      });

      it('return an array', function (){
	expect(correct_case()).to.be.instanceof(Array);
      });
    });

  });

  //テストの実行
  mocha.checkLeaks();
  mocha.run();
});
