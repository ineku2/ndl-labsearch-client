/**
 * Widget for any search form 
 *
 * @class AnySearchWidget
 * @augments AjaxSolr.AbstractTextWidget
 */
(function ($) {

AjaxSolr.AnySearchWidget = AjaxSolr.AbstractTextWidget.extend({
  init: function () {
    var self = this;
    $(this.target).find('input').bind('keydown', function(e) {
      if (e.which == 13) {
        var value = $(this).val();

        var query_list = [];
        for (var i = 0; i < self.fields.length; i++) {
          var field = self.fields[i];
          query_list.push(field + ':' + value);
        }
        var query = query_list.join(" OR ")
        if (value && self.set(query)) {
          self.doRequest();
        }
      }
    });
  }
//  ,

//  afterRequest: function () {
//    $(this.target).find('input').val('');
//  }
});

})(jQuery);
