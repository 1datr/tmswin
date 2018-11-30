/*
 'HTML_body'=>$_HTML,
 'HTML_header'=>$opts['HTML_header'],
 'HTML_footer'=>$opts['HTML_footer'],
 'HTML_before_header'=>$opts['HTML_before_header'],
 'HTML_after_footer'=>$opts['HTML_after_footer'],  
 'JS'=>array_keys($js),
 'CSS'=>array_keys($css),
 'JS_INLINE'=>$_module_base_html->_INLINE_SCRIPT,
 'TITLE'=>$_module_base_html->_HEADINFO['title'],
 'win_id'=>$opts['win_id'],
*/(function($){
	/*Array.prototype.in_array = function(p_val) {
		for(var i = 0, l = this.length; i < l; i++)	{
			if(this[i] == p_val) {
				return true;
			}
		}
		return false;
	}*/
	
    var defaults = {};
    $.fn.TMS_Win_Stack = new Array();
    
   // this.load();
    
    function TMSWin( element, options )
    {
    	this.options = options;
    	this.load();
    }
    
    
    TMSWin.prototype = {
            /* LOAD CUSTOM MULTISELECT DOM/ACTIONS */
            load: function() 
            {
            	var a_instance = this;
            	
            	this.ajax(this.options.url,this.options.post_data,function(windata)
            	{
            		// when get result
            		a_instance.build_win(windata);
            	});
            },
            ajax : function(theurl,pd,onsuccess) // подгрузить данные по окну
            {
            	var _win = this;
            	$(document).trigger('tmswin.ajax.start');		
            	$.post(theurl,pd,function(windata)
            	{
            		_win.windata = windata;
            		$(document).trigger('tmswin.ajax.success');
            		onsuccess(windata);
            	},'json').fail(function(xhr, status, error) 
            	{
            		$(document).trigger('tmswin.ajax.error');
            		if($('#errbox').length>0)
            		{
            			$('#errbox').html(xhr.responseText);
            		}
            		else
            			console.log(xhr.responseText);
            	});
            },
		    update: function() // обновить окно
		    {
		    	var w_obj=this;
		    	this.ajax(this.options.url,this.options.post_data,function(windata)
		    	    {
		    	    	// when get result
		    			w_obj.update_win_by_data(windata);		    	
		    	    }
		    	);
		    },
		    _destroy : function() // удалить окно
		    {    	
		    	$(this.instance).remove();    	
		    },
		    get_win_html : function(windata,full) // html-код окна
		    {
		    	if(full===undefined)
		    		full=true;
		    	var style_str="";
				if(typeof windata.width_max!="undefined")
				{
					style_str="max-width:"+windata.width_max;
				}
				//.css('z-index'
				var str_body_start="<div class=\"modal-body\">";
				if(typeof windata.min_height!="undefined")
				{
					style_str=style_str+";min-height:"+windata.min_height;
				
				}
		    	var win_code =
					"<div class=\"modal fade\"  tabindex=\"-1\" id=\""+windata.win_id+"\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">";
		    	var win_code_inner = 
					  "<div class=\"modal-dialog\" style=\""+style_str+"\" role=\"document\">"+
					    "<div class=\"modal-content\">"+
					    (windata.HTML_before_header)+
					      "<div class=\"modal-header\">"+
					       (windata.HTML_header)+
					      "</div>"+
					      str_body_start+
					      (windata.HTML_body)+
					      "</div>"+
					      "<div class=\"modal-footer\">"+
					      (windata.HTML_footer)+
					      "</div>"+
					    "</div>"+
					    (windata.HTML_after_footer)+
					    "</div>";
		    	if(!full)
		    		return win_code_inner;
		    	win_code = win_code+win_code_inner+"</div>";
		    	return win_code;
		    }, 
		    build_win : function(windata) // создать окно для одного экземпляра 
		    {
		    	var win_obj=this;    	
		    	this.instance = $(this.get_win_html(windata));
		    	
		    	$.fn.TMS_Win_Stack.push(this);// добавляем в стек
		    	this.STACK_INDEX = $.fn.TMS_Win_Stack.length-1;
		    	
		    	$('body').prepend(this.instance);
		    	this._window = $(this.instance).modal(this.opts);
		    	//кнопка апдейта окна
		    	$(this._window).on('click','button.btn-update',function(e){
		    		win_obj.update();
		    	});
		    	
		    	
		    	$(this._window).on('hidden.bs.modal', function(){
		    		win_obj._destroy();
		    	});
		    	
		    	$(this._window).on('shown.bs.modal', function(){
		    		$(win_obj.instance).trigger('modal_load',{wid : windata.win_id});		    		
		    	});
		    	
		    	this.init_inner_refs();
		    	
		    	//$(this.instance).trigger('modal_load',{wid : windata.win_id})
		    },  
		    update_win_by_data(windata)
		    {
		    	var new_html = this.get_win_html(windata,false);
		    	this.instance.html(new_html);
		    	this.instance.attr('id',windata.win_id);
    			$(this.instance).trigger('modal_load',{wid : windata.win_id});
		    },
		    init_inner_refs : function()	// нициализация обработки внутренних сылок и форм
		    {
		    	var w_obj=this;
		    	$(this._window).on("click","a.innerlink", function(e, submit){
		    		e.preventDefault();		    		
		    		var the_url = $(e.currentTarget).attr('href');
		    		w_obj.options.url = the_url;
		    		w_obj.ajax(w_obj.options.url,w_obj.options.post_data,function(windata)
			    	    {
			    	    	// when get result
			    			w_obj.update_win_by_data(windata);
			    			$(win_obj.instance).trigger('modal_load',{wid : windata.win_id});
			    	    }
			    	);
		    		
		    	});
		    	// form submit handling
		    	$(this._window).on("submit","form.innerform", function(e, submit){
		    		e.preventDefault();
		    		var curr_modal=$(this).closest('.modal.fade.show');
		    		var win_id=$(curr_modal).attr('id');
		    		var the_url = $(e.currentTarget).attr('action');
		    		
		    		var method = $(e.currentTarget).attr('method');
		    		if(method=='undifined')
		    			method='GET';
		    		m_data=$(e.currentTarget).serialize();		    		
		    		
		    		w_obj.ajax(w_obj.options.url,m_data,function(windata)
			    	    {
			    	    	// when get result
			    			w_obj.update_win_by_data(windata);
			    			$(w_obj.instance).trigger('modal_load',{wid : windata.win_id});
			    	    }
			    	);
		    	});
		    },
		    close : function()
		    {
		    	$(this.instance).modal('hide');
		    },
		    _destroy : function() // удалить окно
		    {    	
		    	$(this.instance).remove();    
		    	delete $.fn.TMS_Win_Stack[this.STACK_INDEX];		
		    	
		    	var temp = [];
		    	//start = typeof start == 'undefined' ? 0 : start;
		    	//start = typeof start != 'number' ? 0 : start;
		    	var curr_idx=0;
		    	for(var i in $.fn.TMS_Win_Stack)
		    	{
		    		if(Object.prototype.toString.call($.fn.TMS_Win_Stack[i])!="[object Function]")
		    		{
		    			//var newidx = start++;
		    			temp[curr_idx] = $.fn.TMS_Win_Stack[i];
		    			temp[curr_idx].STACK_INDEX = curr_idx; 
		    			curr_idx++;
		    		}
		    	}
		    	$.fn.TMS_Win_Stack = temp;
		    },
    
    };


$.fn.TMSWin = function(element, options )
{
	 return this.each(function(){
		// if( !$.data( this, 'TMSWin' ) ) {
             $.data( this, 'TMSWin', new TMSWin( this, options ) );
      //   }
	 });
};

}(jQuery));

function modal_block(url,_post_data,_opts)
{
	if(_post_data===undefined) _post_data={};
	if(_opts===undefined) _opts={}
	$('body').TMSWin($('body'),{url:url,post_data:_post_data,opts:_opts});
}

function update_win(_wid)
{
	for(i=0;i<$.fn.TMS_Win_Stack.length;i++)
	{
		if($.fn.TMS_Win_Stack[i].windata.wid=_wid)
		{
			$.fn.TMS_Win_Stack[i].update();
		}
	}
}

function close_and_update(wid,page_url){
	$.fn.TMS_Win_Stack[$.fn.TMS_Win_Stack.length-1].close();
	for(i=0;i<$.fn.TMS_Win_Stack.length;i++)
	{
		if($.fn.TMS_Win_Stack[i].windata.wid=wid)
		{
			$.fn.TMS_Win_Stack[i].update();
		}
	}
}

jQuery.expr[':'].regex = function(elem, index, match) 
{
    var matchParams = match[3].split(','),
        validLabels = /^(data|css):/,
        attr = {
            method: matchParams[0].match(validLabels) ? 
                        matchParams[0].split(':')[0] : 'attr',
            property: matchParams.shift().replace(validLabels,'')
        },
        regexFlags = 'i',
        regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g,''), regexFlags);
    return regex.test(jQuery(elem)[attr.method](attr.property));
}

$(document).ready(function(){
	
	
	//$('body').on( "click", 'a:regex(href,^tmswin:)', function(e)
	$('body').on( "click", 'a[href^="tmswin:"]', function(e) 			
	{
		e.preventDefault(); //отменяем переход по ссылке
		var href = $(e.target).prop('href');
		var modal_url =	href.substring(7);
		//if(_post_data===undefined)
		var _post_data={};
		//if(_opts===undefined) 
		var _opts={};
		//console.log('clicked');
		$('body').TMSWin($('body'),{url:modal_url,post_data:_post_data,opts:_opts});
	//	return true;
	});
	

});
   
