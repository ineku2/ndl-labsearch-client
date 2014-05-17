(function (callback){
  if (typeof define === 'function' && define.amd){
    define(["core/AbstractWidget", "jquery"], callback);
  } else {
    callback();
  }
}(function (){

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  field_translation: [],
  transFieldName: function (q) {
    var field_name = q;
    var patterns = this.field_translation;

    for (var i = 0, l = patterns.length; i < l; i++){ 
      field_name = field_name.replace(patterns[i][0], patterns[i][1]).replace(/(^<)|(>$)/g,"");
    }
    return field_name;
  },
  afterRequest: function () {
    var self = this;
    var links = [];

    var q = this.manager.store.get('q').val();
    if (q != '*:*') {
      links.push($('<a href="#"></a>').html('<span class="glyphicon glyphicon-remove"></span>' + self.transFieldName(q)).click(function () {
        self.manager.store.get('q').val('*:*');
        self.doRequest();
        return false;
      }));
    }

    var fq = this.manager.store.values('fq');
    for (var i = 0, l = fq.length; i < l; i++) {
      links.push($('<a href="#"></a>').html('<span class="glyphicon glyphicon-remove"></span>' + self.transFieldName(fq[i])).click(self.removeFacet(fq[i])));
    }

    if (links.length > 1) {
      links.unshift($('<a href="#"></a>').text('すべて解除').click(function () {
        self.manager.store.get('q').val('*:*');
        self.manager.store.remove('fq');
        self.doRequest();
        return false;
      }));
    }

    if (links.length) {
      var $target = $(this.target);
      $target.empty();
      for (var i = 0, l = links.length; i < l; i++) {
        $target.append($('<li></li>').append(links[i]));
      }
    }else {
      var $target = $(this.target);
      $target.empty();
    }
  },
  removeFacet: function (facet) {
    var self = this;
    return function () {
      if (self.manager.store.removeByValue('fq', facet)) {
        self.doRequest();
      }
      return false;
    };
  }
});

}));
