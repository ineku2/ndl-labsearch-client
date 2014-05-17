(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractWidget', 'StateStore'], callback);
  }
  else {
    callback();
  }
}(function () {


(function ($) {

    AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
        start: 0,
        highlight: true,

        beforeRequest: function () {
            $(this.target).html($('<img>').attr('src', 'labs/images/ajax-loader.gif'));
        },
        afterRequest: function () {
          $(this.target).empty();
          var docs = this.manager.response.response.docs;
          if (docs.length > 0){
            for (var i = 0, l = docs.length; i < l; i++) {
              var doc = this.manager.response.response.docs[i];
              $(this.target).append(this.template(doc));

              var items = [];
              items = items.concat(this.facetLinks('資料種別', doc.material_type_view));
              var $links = $('#links_' + doc.id);
              $links.empty();
              for (var j = 0, m = items.length; j < m; j++) {
                $links.append($('<li></li>').append(items[j]));
              }
            }
          }else{
            $(this.target).append(this.template_blank());
          }
        },
        highlightAnyQuery: function (str){
          if (!this.highlight){
            return str;
          }

          // ANYクエリの取得 (インデックススキーマに依存)
          var any_q = this.manager.store.get('q').value.match(/__any__:([^\s]+)(?:\s|$)/),
              any   = "";
         
          if (!!any_q && any_q.length > 0){
            any = any_q[1];
            return str.replace(new RegExp(any, "g"), "<span class='highlight'>"+any+"</span>");
          }else{
            return str 
          }
        },
        createFieldString: function (doc, field){
          var field_data, tag_name, attributes, value, name = [], item;
          field_data = doc[field];

          if(!field_data){
            return "";
          }

          for(var i=0, j=field_data.length;i<j;i++){
            //JSONのパースをかけ、失敗したら文字列として扱う
            try {
              item = JSON.parse(field_data[i]);
            } catch(e) {
              item = field_data[i];
            }

            if (AjaxSolr.isString(item)){
              name.push(item)
            } else {
              //オブジェクトからフィールドの値を取り出す
              tag_name   = item[0];
              attributes = item[1];
              value      = item[2];
              name.push(value[2]);
            }
          }

          name = name.join("; ").replace(/\/\//g,"").replace(/@@/g, " ");
          return name;
        },
        template: function (doc) {
            var self = this, list = $('<ul class="list-inline">');
            var addFieldTag = (function (doc, target, field, label){
              var name = this.createFieldString(doc, field);
              if(!!name){
                target.append($('<li class="ndlsearch-doc-'+field+'">'+ label + '：' + name + '</li>'));
              }
            }).bind(this, doc, list);

            addFieldTag('responsibility_view', '著者');
            addFieldTag('publisher_view', '出版社');
            addFieldTag('materialType_view', '資料種別');

            var output = $(
                  ('<div class="item" id="%iss_id%"><h3 class="item-header clearfix"><a href="%seealso%" target="_blank">%title%</a><a id="bookmark-%iss_id%" href="#%iss_id%" class="bookmark-link">[bookmark]</a></h3></div>')
                    .replace(/%iss_id%/g, doc.id)
                    .replace(/%title%/g, doc.title_view)
                    .replace(/%seealso%/g, self.createNdlOpacUri(doc))
            );
            output.append(list);

            //output.html(this.highlightAnyQuery(output.html()));
            output.append(this.detail_link_template(doc));

            return output;
        },
        template_blank: function (){
           return $("<div>")
                    .addClass("well")
                    .append("<p>一致する資料は見つかりませんでした。</p>")
                    .append($("<ul><li>検索キーワードに誤字が無いか確認してください。</li><li>検索キーワードをスペース区切りで入力してみてください。<ul><li>(例: 「歴史 オリンピック」)</li></ul></li><li>類似語など検索キーワードを別の言葉に置き換えてみてください。</li></ul>"));
        },
        detail_link_template: function (doc){
          var self = this;
          var expanded = false;
          var detail   = null;
          return $('<p class="toggle-detail"><a>詳細を表示</a></p>').on('click', function (){
                   if (expanded){
                     detail.slideToggle();
                     $(this).html("<a>詳細を表示</a>");
                   }else{
                     if (!detail){
                       detail = $(self.detail_template(doc)).hide();
                       $(this).after(detail)
                     }
                     detail.slideToggle();
                     $(this).html("<a>折りたたむ</a>");
                   }
                   expanded = !expanded;
                 });
        },
        createNdlOpacUri: function (doc){
          url   = "https://ndlopac.ndl.go.jp/F/?func=find-c&ccl_term=001+%3D+";
          bib_id = doc.id.split("-")[1].replace(/^I/,"");
          return url+bib_id;
        },
        /* 書誌詳細をレンダリングするためのテンプレート */
        detail_template: function (doc){
            var repository_names = {
              "R100000002": "国立国会図書館蔵書"
            };

            /* 書誌詳細を格納する要素を生成 */
            var space  = $("<div>")
                           .addClass("item-detail")
                           .attr("id", 'detail-'+doc.iss_id)

            /* フィールドを追加するメソッドをtable要素に実装 */
            var table = $("<table></table>")
            table.create_tr = function (label, value){
              if (!!value){
                $(this).append($("<tr><th>"+label+":</th><td>"+value+"</td></td></tr>"));
              }

              return this;
            };

            // 書誌詳細のフィールドを追加する
            // インデックスのスキーマを変更した際には更新する必要がある
            table
              .create_tr("掲載誌名", doc.zskPublicationName_view)
              .create_tr("掲載巻", doc.zskPublicationVolume_view)
              .create_tr("掲載号", doc.zskPublicationNumber_view)
              .create_tr("掲載通号", doc.zskIssue_view)
              .create_tr("掲載ページ", doc.zskPageRange_view)
              .create_tr("出版年", doc.issued_view)
              .create_tr("シリーズ名", doc.seriesTitle_view)
              .create_tr("分類", this.createFieldString(doc, "subject_view"))
              .create_tr("NDC", doc.ndc9_view)
              .create_tr("ISBN", doc.isbn_view)
              .create_tr("価格", doc.price_view)
              .create_tr("注記", doc.description_view)
              .create_tr("NDL-OPAC", '<a class="opac-link" href="%seealso%" target="_blank">NDL-OPACへのリンク</a>'.replace(/%seealso%/g, this.createNdlOpacUri(doc)))
              .appendTo(space);

            /* キーワードのハイライト処理 */
            //space.html(this.highlightAnyQuery(space.html()));

            return space;
        },
        facetLinks: function (facet_field, facet_values) {
          var links = [];
          if (facet_values) {
            for (var i = 0, l = facet_values.length; i < l; i++) {
              if (facet_values[i] !== undefined) {
                  links.push(
                      $('<a href="#"></a>')
                      .text(facet_values[i])
                      .click(this.facetHandler(facet_field, facet_values[i]))
                      );
              }
              else {
                  links.push('no items found in current selection');
              }
            }
          }
          return links;
        },
        facetHandler: function (facet_field, facet_value) {
            var self = this;
            return function () {
                self.manager.store.remove('fq');
                self.manager.store.addByValue('fq', facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value));
                self.doRequest();
                return false;
            };
        },
        init: function () {
            var widget = this;
            $(document).on('click', 'a.more', function () {
                var $this = $(this),
                span = $this.parent().find('span');

                if (span.is(':visible')) {
                    span.hide();
                    $this.text('more');
                }
                else {
                    span.show();
                    $this.text('less');
                }

                return false;
            });

            /* 検索結果のリンクをクリックすると選択中の書誌を変更 */
            $(document)
              .on('click', ".bookmark-link", function () {
                var self = this;
                var iss_id = self.id.match(/bookmark-(.+)/)[1];
                widget.manager.bookmarks.addBookmark(iss_id);
                $(self).addClass("bookmark-link-selected");

                return false;
              })
        }
    });

})(jQuery);

}));
