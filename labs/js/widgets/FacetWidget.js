(function (callback){
  if (typeof define === 'function' && define.amd){
    define(["core/AbstractFacetWidget", "jquery", "vue"], callback);
  } else {
    callback(AjaxSolr.AbstractFacetWidget, jQuery, Vue);
  }
}(function (AbstractFacetWidget, jQuery, Vue){

  (function ($){

  var FacetWidgetViewModel = 
    /* ここから本体 */
    AjaxSolr.FacetWidget = AjaxSolr.AbstractFacetWidget.extend({
      constructor: function (attributes) {
        AjaxSolr.FacetWidget.__super__.constructor.apply(this, arguments);

        var widget = this;
        widget.vm =  new Vue({
          el: widget.target,
          template: '<h3>{{title}}</h3>' +
                  '<span v-if="hide">' +
                    'no items found in current selection' +
                  '</span>' +
                  '<ul class="facet" v-if="show">' +
                    '<li class="facet-item" v-repeat="items_disp">' +
                      '<a href="#" v-on="click: clickHandler(this)">' +
                        '{{label}} ({{count}})' +
                      '</a>' +
                    '</li>' +
                    '<li class="more" v-on="click: toggle">' +
                      '{{toggled ? "閉じる" :"もっと見る" }}' +
                    '</li>' +
                  '</ul>',
          data: {
            title: 'no title',
            items: [],
            items_len: 5,
            toggled: false,
            show: true
          },
          computed: {
            items_disp: function (){
              if (this.toggled){
                return this.items;
              } else {
                return this.items.slice(0, (this.items_len || 0)-1);
              }
            },
            hide: function (){
              return !this.show;
            }
          },
          methods: {
            toggle: function (){
              this.toggled = !this.toggled; 
            },
            clickHandler: function (item){
              var handler =  widget.clickHandler(item.facet);
              return handler();
            }
          }
        });
      },
      translation: false,
      translation_dic:{},
      translate_label: function (label){
        return this.translation_dic[label] || label;
      },
      afterRequest: function () {
        var widget = this;
        var facet_list = [];
        var label, objectedItems;

        if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
          widget.vm.show = false;
          return widget;
        }

        if(this.asscend){
          objectedItems = this.getFacetCounts().sort(function (a, b) {
            return a.facet < b.facet  ? -1 : 1;
          });
        }else{
          objectedItems = this.getFacetCounts().sort(function (a, b) {
            return a.facet < b.facet  ? 1 : -1;
          });
        }

        for (var i = 0, l = objectedItems.length; i < l; i++) {
          facet = objectedItems[i].facet;
          if (this.translation){
            label = this.translate_label(facet);
          }else{
            label = facet;
          }
          facet_list.push({
            facet: facet,
            label: label,
            count: objectedItems[i].count
          });
        }

        //ViewModelにファセットの内容を反映
        widget.vm.title = widget.title || 'no title';
        widget.vm.items = facet_list;

        return widget;
      }
    });
  })(jQuery);

}));
