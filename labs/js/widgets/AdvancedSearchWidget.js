(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/AbstractTextWidget', 'jquery'], callback);
  }
  else {
    callback();
  }
}(function (){

/**
 * Widget for advanced search form 
 *
 * @class AdvancedSearchWidget
 * @augments AjaxSolr.AbstractTextWidget
 */
(function ($) {

  AjaxSolr.AdvancedSearchWidget = AjaxSolr.AbstractTextWidget.extend({
    init: function () {
      var self = this;

      if(!!self.limit){
        self.manager.store.get('limit').val(this.limit)
      }

      $(this.target).submit(function(e) {
        var target = this;
        self.search(target);

        return false; 
      });

      // initをオーバーロードするときはselfを返さないとrequireがエラーになる
      return self;
    },
    buildQuery: function (target){
      var self = this;
      /* キーワードのクエリを生成 */
      var keyword = $(target).find("#keyword").val();
      var query_keyword = keyword.match(/^\s*$/) ? "" : "__any__:(" + keyword + ")";

      /* テキストフィールドの値からクエリを生成 */
      var advanced_query = self.createFieldsQuery(target);

      /* 資料種別の絞り込み */
      var media_type_query = self.createMediaTypeQuery(target);

      /* 最終的なクエリの生成 */
      query = $([query_keyword.replace(/(\s|　)+/,"+"), advanced_query, media_type_query]).filter(function (){ return this != ""; }).get().join(" AND ");
      if (query.match(/^\s*$/)){
        query = "*:*"
      }

      return query;
    },
    search: function (target){
      var self = this;
      var query = self.buildQuery(target);

      /* 検索の実行 */
      if (self.set(query)) {
        self.doRequest();
      }

      return false;
    },
    afterRequest: function (){
      $("#home").hide();
      $("#main").show();
      $('body').addClass('searching');

      var keyword = this.manager.store.get('q').value.match(/__any__:([^\s\&]+)/);
      if(keyword != null && keyword.length > 1){
        $("#keyword").val(keyword[1].replace(/\+/g, " "));
      }else{
        $("#keyword").val("");
      }
    },
    createAnyQuery: function (keyword){
      var self = this;
      var query_keyword_list = [];
      var query_keyword = "";

      var converted_keyword = keyword.split(/(　|\s)+/);
      if (converted_keyword.length > 1){
        converted_keyword = "("+converted_keyword.join(" AND ")+")";
      }else{
        converted_keyword = keyword;
      }

      for (var i = 0; i < self.keyword_fields.length; i++) {
        var field = self.keyword_fields[i];
        query_keyword_list.push(field + ':' + converted_keyword);
      }
      if (keyword != "" && query_keyword_list.length > 0) { 
        var query_keyword = "("+query_keyword_list.join(" OR ")+")"
      }

      return query_keyword;
    },
    createFieldsQuery: function (target){
      var self = this;
      var query_list = [];
      var advanced_query = "";
      $(target).find("#advanced input:text")
	     .filter(function (){ return !!$(this).val(); })
	     .each(function (){
	       var field = $(this).attr("name");
	       query_list.push(field + ':' + $(this).val().replace(/\s+/g,"+"));
	     });
      if (query_list.length > 0){
	advanced_query = "("+query_list.join(" AND ")+")";
      }

      return advanced_query;
    },
    createMediaTypeQuery: function (target){
      var self = this;
      var media_type_query = [];
      media_types = $(target).find("#mediatypes input:checkbox").filter(function (){ return $(this).attr("checked")=="checked" })

      if ($(target).find("#mediatypes input:checkbox").length != media_types.length){
	media_types.each(function (){
	  var q = "uiMediaType_sm:"+$(this).val();
	  media_type_query.push(q);
	});
      }

      if (media_type_query.length != 0) {
	media_type_query = "("+media_type_query.join(" OR ")+")"
      }else{ 
	media_type_query = ""
      }

      return media_type_query;
    }
  });

})(jQuery);

}));
