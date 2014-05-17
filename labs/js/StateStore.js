(function (callback){
  if (typeof define === 'function' && define.amd){
    define(['core/Core', 'jquery', 'store'], callback);
  }
  else {
    callback(AjaxSolr.Core, jQuery, store);
  }
}(function (core, jQuery, store){

(function ($) {
  AjaxSolr.StateStore = AjaxSolr.Class.extend(/** @lends AjaxSolr.StateStore **/{
    /**
    * @classdesc StateStoreは、ブックマーク情報や推薦結果の情報など、アプリケーションの状態を保存する。
    * @constructs AjaxSolr.StateStore
    * @requires AjaxSolr.Core
    * @requires Store.js
    * @requires jQuery
    **/
    constructor: function () {
      this.state = store.get('nlp-state') || {};
      this.hooks = {};
    },

    /**
     * StateStoreに保存されているデータを変更する。
     * 変更する項目に対してフックが登録されている場合には、フック関数を実行する。
     *
     * @param {string} attr データを変更する項目の名前 
     * @param {*} value 項目に登録する値
     * @return {*} 変更後の値
     **/
    change: function (attr, value){
      this.state[attr] = value;
      this.save();

      $(this.state).trigger('change_'+attr);

      return this.state[attr];
    },

    /**
    * StateStoreに登録されているデータをStore.js経由でWebStrageに保存する。
    * @return {boolearn} 保存に成功すると true を返す
    **/
    save: function (){
      store.set('nlp-state', this.state);
      return true;
    },

    /**
    * StateStoreに登録されているデータをすべて消去する。
    * @return {boolearn} 消去に成功すると true を返す
    **/
    clear: function (){
      for (attr in this.state){
        this.change(attr, null)
      }
      store.clear();
    },

    /**
    * 指定した項目に関数をフックする
    * @param {string} attr 関数をフックする項目名
    * @param {function} callback フックする関数
    * @return {boolearn} フックに成功すると true を返す
    **/
    hook: function (attr, callback) {
      if (!this.hooks[attr]){
        this.hooks[attr] = [];
      }
      this.hooks[attr].push(callback);
      $(this.state).on('change_'+attr, this.state[attr], callback);
      return true;
    }
    
  });
})(jQuery);

}));
