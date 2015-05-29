(function( $ ) {
 
    $.fn.lovform = function() {
 
        this.filter( "input" ).each(function() {
            var input = $( this );
            input.css('background-color','blue');
            console.log(input);
        });
 
        return this;
 
    };
 
}( jQuery ));