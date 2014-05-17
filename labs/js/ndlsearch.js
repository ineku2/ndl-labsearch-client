//主要なライブラリやクラスを読み込む
define([
  "jquery",
  "jquery-ui",
  "history",
  "store",
  "bootstrap",
  "managers/Manager.jquery",
  "core/Parameter",
  "core/ParameterStore",
  "core/AbstractWidget",
  "core/AbstractTextWidget",
  "core/AbstractFacetWidget",
  "ajax-solr/widgets/ParameterHistoryStore",
  "ajax-solr/widgets/jquery/PagerWidget"
], function ($){
  var NdlSearch = {};
  return NdlSearch;
});
