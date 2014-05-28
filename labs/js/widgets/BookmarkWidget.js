(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/AbstractWidget', 'StateStore', 'jquery', 'bootstrap'], callback);
  }
  else {
    callback();
  }
}(function (AbstractWidget, StateStore, $){

  AjaxSolr.BookmarkWidget = AjaxSolr.AbstractWidget.extend(/** @lends BookmarkWidget **/{
     /**
     * @class 書誌をブックマークし、一覧を表示するWidget
     * @constructs BookmarkWidget
     * @extends {AjaxSolr.AbstractWidget}
     **/
    init: function (){
      this.manager.state_store.hook("bookmarks", this.show.bind(this));
      if(!this.manager.state_store.state["bookmarks"]){
        this.manager.state_store.change("bookmarks", {});
      }else{
        this.show();
      }
    },
    getBookmarks: function (){
      return this.manager.state_store.state["bookmarks"];
    },
    addBookmark: function (iss_id, doc){
      var list = this.getBookmarks();
      if(!list[iss_id]){
        list[iss_id] = (this.getRecord(iss_id) || doc);
        this.manager.state_store.change("bookmarks", list);
      }

      return list;
    },
    removeBookmark: function (iss_id){
      var list = this.getBookmarks();
      delete list[iss_id];
      this.manager.state_store.change("bookmarks", list);

      return list;
    },
    removeAll: function (){
      this.manager.state_store.change("bookmarks", {});
      return {};
    },
    getRecord: function (iss_id){
      var widget = this;
      var docs   = widget.manager.response.response.docs;
      var doc    = null;
      for(var i=0;i<docs.length;i++){
        if (docs[i].id == iss_id){
          doc   = docs[i];
          break;
        }
      }
      return doc;
    },
    show: function (){
      var widget = this;
      var list  = widget.getBookmarks();
      $(widget.target).empty();
      $(this.target).append(this.template(list));

      if(Object.keys(list).length > 0){
        $(this.target).append($("<p class='btn btn-link bookmark-list-export'>エクスポート</p>").click(function (){ this.exportBookmarks(); }.bind(this)));
        $(this.target).append($("<p class='btn btn-link bookmark-list-export'>全消去</p>").click(function (){ this.removeAll(); }.bind(this)));
      }

      return true;
    },
    template_remove_btn: function (iss_id){
      var self = this;

      return $("<a></a>")
        .addClass('glyphicon')
        .addClass('glyphicon-remove')
        .css("margin-right", "0.5em")
        .click(function (){
          self.removeBookmark(iss_id);
          self.show();
          return false;
        });
    },
    template_blank: function (){
      return $("<p>")
        .addClass("well")
        .html("<strong>Tips</strong>: 検索結果中のアイテムをブックマークに登録したい場合は、見出しの横にあるアイコン(<img src='./labs/images/bookmark_icon.png' alt='ブックマークアイコン' />)をクリックしてください。");
    },
    createFieldString: function (doc, field){
      var field_data, tag_name, attributes, value, name = [], item;
      field_data = doc[field];

      if(!field_data){
        return "";
      }

      if (AjaxSolr.isArray(field_data)){
        for(var i=0, j=field_data.length;i<j;i++){
          //JSONのパースをかけ、失敗したら文字列として扱う
          try {
            item = JSON.parse(field_data[i]);
          } catch(e) {
            item = field_data[i];
          }

          
          if (AjaxSolr.isString(item) ||  AjaxSolr.isNumber(item)){
            name.push(item);
          } else {
            //オブジェクトからフィールドの値を取り出す
            tag_name   = item[0];
            attributes = item[1];
            value      = item[2];
            name.push(value[2]);
          }
        }
        name = name.join("; ").replace(/\/\//g,"").replace(/@@/g, " ");
      } else {
        //JSONのパースをかけ、失敗したら文字列として扱う
        try {
          item = JSON.parse(field_data);
        } catch(e) {
          item = field_data;
        }

        
        if (AjaxSolr.isString(item) ||  AjaxSolr.isNumber(item)){
          name.push(item);
        } else {
          //オブジェクトからフィールドの値を取り出す
          tag_name   = item[0];
          attributes = item[1];
          value      = item[2];
          name.push(value[2]);
        }
      }

      return name;
    },
    createNdlOpacUri: function (doc){
      url   = "https://ndlopac.ndl.go.jp/F/?func=find-c&ccl_term=001+%3D+";
      bib_id = doc.id.split("-")[1].replace(/^I/,"");
      return url+bib_id;
    },
    template: function (list){ 
      var self=this,
          block, keys;
      
      block = $("<ul class='bookmark-list'>");
      keys  = [];

      if (Object.keys(list).length == 0){ 
        block.append(self.template_blank());
        return block;
      }

      for (key in list){
        keys.push(key);
      }
      keys = keys.sort();
 
      for (var i=0, l=keys.length;i<l;i++){
        var iss_id, doc, item;

        iss_id = keys[i];
        doc = list[iss_id];
        item = $("<li class='bookmark-list-item list-unstyled'>")
                 .append(self.template_remove_btn(iss_id))
                 .append("<a href='"+this.createNdlOpacUri(doc)+"' target='_blank'>"+doc.title_view+"</a>");
 
        block.append(item);
      }
      return block;
    },
    createModalWindow: function(body){
      $(".modal").remove();
      var self = this;

      var element = $("<div class='modal'>")
		    .append(
		      $("<div class='modal-dialog'>")
		      .append(
			$("<div class='modal-content'>")
                          .append(
                            $(('<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="myModalLabel">%title%</h4></div>').replace("%title%", "ブックマーク一覧"))
                          )
                          .append(
                            $("<div class='btn-group'>")
                              .append(
                                $("<a id='trigger-export-table' class='btn btn-sm btn-default'>表形式で表示</p>")
                              )
                              .append(
                                $("<a id='trigger-export-bibtex' class='btn btn-sm btn-default'>Bibtexで表示</p>")
                              )
                          )
                          .append(
                            $('<div class="modal-body" id="export-body">')
			      .append($(body))
                          )
                          .append( 
                            $("<div class='modal-footer'>")
		          )
		      )
		    );
      $("body").append(element);
      $('#trigger-export-table').on('click', self.renderExport.bind(self, $("#export-body"), "table"))
      $('#trigger-export-bibtex').on('click', self.renderExport.bind(self, $("#export-body"), "bibtex"))
      element.modal("show");
      return element;
    },
    exportBookmarks: function (type){
      var block = this.renderExport(null, type);
      var modal = this.createModalWindow(block);

      return modal;
    },
    renderExport: function (target, type){
      var block, keys, docs, list, render, iss_id, doc, item;

      switch(type) {
        case "bibtex": block = $("<pre class='bookmark-detail-list'>"); render = this.renderExportAsBibTeX.bind(this, block); break 
        case "table" : block = $("<div class='bookmark-detail-list'>"); render = this.renderExportAsTable.bind(this, block); break
        case "html"  : block = $("<div class='bookmark-detail-list well'>"); render = this.renderExportAsHTML.bind(this, block); break
        default: block = $("<div class='bookmark-detail-list'>"); render = this.renderExportAsTable.bind(this, block); break
      }
      
      keys  = [];
      list  = this.getBookmarks();
 
      for (key in list){
        keys.push(key);
      }
      keys = keys.sort();
      docs = [];
 
      for (var i=0, l=keys.length;i<l;i++){
        var iss_id = keys[i];
        docs.push(list[iss_id]);
      }

      if (!target){
        return render(docs);
      } else {
        return $(target).empty().append(render(docs));
      }
    },
    renderExportAsTable: function (target, docs){
      var table  = $("<table class='table table-bordered'>"),
          header = $("<tr><th>#</th><th>タイトル</th><th>著者</th><th>出版社</th><th>刊行年</th><th>ISBN</th>"),
          row;

      table.append(header);
      for(var i=0,l=docs.length;i<l;i++){
        row = $("<tr>")
                .append($("<td>").text(i+1))
                .append($("<td>").text(this.createFieldString(docs[i], "title_view")))
                .append($("<td>").text(this.createFieldString(docs[i], "responsibility_view")))
                .append($("<td>").text(this.createFieldString(docs[i], "publisher_view")))
                .append($("<td>").text(this.createFieldString(docs[i], "issuedYear_view")))
                .append($("<td>").text(this.createFieldString(docs[i], "isbn_view")))
        table.append(row);
      }

      return target.append(table);
    },
    renderExportAsHTML: function (target, docs){
      for(var i=0,l=docs.length;i<l;i++){
        target.append(this.templateHTML(docs[i]))
      }

      return target;
    },
    templateHTML: function (doc){
        var bib = $("<ul>")
        var fields = [ ["タイトル", "title_view"], ["著者", "authors_view"], ["出版者", "publishers_view"], ["ISBN", "isbn_view"] ];
        for(var j=0,k=fields.length;j<k;j++){
          var field = fields[j];
          if (typeof doc[field[1]] != "undefined"){
            bib.append($("<li>"+field[0]+":"+doc[field[1]]+"</li>"));
          }
        }
      return $("<div>")
               .append("<h3>"+doc.title_view+"</h3>")
               .append(
                 $("<div class='bookmark-detail-list-item'>")
                   .append(bib)
               );
    },
    renderExportAsBibTeX: function (target, docs){
      for(var i=0,l=docs.length;i<l;i++){
        target.append(this.templateBibTeX(docs[i]))
      }

      return target;
    },
    templateBibTeX: function (doc){
      var fields, material_types, indent, mediaType, label, first_line, line, last_line, body, bibtex, element;

      fields    = {
        title: 'title_view',
        author: 'author_view',
        publisher: 'publisher_view',
        year: 'issuedYear_view',
        iss_id: 'id'
      };

      material_types = {
        "図書": "book",
        "博士論文": "phdthesis",
        "規格・テクニカルリポート類": "techreport",
        "政府刊行物": "book"
      };

      indent    = "    "
      mediaType = (material_types[doc.material_type_view] || "misc");
      label     = (this.createFieldString(doc, fields.author) || "").replace(/\s.*/,"")+":"+doc[fields.year];

      first_line = "@"+mediaType+" {"+label+",";
      last_line  = "}\n\n"

      body = [];

      for (var field in fields){
        line = indent+field + " = " + '"'+(this.createFieldString(doc, fields[field]) || "")+'"';
	      body.push(line);
      }
      body = body.join(",\n");
   
      bibtex = [first_line, body, last_line].join("\n");

      return bibtex;
   }
  });

}));
