(function (callback){
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractWidget', 'StateStore'], callback);
  }
  else {
    callback();
  }
}(function () {

(function ($) {

  AjaxSolr.DetailPageWidget = AjaxSolr.AbstractWidget.extend({
    constructor: function (attributes) {
      AjaxSolr.AbstractTextWidget.__super__.constructor.apply(this, arguments);
      AjaxSolr.extend(this, attributes);
    },
    init: function (){
      var widget = this;

      // selectedPage イベントが発火したら書誌詳細を描画
      widget.manager.state_store.hook("selectedPage", function (e){
	var iss_id = e.currentTarget.selectedPage;
        widget.showPage(iss_id);
      });

    },
    showPage: function (iss_id){
      var widget = this;
      var docs   = widget.manager.response.response.docs;
      var doc    = null;
      for(var i=0;i<docs.length;i++){
        if (docs[i].iss_id == iss_id){
          doc   = docs[i];
          break;
        }
      }
      $(widget.target).empty();
      return $(this.target).append(this.template(doc));
    },
    template: function (doc){
      var space  = $(("<div class='item-detail' id='detail-%iss_id'></div>").replace('%iss_id', doc.iss_id));
      space.append($(("<h3>%title</h3>").replace("%title", doc.title_view)));
      var table = $("<table></table>");
      table.append($("<tr><th>タイトル:</th><td>%title</td></td></tr>".replace("%title", doc.title_view)));
      table.append($("<tr><th>著者:</th><td>%author</td></td></tr>".replace("%author", doc.authors_view)));
      table.append($("<tr><th>出版社:</th><td>%publisher</td></td></tr>".replace("%publisher", doc.publishers_view)));
      space.append(table);

      return space;
    }

  });

})(jQuery);

}));
