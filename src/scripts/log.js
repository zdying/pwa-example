this.log = {
    info: function(){
        console.log('%c[info] %c' + ([].join.call(arguments)), 'color: #2E90D8', '')
    },

    warn: function(){
        console.log('%c[warn] %c' + ([].join.call(arguments)), 'color: #FDCB4F', '')
    },

    error: function(){
        console.log('%c[error] %c' + ([].join.call(arguments)), 'color: #DC564D', '')
    },

    access: function(method, url){
        console.log('%c[access] %c' + method + '%c ' + url, 'color: #009688', 'color: #888' , '')
    }
}