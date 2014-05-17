(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/AbstractTextWidget', 'jquery'], callback);
  }else {
    callback();
  }
}(function (){

(function ($) {

/*
 * SuggestWidget - サジェスト検索を実現するWidget
 *   target : サジェスト検索の入力となるテキストボックス要素
 */
AjaxSolr.SuggestWidget = AjaxSolr.AbstractTextWidget.extend({
  init: function () {
    $(this.target).unbind().removeData('events').val('');

    var self = this;

    var callback = function (response) {
      // サジェストキーワードのリストを作成
      var list = [];
      var cnt  = 2;
      var len  = response.terms.autocomplete.length;
      for (var i = 0; i < Math.ceil(len/cnt); i++) {
        var j = i*cnt;
        var set = response.terms.autocomplete.slice(j, j+cnt);
        list.push({
          label: "%value (%count)".replace("%value", set[0]).replace("%count", set[1]),
          value: set[0],
          count: set[1]
        });
      }

      // サジェスト結果をjQuery-UIを利用して表示する
      self.requestSent = false;
      $(self.target).autocomplete({
        source: list,
        select: function(event, ui) {
          if (ui.item) {
            $(self.target).val(ui.item.value).submit();
          }
        }
      })
    } // end callback

    // テキストボックスにテキストが入力されたらサジェスト検索リクエストを投げる
    $(self.target).bind('keydown', function(e) {
      var value = $(this).val();
      if (value==""){
        self.set_key("");
      } else if (!!value && self.set_key(value) && e.which!=38 && e.which!=40 && e.which!=13 && e.which!=46 && e.which!=8) {
        self.suggest_request(value, callback);
      }
    });

    return self;
  },
  set_key: function (value){
    self.keyword = value;
    return !!value;
  },
  suggest_request: function (q, callback){
    //サジェスト検索を実行
    var params = ['terms.fl=autocomplete'];
    params.push('terms.prefix=' + q);
    $.getJSON(this.manager.solrUrl + 'terms?' + params.join('&') + '&wt=json&json.wrf=?', {}, callback);
  }
});

})(jQuery);

}));
