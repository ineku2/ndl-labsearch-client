var require = {
    baseUrl: 'labs/js/lib/',
    paths: {
        "bootstrap": "bootstrap.min",
        "jquery"   : "jquery.min",
        "jquery-ui": "jquery-ui.min",
        "ajax-solr": "../ajax-solr",
        "managers" : "../managers",
        "widgets"  : "../widgets",
        "core"     : "../ajax-solr/core",
        "ndlsearch": "../ndlsearch",
        "settings" : "../settings",
        "StateStore": "../StateStore",
        "history": "jquery.history",
        "store": "store.min",
        "ParameterHistoryStore": "../ajax-solr/widgets/ParameterHistoryStore",
	"mocha"    : "../../../test/lib/mocha",
	"chai"     : "../../../test/lib/chai"
    },
    shim: {
        "jquery": {
            exports: 'jQuery'
        },
        "jquery-ui": {
            exports: "$",
            deps: ['jquery']
        },
        'bootstrap': ['jquery'],
        'history': {
            exports: 'History',
            deps: ['jquery']
         },
	'mocha': {
	    exports: 'mocha'
	},
	'chai': {
	    exports: 'chai'
	}
    }
};

