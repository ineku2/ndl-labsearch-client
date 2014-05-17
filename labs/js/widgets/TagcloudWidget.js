/**
 * Widget for tagcloud
 *
 * @class TagcloudWidget
 * @auguments AjaxSolr.AbstractWidget
 */
(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/AbstractFacetWidget', 'jquery'], callback);
  }else{
    callback(AjaxSolr.AbstractFacetWidget, jQuery);
  }
}(function (AbstractFacetWidget, jQuery){

  (function ($){
    AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({
        afterRequest: function () {
            if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
                $(this.target).html('no items found in current selection');
                return;
            }else if (this.manager.response.response.numFound <= 0){
                // 検索結果が0件のときにファセットを非表示にする
                $(this.target).hide();
                return false;
            }

            $(this.target).show();

            /* ファセット情報の取得とソート */
            if(this.asscend){
                var objectedItems = this.getFacetCounts().sort(function (a, b) {
                    return a.facet < b.facet  ? -1 : 1;
                });
            }else{
                var objectedItems = this.getFacetCounts().sort(function (a, b) {
                    return a.facet < b.facet  ? 1 : -1;
                });
            }

            /* クエリに含まれるキーワードは削除 */
            for(var i=0,l=objectedItems.length;i<l;i++){
              if(this.manager.store.get("q").value.match(new RegExp(objectedItems[i].facet))){
                objectedItems.splice(i,1);
                l=l-1;
              }
            }

            /* ファセット件数の最大値を取得 */
            var maxCount = 0;

            for (var i=0,l=objectedItems.length;i<l;i++){
              var count = parseInt(objectedItems[i].count);
              if( count > maxCount){
                maxCount = count;
              }
            }

            /* タグクラウドの描画 */
            $(this.target).empty();

            var title = this.title || 'no title'; 
            $(this.target).append('<h3>'+title+'</h3>')

            for (var i = 0, l = objectedItems.length; i < l; i++) {
                var facet = objectedItems[i].facet,
                    size  = parseInt(objectedItems[i].count / maxCount * 10);

                $(this.target).append(
                    $('<a href="#" class="tagcloud_item"></a>')
                    .text(facet)
                    .addClass('tagcloud_size_' + size)
                    .click(this.clickHandler(facet))
                    );
            }
        }
    });
  })(jQuery);
}));
