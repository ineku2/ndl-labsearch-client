(function (callback){
    if (typeof define === 'function' && define.amd){
        define(["core/AbstractFacetWidget", "jquery"], callback);
    } else {
        callback(AjaxSolr.AbstractFacetWidget, jQuery);
    }
}(function (AbstractFacetWidget, jQuery){

    (function ($){
        /* ここから本体 */
        AjaxSolr.FacetWidget = AjaxSolr.AbstractFacetWidget.extend({
            translation: false,
            translation_dic:{},
            translate_label: function (label){
              return this.translation_dic[label] || label;
            },
            afterRequest: function () {
                if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
                    $(this.target).html('no items found in current selection');
                    return;
                }

                if(this.asscend){
                    var objectedItems = this.getFacetCounts().sort(function (a, b) {
                        return a.facet < b.facet  ? -1 : 1;
                    });
                }else{
                    var objectedItems = this.getFacetCounts().sort(function (a, b) {
                        return a.facet < b.facet  ? 1 : -1;
                    });
                }

                var title = this.title || 'no title'; 

                $(this.target).empty().hide();
                $(this.target).append('<h3>'+title+'</h3>')

                var facet_list = $('<ul class="facet"></ul>')
                $(this.target).append(facet_list)


                for (var i = 0, l = objectedItems.length; i < l; i++) {
                    var facet, label;
                    facet = objectedItems[i].facet
                    if (this.translation){
                      label = this.translate_label(facet) + " ("+objectedItems[i].count+")";
                    }else{
                      label = facet + " ("+objectedItems[i].count+")";
                    }
                    facet_list.append( $('<li class="facet-item"></li>').append($('<a href="#"></a>').text(label).click(this.clickHandler(facet)))) ;
                }

                //ファセットリストの折りたたみUI

                facet_list.append($('<li class="more">もっと見る</li>'));
                facet_list.find('li:gt(5)').not('.more').hide();
                facet_list.find('.more').toggle(function (){
                    facet_list.find('li:gt(5)').not('.more').show();
                    $(this).text("閉じる");
                }, function (){
                    facet_list.find('li:gt(5)').not('.more').hide();
                    $(this).text("もっと見る");
                });

                $(this.target).show();

                return this;
            }

        });
    })(jQuery);

}));
