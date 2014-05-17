(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/AbstractWidget', 'StateStore', 'jquery', 'bootstrap'], callback);
  }
  else {
    callback();
  }
}(function (AbstractWidget, StateStore, $){

  AjaxSolr.RecommenderWidget = AjaxSolr.AbstractWidget.extend(/** @lends AjaxSolr.RecommenderWidget **/{
    /**
     * @class ブックマークに登録された書誌に基づいて関連書誌を推薦する
     * @constructs AjaxSolr.RecommenderWidget
     * @extends {AjaxSolr.AbstractWidget}
     */
    init: function (){
      this.clear();
      this.manager.state_store.hook("recommendation", this.render.bind(this));

      this.manager.state_store.hook("bookmarks", this.calculateRecommendation.bind(this));
    },
    /**
     * 保存されている推薦結果を消去する
     * @return {object} 保存された推薦結果の情報(消去成功なら空オブジェクトが返ってくる) 
     **/ 
    clear: function (){
      this.manager.state_store.change("recommendation", {});
    },
    /**
     * 推薦を実行する
     **/
    calculateRecommendation: function (){
      var self = this,
          query= [],
          bookmarks = this.manager.state_store.state["bookmarks"],
          iss_ids = Object.keys(bookmarks),
          start   = 1;


      if(iss_ids.length >= start){ 
        for(var i=0,l=iss_ids.length;i<l;i++){
          query.push("id:"+iss_ids[i]);
        }
        query = query.join(" OR ");
        self.executeRequest(self.build_query({q:query}));
      }else{
        self.clear();
      }
    },
    build_query: function (query_obj){
      var string_obj = {},
          string     = [];

      string_obj.q = query_obj.q || "*:*";
      string_obj.rows = query_obj.rows || "10";

      for(key in string_obj){
        string.push(key+"="+string_obj[key]);
      }

      return string.join("&");
    },
    handleResponse: function (data){
      result    = data.response.docs; 
      //推薦結果を保存
      return this.manager.state_store.change("recommendation", result);

      console.log(data);
    },
    errorHandler: function (data){
      console.log(data);
    },
    executeRequest: function (string, handler, errorHandler){
      var self = this,
          options = {dataType: 'json'},
          url     = (this.recommenderUrl || this.manager.solrUrl), 
          servlet = "like";

      handler = handler || function (data) {
        self.handleResponse(data);
      };
      errorHandler = errorHandler || function (jqXHR, textStatus, errorThrown) {
        self.handleError(textStatus + ', ' + errorThrown);
      };

      options.url = url + servlet + '?' + string;

      jQuery.ajax(options).done(handler).fail(errorHandler);
    },
    /**
     * 推薦結果に表示する書誌のDOM要素を生成する
     * @param {object} doc
     * @return {object} 
     **/  
    render_doc: function (doc){
      var self   = this,
          widget = this,
          fields = ["title_view", "authors_view", "publishers_view"],
          bib    = [],
          content= $("<div class='recommendation-item-content'>"),
          expanded = false,
          detail;

      for (var i=0,l=fields.length;i<l;i++){
        if(!!doc[fields[i]]){
          bib.push(doc[fields[i]]);
        }
      }

      return content
               .append(
                 $("<p><strong>"+bib.join(". ")+"</strong><p>")
               )
               .append(
                 $("<p>")
                   .append(
                     $("<a href=''>詳細を表示</a>").on('click', function (e){
                       if (expanded){
                         detail.slideToggle();
                         $(e.target).text("詳細を表示");
                         expanded = false;
                       }else{
                         detail = $(self.detail_template(doc)).hide();
                         $(this).after(detail)
                         detail.slideToggle();
                         $(e.target).text("折りたたむ");
                         expanded = true;
                       }

                       return false;
                     })
                   )
                   .append(
                     $("<a href=''>ブックマーク</a>").on('click', function (e){
                       widget.manager.bookmarks.addBookmark(doc.id, doc);
                       return false;
                     })
                   )
               );
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
    detail_template: function (doc){
      var space  = $("<div>")
		       .addClass("item-detail")
		       .attr("id", 'detail-'+doc.id)

      var table = $("<table></table>")
      table.create_tr = function (label, value){
        if (!!value){
          $(this).append($("<tr><th>"+label+":</th><td>"+value+"</td></td></tr>"));
        }

        return this;
      };

      table
        .create_tr("著者", this.createFieldString(doc, "responsibility_view"))
        .create_tr("出版者", this.createFieldString(doc, "publisher_view"))
        .create_tr("分類", this.createFieldString(doc, "ndcLabel_view"))
        .create_tr("NDC", this.createFieldString(doc, "ndc9_view"))
        .create_tr("ISBN", this.createFieldString(doc, "isbn_view"))
        .create_tr("ISSN", this.createFieldString(doc, "issn_view"))
        .create_tr("価格", this.createFieldString(doc, "price_view"))
        .appendTo(space);

      return space;
    },
    render: function (event){
      var self = this,
          docs = this.manager.state_store.state.recommendation,
          idx  = 0,
          show_item = function (idx){
            var doc = docs[idx]; 
            $(".recommendation-item").empty().append(self.render_doc(doc));
            $(".recommendation-pager-count").html((idx+1)+"/"+docs.length);
          },
          prev_item = function (){
            if(idx>=1){
              idx = idx-1;
              show_item(idx);
            }

            return false;
          },
          next_item = function (){
            if(idx < docs.length-1){
              idx = idx+1;
              show_item(idx);
            }

            return false;
          };

      this.target.empty().hide();
      if (docs.length > 0 ){
	$(this.target).css("backgournd-color", "yellow");
	$(this.target).append($("<h2>レコメンド</h2>").addClass("mainlabel"));
	$(this.target).append(
			$("<p class='recommendation-pager'>")
			  .css("text-align", "center")
			  .append(
			    $("<a href=''>&lt;&lt;前 </a>").click(prev_item)
			  )
			  .append(
			    $("<span class='recommendation-pager-count'>")
			  )
			  .append(
			    $("<a href=''> 次&gt;&gt;</a>").click(next_item)
			  )
		       )
		       .append(
			$("<p class='recommendation-item'>") 
		      )
  ;
	show_item(idx);
	self.target.slideDown();
      }
    }
  });

}));

