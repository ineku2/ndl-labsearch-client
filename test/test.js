require([
  "jquery",
  "store",
  "ndlsearch",
  "settings",
  "mocha",
  "chai",
  "sinon",
  "widgets/ResultWidget",
  "widgets/CurrentSearchWidget",
  "widgets/FacetWidget",
  "widgets/AdvancedSearchWidget",
  "widgets/SuggestWidget",
  "widgets/BookmarkWidget",
  "widgets/RecommenderWidget",
  "widgets/TagcloudWidget",
], function ($, store, NdlSearch, settings, mocha, chai, sinon){

  //mochaのセットアップ
  mocha.setup('bdd');
  var assert = chai.assert;
  var expect = chai.expect;
  chai.should();

  
  //テストケース
  describe('AjaxSolr.Manager', function (){
    var Manager;

    beforeEach(function (){
      Manager = new AjaxSolr.Manager({solrUrl: settings.labs.solrUrl });
    });

    afterEach(function (){
      delete Manager;
    });

    describe('', function (){
      it('is object', function (){
	expect(Manager).to.be.a('object');
      });
    });

    describe('#setStateStore', function (){
      it('should return an instance of AjaxSolr.StateStore', function (){
	expect(Manager.setStateStore()).to.be.instanceof(AjaxSolr.StateStore);
      });

      it('set AjaxSolr.StateStore in Manager.state_store', function (){
	expect(Manager.state_store).to.be.a('null');
	Manager.setStateStore();
	expect(Manager.state_store).to.be.instanceof(AjaxSolr.StateStore);
      });
    });

    describe('#setVariantField', function (){
      var correct_case;

      before(function (){
        correct_case = function (){
          return Manager.setVariantField('__test__', "(%VALUE%)" );
        };
      });

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

    describe('#expand_query', function (){
      beforeEach(function (){
	Manager.setVariantField('__test__', "(test:%VALUE%)");
      });

      it('should return string object', function (){
	console.log(Manager.variant_fields);
	expect( Manager.expand_query('test') ).to.be.a('string');
      });

      it('should return string object', function (){
	var target =decodeURIComponent( Manager.expand_query(encodeURIComponent('__test__:query')) );
	expect(target).to.be.a('string');
	expect(target).to.equal('(test:query)');
      });
    });

    describe('#executeRequest', function (){
      var server, success, failure;

      beforeEach(function (){
	sinon.stub($, 'ajax', function (options) {
	  var d = $.Deferred();
	  if(options.success){
	    d.done(options.success({
	      status_code: 200,
	      data: {
	        response: {},
	        facet_counts: {}
	      }
	    }));
	  }
	  if(options.error){
	    d.fail(options.error);
	  }
	  d.success = d.done;
	  d.error   = d.fail;
	  return d;
	});

	success = sinon.spy();
	failure = sinon.spy();
      });

      afterEach(function (){
	$.ajax.restore();
      });

      it('should return jQuery Deffered Object', function (){
	var result = Manager.executeRequest('/select', 'q=*%3A*', success, failure);
	expect(result).to.be.instanceof(Object);
	expect(result.done).to.be.a('function');
	expect(result.fail).to.be.a('function');
	expect(result.resolve).to.be.a('function');
	expect(result.reject).to.be.a('function');
      });

      it('call jQuery.ajax', function (){
	Manager.executeRequest('/select', 'q=*%3A*', success, failure);
	expect($.ajax.calledOnce).to.be.true;
      });

      it('call success handler when success', function (){
	Manager.executeRequest('/select', 'q=*%3A*', success, failure).resolve();
	expect(success.calledOnce).to.be.true;
      });

      it('call failure handler when failure', function (){
	Manager.executeRequest('/select', 'q=*%3A*', success, failure).reject();
	expect(failure.calledOnce).to.be.true;
      });

    });

  });

  //テストの実行
  $(function (){
    mocha.checkLeaks();
    if (window.mochaPhantomJS) {
      window.mochaPhantomJS.run();
    } else {
      mocha.run();
    }
  });
});
