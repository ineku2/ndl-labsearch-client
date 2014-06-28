(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractManager', 'StateStore'], callback);
  }
  else {
    callback();
  }
}(function () {

/**
 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
 * @class Manager
 * @augments AjaxSolr.AbstractManager
 */
AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
  /** @lends AjaxSolr.Manager.prototype */
  {

  /** 状態やブックマーク情報を保存するためのStateStoreインスタンスを設定する **/
  setStateStore: function (){
    this.state_store = new AjaxSolr.StateStore();
    this.state_store.manager = this;

    return this.state_store;
  },

  state_store:null,

  setVariantField: function (field_name, expanded_query){
    if((typeof field_name != 'string') || (typeof expanded_query != 'string')){
      throw new Error('field_name and expanded_query is needed');
    }

    if(!this.variant_fields){
      this.variant_fields = [];
    }

    this.variant_fields.push([field_name, expanded_query]);
    return this.variant_fields;
  },
  expand_query: function (string){
    var field_exp, query_template, expanded = string, variant_fields = this.variant_fields; 

    if (variant_fields && variant_fields.length > 0){
      for(var i=0, l=variant_fields.length;i<l;i++){
	field_exp = new RegExp(variant_fields[i][0]+'%3A((?:[^\\s&]|(?:AND)|(?:OR))+)', 'g');
	query_template = variant_fields[i][1].replace(/%VALUE%/g, "$1");
	expanded = expanded.replace(field_exp, query_template);
      }
    }

    return expanded;
  },
  executeRequest: function (servlet, string, handler, errorHandler) {
    var self = this,
        options = {dataType: 'jsonp'};
    string = self.expand_query(string || this.store.string());
    handler = handler || function (data) {
      self.handleResponse(data);
    };
    errorHandler = errorHandler || function (jqXHR, textStatus, errorThrown) {
      self.handleError(textStatus + ', ' + errorThrown);
    };
    if (this.proxyUrl) {
      options.url = this.proxyUrl;
      options.data = {query: string};
      options.type = 'POST';
    }
    else {
      options.url = this.solrUrl + servlet + '?' + string + '&wt=json&json.wrf=?';
      options.crossDomain = true;
    }

    if (!!self.store && !!self.store.save){
      self.store.save(); 
    }

    return jQuery.ajax(options).done(handler).fail(errorHandler);
  }
});

}));
