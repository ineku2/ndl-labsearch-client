(function (callback){
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractWidget'], callback);
  }
  else {
    callback();
  }
}(function () {


(function ($) {

  AjaxSolr.ExternalServiceWidget = AjaxSolr.AbstractWidget.extend({
    init: function (){ },
    rules: {
      "google-books": {
        link: "http://www.google.co.jp/search?tbs=bks:1&tbo=p&q=[KEYWORD]",
        name: "Google Books"
      },
      "google-scholar": {
        link: "http://scholar.google.co.jp/scholar?q=[KEYWORD]",
        name: "Google Scholar"
      },
      "web_cat-plus": {
        link: "http://webcatplus.nii.ac.jp/index.html?type=equals-book&text=[KEYWORD]",
        name: "WebCat Plus"
      },
      "world-cat": {
        link: "http://www.worldcat.org/search?q=[KEYWORD]",
        name: "World Cat"
      }
    },
    afterRequest: function (){
      var keyword = this.getAnyQuery();
      var external_list = $("<ul>")
      for (key in this.rules){
        var li = $("<li>").append(this.renderLink(key, keyword));
        external_list.append(li);
      }
      return $(this.target).empty().append(external_list);
    },
    //検索キーワードを取得するメソッド。ハードコーディングしているため要リファクタリング
    getAnyQuery: function (){
      var keyword = this.manager.store.get("q").val().match(/__any__:([^\s]+)(?:\s|$)/);
      return (!keyword) ? "" : keyword[1];
    },
    createLink: function (service, query){
      return this.rules[service].link.replace("[KEYWORD]", query);
    },
    renderLink: function (service, query){
      return $("<a>")
               .attr("target", "_blank")
               .attr("href", this.createLink(service, query))
               .text(this.rules[service].name);
    }
  });

})(jQuery);

}));
