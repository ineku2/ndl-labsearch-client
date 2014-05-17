(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractTextWidget'], callback);
  }
  else {
    callback();
  }
}(function () {
  /* カテゴリー検索用のドロップダウンメニュー */
  AjaxSolr.CategorySearchWidget = AjaxSolr.AbstractTextWidget.extend({
    ndc_fields: ['ndc_facet_sm', 'ndc_facet2_sm', 'ndc_facet3_sm'],
    init: function (){
      var widget = this;

      $(widget.target).on('click', function (){
        var param = 'q=*:*&rows=0&facet=true&facet.field=ndc_facet_sm&wt=json&json.wrf=?';
        widget.executeRequest(param, widget.renderFirstLayer.bind(widget));
      });

      $('body').click(function (){
        if(!widget.isMouseOvered){
          widget.clear();
        }
      });
    },
    clear: function (){
      var widget = this;
      this.clearPanel();
      $(widget.element).hide();
    },
    clearPanel: function (){
      var widget = this;
      $(".menu-list-selected").removeClass("menu-list-selected");
      $(widget.element).empty();
    },
    renderPanel: function (){
      var widget = this;
      if (!widget.element){
	widget.element = $('<div>').attr("id", "category_panel")
	  .addClass("panel_category menu-panel")
	  .css("left", $("#nav-category").offset().left+"px")
	  .hide()
	  .insertAfter("#header")
	  .mouseleave(function (){
	    widget.isMouseOvered = false;
	  })
	  .mouseover(function (){
	    widget.isMouseOvered = true;
	  });
      }
      return widget.element;
    },
    renderLayerList: function (parent_elem, data, searchHandler, clickHandler){
      var widget = this;
      /* 第1次区分のメニュー項目を挿入 */
      for(var i=0, l=10;i<l;i++){
	parent_elem.append(widget.renderLayerItem(data[i], searchHandler, clickHandler));
      }
      return parent_elem;
    },
    afterRequest: function (){
      $("#home").hide();
      $("#main").show();
    },
    renderLayerItem: function (data, searchHandler, clickHandler){
      var widget = this;
      var label = data.label;
      var count = data.count;
      return $('<li>')
		 .addClass('category_label')
		 .append(
		   $('<a>')
		   .text(label+'('+count+')')
		   .on('click', function (){
                     widget.clearPanel();
                     return searchHandler(label);
                   })
		 )
		 .append(
		   $('<a>')
		   .text('->')
		   .addClass('search_link')
		   .on('click', function (){
                     return clickHandler(label);
                   })
		 );
    },
    renderFirstLayer: function (dataset){
      var widget = this;

      /* カテゴリー検索パネルを作成 */
      widget.clearPanel();
      $("#nav-category").addClass("menu-list-selected");

      first_layer = $('<ul>').addClass("first_layer");
      first_layer.append($('<li class="category_header">第1次区分</li>'))
      this.renderLayerList(first_layer, widget.ndcs_first, function (label){
        widget.manager.store.exposedReset();
        widget.set('ndc_facet_sm:"'+label+'"');
        widget.doRequest();
      },function (label){
        var param = 'q=*:*&fq=ndc_facet_sm:'+label+'&rows=0&facet=true&facet.field=ndc_facet2_sm&wt=json&json.wrf=?';
        widget.executeRequest(param, widget.renderSecondLayer.bind(widget));
      });

      panel = widget.renderPanel(); 
      panel.append(first_layer);
      panel.append($('<div class="footer"></div>'));

      /* カテゴリー検索パネルを表示 */
      panel.fadeIn();
    },
    renderSecondLayer: function (dataset){
      var widget = this;

      /* 第2次区分のメニュー項目を挿入 */
      $(".second_layer").remove();
      $(".third_layer").remove();

      var layer = $("<ul>").addClass("second_layer").hide();
      layer.append($('<li class="category_header">第2次区分</li>'))
      this.renderLayerList(layer, widget.ndcs_second, function (label){
        widget.manager.store.exposedReset();
        widget.set('ndc_facet2_sm:"'+label+'"');
        widget.doRequest();
      }, function (label){
        var param = 'q=*:*&fq=ndc_facet_sm:'+label+'&rows=0&facet=true&facet.field=ndc_facet3_sm&wt=json&json.wrf=?';
        widget.executeRequest(param, widget.renderThirdLayer.bind(widget));
      });

      layer.insertBefore($("#category_panel .footer"));
      $(".second_layer").fadeOut();
      $(".second_layer").fadeIn();
      $(".second_layer").css("height", $(".first_layer").height())
    },
    renderThirdLayer: function (dataset){
      var widget = this;
      /* 第3次区分のメニュー項目を挿入 */
      $(".third_layer").remove();
      var layer = $("<ul>").addClass("third_layer").hide();
      layer.append($('<li class="category_header">第3次区分</li>'))
      this.renderLayerList(layer, widget.ndcs_third, function (label){
        widget.manager.store.exposedReset();
        widget.set('ndc_facet3_sm:"'+label+'"');
        widget.doRequest();
      }, function (label){

      });

      layer.insertBefore($("#category_panel .footer"));
      $(".third_layer").fadeOut();
      $(".third_layer").fadeIn();
      $(".third_layer").css("height", $(".first_layer").height())
    },
    import_ndcs: function (data){
      var facets = data.facet_counts.facet_fields;

      var convert = function (arr){
        if (!arr){
          return [];
        }else{
	  var new_arr = [];
	  //配列を2つずつ取り出してオブジェクトに変換する
	  for(var i = 0, l=Math.ceil(arr.length/2); i < l; i++) {
	    var j = i * 2;
	    var p = arr.slice(j, j + 2);
            if (parseInt(p[1]) > 0){
	      new_arr.push({'label':p[0], 'count':p[1]});
            }
	  }
          new_arr.sort(function (a,b){
            if (a.count < b.count) return  1;
            if (a.count > b.count) return -1;
            return 0;
          });
	  return new_arr;
        }
      };

      this.ndcs_first  = convert(facets.ndc_facet_sm);
      this.ndcs_second = convert(facets.ndc_facet2_sm);
      this.ndcs_third  = convert(facets.ndc_facet3_sm);

      return {'ndcs_first': this.ndcs_first, 'ndcs_second': this.ndcs_second, 'ndcs_third': this.ndcs_third};
    },
    /**
     * This method is executed if Solr encounters an error.
     *
     * @param {String} message An error message.
     */
    handleError: function (message) {
      window.console && console.log && console.log(message);
    },
    executeRequest: function (params, handler, errorHandler) {
      var widget = this,
          options = {dataType: 'json'}

     
      wraped_handler = function (data) {
        handler(widget.import_ndcs(data));
      };

      errorHandler = errorHandler || function (jqXHR, textStatus, errorThrown) {
	widget.handleError(textStatus + ', ' + errorThrown);
      };

      options.url = this.manager.solrUrl + 'select?' + params;

      jQuery.ajax(options).done(wraped_handler).fail(errorHandler);
    }

  });


}));
