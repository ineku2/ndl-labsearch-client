require([
  "jquery",
  "store",
  "ndlsearch",
  "settings",
  "widgets/ResultWidget",
  "widgets/CurrentSearchWidget",
  "widgets/FacetWidget",
  "widgets/AdvancedSearchWidget",
  "widgets/SuggestWidget",
  "widgets/BookmarkWidget",
  "widgets/RecommenderWidget",
  "widgets/TagcloudWidget"
], function ($, store, NdlSearch, settings){

  AjaxSolr.checkType = function (type, obj) {
    var clas = Object.prototype.toString.call(obj).slice(8, -1);
    return obj !== undefined && obj !== null && clas === type;
  };
  AjaxSolr.isString = AjaxSolr.checkType.bind(AjaxSolr, "String");
  AjaxSolr.isNumber = AjaxSolr.checkType.bind(AjaxSolr, "Number");
  AjaxSolr.isObject = AjaxSolr.checkType.bind(AjaxSolr, "Object");
  AjaxSolr.isArray = AjaxSolr.checkType.bind(AjaxSolr, "Array");

  var Manager;

  $(function () {
      if (!store.enabled) {
          alert('このブラウザではブックマークの保存機能が使用できません。資料のブックマークを保存しておきたい場合にはプライベートモードを解除するか、ブラウザを最新のものに更新してください。')
          return
      }

      $(window).resize(function (){
        if($('body').width() <= 990){
          $('#result').css('width', $(window).width());
        }
      });

      $("#facet-toggle").on('click', function (e){
        e.preventDefault();
        if($("#result").is(':visible')){
          $("body").removeClass("advanced-service-active");
          $("body").toggleClass("facet-active");
        }
      });

      $("#advanced-service-toggle").on('click', function (e){
        e.preventDefault();
        $("body").removeClass("facet-active");
        $("body").toggleClass("advanced-service-active");
      });

      $("#switch-mediatypes").on('click', function (e){
        e.preventDefault();
        var value = (!$("#mediatypes input").attr("checked"));
        $("#mediatypes input").attr("checked", value);
      });

      var base_title = settings.labs.base_title || 'NDLラボサーチ';

      Manager = new AjaxSolr.Manager({
		    solrUrl: settings.labs.solrUrl
      });

      //検索クエリと検索結果を保存するParameterStore派生クラスを登録する
      Manager.setStore(new AjaxSolr.ParameterHistoryStore({
                           exposed: ['q', 'fq', 'sort', 'start'],
                           changeTitleHandler: function (){
                             var any_q = this.get("q").val().match(/__any__:(.+)(?:\s|$)/);
                             any_q = !any_q ? "" : any_q[1] + " - ";
                             return any_q+base_title;
                           }
      }));

      //複数のクエリに展開するための特殊なクエリを設定する
      Manager.setVariantField("__any__", "(title_cjk_text:%VALUE% OR author_cjk_text:%VALUE% OR publisher_cjk_text:%VALUE% OR subject_cjk_text:%VALUE%)");
      Manager.setStateStore();
      Manager.addWidget(new AjaxSolr.ResultWidget({
	      id: 'result',
	      target: '#docs',
        highlight: true
      }));

      //検索画面下部のページ送りをレンダリングするWidget
      Manager.addWidget(new AjaxSolr.PagerWidget({
        id: 'pager',
        target: '#pager',
        prevLabel: '&lt;',
        nextLabel: '&gt;',
        innerWindow: 1,
        limit: 1000,
        renderHeader: function (perPage, offset, total) {
              var widget = this;

              if(total >= this.limit){
                var result_stat = $('<span class="result-stat"></span>').html('('+this.manager.response.response.numFound+'中 <strong>' + total + '</strong>件 )');
              } else {
                var result_stat = $('<span class="result-stat"></span>').html('( <strong>' + total + '</strong>件 )');
              }

              // 検索結果の並び替えUIの描画(要リファクタリング)
              //var sort_form   = $('<form method="GET" action="return false;" id="sort_form"><span><strong>並び順:</strong></span><select id="sort" name="sort"><option value="">-</option><option value="issued_dm desc">新しい順</option><option value="issued_dm asc">古い順</option><option value="sortTitleTranscription_ss asc">タイトル(昇順)</option><option value="sortTitleTranscription_ss desc">タイトル(降順)</option></select></form>');

              var rows_form  = $('<form method="GET" id="rows_form"><label for="search-rows">表示件数</label><input id="search-rows" type="text"></input></form>');

	            //簡易的なページ送りUIを検索結果上部に挿入
              var simple_pager =  widget.simplePagerTemplate.call(widget, {
                offset: offset,
                perPage: perPage,
                total: total
              });

	           $('#pager-header').empty().append(result_stat);
	           $('#pager-sort')
                .empty()
                //.append(sort_form)
                .append(rows_form)
                .append(simple_pager);

              var sort_val = Manager.store.get('sort').val()
              if (!!sort_val){
                $("#sort").val(sort_val);
              }
              $("#sort").on("change", function (e){
                var selected = $("#sort option:selected");
                Manager.store.get('sort').val(selected.attr("value"))
                widget.doRequest();
                return false;
              });
 
              var rows_val = Manager.store.get('rows').val()
              $("#search-rows").val(rows_val || 10);
              $("#rows_form").on("submit", function (e){
                var rows = parseInt($("#search-rows").val());
                if (rows > 0){
		              Manager.store.get('start').val(0);
		              Manager.store.get('rows').val(rows);
                } else {
                  rows = (Manager.store.get('rows').val() || 10)
                  $("#search-rows").val(rows);
                }

                widget.doRequest();
                e.preventDefault();
		            return false;
              });

	  },
    simplePagerTemplate: function (args){
            var widget       = this,
                offset       = args.offset,
                perPage      = args.perPage,
                total        = args.total,
	        current_page = Math.ceil(offset/perPage)+1,
	        total_page   = Math.ceil(total/perPage),
	        simple_pager = $('<span id="simple_pager"></span>');

          if (current_page > 1){
            simple_pager.append(
              $('<a href="" id="simple_pager_prev">&lt;&lt;前</a>').click(
                widget.clickHandler(widget.previousPage())
              )
            )
          }

          simple_pager.append($(' <span> '+current_page+' / '+total_page+' </span>'))

          if (current_page < total_page){
            simple_pager.append(
              $('<a href="" id="simple_pager_next">次&gt;&gt;</a></span>').click(
                widget.clickHandler(widget.nextPage())
              )
            );
          }

          return simple_pager;
        }
      }));

      Manager.addWidget(new AjaxSolr.SuggestWidget({
	  id: 'suggestsearch',
	  target: '#keyword'
      }));

      Manager.addWidget(new AjaxSolr.AdvancedSearchWidget({
	  id: 'search',
	  target: '#search',
	  keyword_fields: ['title_text', 'author_text', 'publisher_text', 'subject_text']
      }));

      Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
         id: 'currentsearch',
         target: '#selection',
         field_translation: [
           //資料種別の値が番号であるため、力技で日本語に表示を変換
           ["uiMediaType_sm:10", "資料種別:雑誌記事索引"],
           ["uiMediaType_sm:11", "資料種別:その他"],
           ["uiMediaType_sm:01", "資料種別:本"],
           ["uiMediaType_sm:02", "資料種別:雑誌"],
           ["uiMediaType_sm:03", "資料種別:新聞"],
           ["uiMediaType_sm:04", "資料種別:電子資料"],
           ["uiMediaType_sm:05", "資料種別:博士論文"],
           ["uiMediaType_sm:06", "資料種別:地図"],
           ["uiMediaType_sm:07", "資料種別:録音資料"],
           ["uiMediaType_sm:08", "資料種別:映像資料"],
           ["uiMediaType_sm:09", "資料種別:規格・テクニカルレポート"],
           ["uiMediaType_sm", "資料種別"],
           ["issuedYear_sm", "刊行年"],
           ["publisher_sm", "出版者"],
           ["ndcFacet1_sm", "分類"],
           ["title_cjk_norm_text", "タイトル"],
           ["author_cjk_norm_text", "著者"],
           ["__any__", "キーワード"],
           ["simple_text", "キーワード"],
           ["keyword_sm", "タグ"],
           [/\(|\)/g, ""]
         ]
      }));

      //資料種別のファセット
      var ui_media_type_facet_opts = {
          id: 'ui_media_type-facet',
          asscend: true,
          title: '資料種別',
          target: '#ui_media_type-facet',
          field: 'uiMediaType_sm',
          //資料種別の値を番号から日本語に変換
          translation:true,
          translation_dic: {
            "01": "本",
            "02": "雑誌",
            "03": "新聞",
            "04": "電子資料",
            "05": "博士論文",
            "06": "地図",
            "07": "録音資料",
            "08": "映像資料",
            "09": "規格・テクニカルレポート",
            "10": "雑誌記事索引",
            "11": "その他"
          }
      };
      ui_media_type_facet_opts['facet.field'] = 'uiMediaType_sm';
      ui_media_type_facet_opts['facet.mincount'] = 1;
      Manager.addWidget(new AjaxSolr.FacetWidget(ui_media_type_facet_opts));


      //刊行年のファセット
      var issued_facet_opts = {
        id: 'issued-facet',
        title: '刊行年',
        target: '#issued-facet',
        asscend: false,
        field: 'issuedYear_sm'
      };
      issued_facet_opts['facet.field'] = 'issuedYear_sm';
      issued_facet_opts['facet.mincount'] = 1;
      Manager.addWidget(new AjaxSolr.FacetWidget(issued_facet_opts));

      /*出版者のファセット
      var publisher_facet_opts = {
        id: 'publisher-facet',
        title: '出版者',
        target: '#publisher-facet',
        field: 'publisher_sm',
        asscend: true,
      };
      publisher_facet_opts['facet.field'] = 'publisher_sm';
      publisher_facet_opts['facet.mincount'] = 1;
      Manager.addWidget(new AjaxSolr.FacetWidget(publisher_facet_opts));
      */

      //NDCのファセット
      var ndc_facet_opts = {
        id: 'ndc-facet',
        title: '分類',
        target: '#ndc-facet',
        field: 'ndcFacet1_sm',
        asscend: true,
      };
      ndc_facet_opts['facet.field'] = 'ndc_facet1_sm';
      ndc_facet_opts['facet.mincount'] = 1;
      Manager.addWidget(new AjaxSolr.FacetWidget(ndc_facet_opts));

      Manager.recommender = new AjaxSolr.RecommenderWidget({
        id: 'recommendation',
        target: $("#recommendation"),
        recommenderUrl: settings.labs.recommenderUrl
      });
      Manager.addWidget(Manager.recommender);

      Manager.bookmarks = new AjaxSolr.BookmarkWidget({
        id: 'bookmarks',
        target: $("#bookmarks")
      });
      Manager.addWidget(Manager.bookmarks);

      Manager.tagcloud = new AjaxSolr.TagcloudWidget({
        id: 'tagcloud',
        title: 'タグクラウド',
        target: $("#tagcloud"),
        field: "keyword_sm",
        'facet.field': "keyword_sm",
        'facet.limit': 20 
      });
      Manager.addWidget(Manager.tagcloud);

      Manager.init();

      $(".advanced_button").click(function (){
	$("#advanced").slideToggle();
	return false;
      });

      $("#advanced").hide();
      $("#keyword").focus();
      $("#home-link").click(function (){
        $('body').removeClass('searching');
        Manager.store.exposedReset();
      });

      if(Manager.store.exposedString() == ""){
        Manager.store.addByValue('q', '*:*');
      }else{
        $("#home").hide();
        $("#main").show();
        $('#facet-toggle').hide();
        Manager.doRequest();
      }
  });//-- jQuery load -->

});
