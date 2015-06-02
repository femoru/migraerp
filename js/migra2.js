var nombre, modulo, divhtml, estilo;
var listaGraficos = {};
$(document).ready(function() {
	divhtml = $('#divhtml');
	$('#forma').on('change', extraerXML);
	$('#ghtml').on('click', extraerXML);

});
function extraerXML(){

	nombre = $('#forma').val();
	divhtml.empty();
	listaGraficos = {};
	estilo = "";

	$.get("xml/" + nombre +"_fmb.xml",function(xml){
		modulo = $.xml2json(xml).FormModule;
		migracion(modulo)
	}).fail(function(){
		alert('La forma ' + nombre + ' no existe');
		$('#forma').focus();
	});
}


function migracion(forma){

	extraerWindows(forma.Window);

	extraerCanvas(forma.Canvas);

	extraerBloques(forma.Block);
	if(forma.LOV && forma.RecordGroup){
		extraerLOVs(forma.LOV,forma.RecordGroup);
	}

	downloadDiv();

}

function extraerWindows(ventanas){

	if(!$.isArray(ventanas)){
		pintarVentana(ventanas);
	}else{
		$.each(ventanas,function(i,ventana){
			pintarVentana(ventana);
		});
	}
}

function pintarVentana(ventana){
	var modal = '';

	if(ventana.hasOwnProperty('WindowStyle') && ventana.WindowStyle === 'Diálogo'){
		modal = 'modal';
	}

	$( "<div/>",{
		id:"w"+ventana.Name,
		title:ventana.Title,
		class:"window "+ modal
	}).appendTo(divhtml);
}

function extraerCanvas(canvas){
	if(!$.isArray(canvas)){
		pintarLienzo(canvas);
	}else{
		$.each(canvas,function(i,lienzo){
			pintarLienzo(lienzo);
		});
	}	
}
function pintarLienzo(lienzo){
	if(lienzo.Name.startsWith('TOOLBAR')){
		return;
	}
	var vent = $("#w"+lienzo.WindowName);
	var dLienzo = $( "<form/>",{
		id:"c"+lienzo.Name,
		class:"lienzo form-inline",
		data:lienzo
	}).appendTo(vent);

	extraerGraphics(lienzo.Graphics,dLienzo);

}

function extraerGraphics(graficos,lienzo){
	if(!$.isArray(graficos)){
		pintarGrafico(graficos,lienzo);
	}else{
		$.each(graficos,function(i,grafico){
			pintarGrafico(grafico,lienzo);
		});
	}		
}

function pintarGrafico(grafico,lienzo){
	if(!grafico.hasOwnProperty('GraphicsType') || grafico.GraphicsType !== 'Texto'){
		var nomLienzo = $(lienzo).attr('id');
		
		if (listaGraficos.hasOwnProperty(nomLienzo)){
			listaGraficos[nomLienzo].push(grafico);
		}else{
			listaGraficos[nomLienzo]=[];
			listaGraficos[nomLienzo].push(grafico);
		}
	}	
	$( "<div/>",{
		id:"g"+grafico.Name,
		class:'grafico',
		text:grafico.GraphicsText,
		data:grafico
	}).appendTo(lienzo);
	
}


function extraerBloques(bloques){
	if(!$.isArray(bloques)){
		pintarBloque(bloques);
	}else{
		$.each(bloques,function(i,bloque){
			pintarBloque(bloque);
		});
	}
}

function pintarBloque(bloque){
	if(bloque.Name.startsWith('TOOLBAR')){
		return;
	}

	var dBlock = $( "<form/>",{
		id:"b"+bloque.Name,
		class:"bloque ",
		'data-source':bloque.hasOwnProperty('QueryDataSourceName')?bloque.QueryDataSourceName:undefined,
		'data-where':bloque.hasOwnProperty('WhereClause')?fixQuery(bloque.WhereClause):undefined,
		hidden:"hidden",
		data:bloque
	});
	if(bloque.hasOwnProperty('ScrollbarCanvasName')){
		dBlock.appendTo("#c"+bloque.ScrollbarCanvasName)
	}
	var canvas = extraerItems(bloque.Item,dBlock,bloque.Name);

	dBlock.appendTo("#c"+canvas);

}

function extraerItems(items,bloque,nomBloque){
	var canvas = '';
	if(!$.isArray(items)){
		canvas = pintarItem(items,bloque,nomBloque);
	}else{
		var myCanvas;
		$.each(items,function(i,item){
			myCanvas = pintarItem(item,bloque,nomBloque);
			canvas = myCanvas?myCanvas:canvas;
		});

	}
	return canvas;
}

function pintarItem(item,bloque,nomBloque){
	var tipo;
	if(item.ItemType === "Botón"){
		tipo = 'button';
	}else if(item.ItemType === "Elemento de Gráfico"){
		tipo = 'checkbox';
	}else if(item.ItemType === "Grupo de Botones de Radio"){
		tipo = 'radio';
	}else{
		tipo = 'text'; 
	}
	var container = bloque, hidden;

	if(item.hasOwnProperty('CanvasName') && item.CanvasName){
		container = "#c"+ item.CanvasName;
		container = definirContenedor(item,item.CanvasName);
	}else{
		hidden = "hidden";
	}
	var divContenedor = $('<div/>',{
		id:'d'+ nomBloque + "__" + item.Name,
		title: item.Hint,
		hidden: hidden,
		class: "form-group",
		data:item
	}).appendTo(container);

	if(tipo === 'radio'){
		$.each(item.RadioButton,function(i, radio){
			var checked;
			if(item.hasOwnProperty('InitializeValue') && radio.hasOwnProperty('RadioButtonValue')){
				if(radio.RadioButtonValue === item.InitializeValue){
					checked = true;
				}
			}
			$('<input/>',{
				id: nomBloque + "__" + radio.Name,
				name: nomBloque + "__" + item.Name,
				type: tipo,
				class: 'form-control',
				value: radio.hasOwnProperty('RadioButtonValue')?radio.RadioButtonValue:'null',
				checked: checked,
				data: radio,
				'data-block':nomBloque
			}).appendTo(divContenedor);

			var label = $('<label/>',{
				id:'l'+nomBloque + "__" + item.Name,
				text:radio.Label?radio.Label:radio.Name
			}).appendTo(divContenedor);
		})
	}else if(tipo === 'button'){
		var boton = $('<button/>',{
			id:nomBloque + "__" + item.Name,
			text: item.Label,
			class: 'btn btn-primary',
			'data-block':nomBloque
		}).appendTo(divContenedor);

	}else{
		var label = $('<label/>',{
			id:'l'+ nomBloque + "__" + item.Name,
			'for':nomBloque + "__" + item.Name,
			text:item.hasOwnProperty('Prompt')?fixChain(item.Prompt):item.Name
		}).appendTo(divContenedor);

		var input = $('<input/>',{
			id: nomBloque + "__" + item.Name,
			name: nomBloque + "__" + item.Name,
			type: tipo,
			class: ['form-control' , item.DataType?item.DataType:''].join(' '),
			'data-mask':item.hasOwnProperty('FormatMask')?item.FormatMask:undefined,
			maxlength:item.hasOwnProperty('MaximumLength')?item.MaximumLength:undefined,
			placeholder:item.hasOwnProperty('Prompt')?fixChain(item.Prompt):undefined,
			readonly:item.UpdateAllowed === "false",
			'data-block':nomBloque,
			'data-lov':item.hasOwnProperty('LovName')?item.LovName:undefined
		}).appendTo(divContenedor);

		estilo += "#" + nomBloque + "__" + item.Name + "{" +
			"width:" + item.Width + "px;" +
		"}";
	}
	/*
	if(item.hasOwnProperty('YPosition') && item.hasOwnProperty('XPosition') ){
		estilo += "#d" + nomBloque + "__" + item.Name + "{" +
		"top:"+ item.YPosition + "px;" +
		"left:"+ item.XPosition + "px;" +
		"position:absolute" +
		"}";
	}
	*/
	



	return item.CanvasName;
}

function definirContenedor(item,canvasName){
	var pItem = {
		x:parseInt(item.XPosition),
		y:parseInt(item.YPosition)
	};
	var pGrafico = {};
	var container = "c" + canvasName;
	var listado = listaGraficos[container];
	$.each(listado,function(i,grafico){

		pGrafico = {
			x:parseInt(grafico.XPosition),
			y:parseInt(grafico.YPosition),
			w:parseInt(grafico.Width),
			h:parseInt(grafico.Height)
		}

		if(pItem.x > pGrafico.x && pItem.x < pGrafico.w + pGrafico.x){
			if(pItem.y > pGrafico.y && pItem.y < pGrafico.h + pGrafico.y){
				container = "g"+grafico.Name;
				item.YPosition = pItem.y - pGrafico.y;
				$('#'+container).addClass('bloque');
				/*
				estilo += "#g" + grafico.Name + "{" +
					"height:" + (parseInt(grafico.Height)+ 100) + "px;" +
				"}";
				*/
			}
		}
	});

	return "#" + container;
}

function fixChain(cadena){
	cadena = cadena.replace('&#10;',' ','ig')
	return cadena;
}
function fixQuery(whereClause){
	var cadena = fixChain(whereClause);
	return cambiarParametros(cadena);
}
function cambiarParametros(query){
	if(query.indexOf(':') > 0){
		var posI = query.indexOf(':');
		var posF;
		var posFEsp = query.substring(posI).indexOf(' ') + posI
		var posFComa = query.substring(posI).indexOf(',') + posI
		var posFPare = query.substring(posI).indexOf(')') + posI
		if(posFComa > posI && posFComa < posFEsp){
			posF = posFComa
		}else if(posFPare > posI && posFPare < posF ){
			posF = posFPare;
		}else{
			posF = posFEsp;
		}
		if(posF < posI){
			posF = query.length;
		}
		var remp = query.substring(posI,posF);
		query = query.replace(remp,'?','ig');
		return cambiarParametros(query);
	}else{
		return query;
	}
}

function extraerLOVs(lovs,recordGroups){
	if(!$.isArray(lovs)){
		pintarLOV(lovs,recordGroups);
	}else{
		$.each(lovs,function(i,lov){
			pintarLOV(lov,recordGroups);
		});
	}
}
function pintarLOV(lov,recordGroups){
	var nlov = $('<div/>',{
		id:'lov'+lov.Name,
		'data-name':lov.Name,
		'data-group':lov.hasOwnProperty('RecordGroupName')?lov.RecordGroupName:undefined,
		class:'lov modal',
		data:lov
	}).appendTo(divhtml);
	var diag = $('<div/>',{class:'modal-dialog'}).appendTo(nlov);
	var cont = $('<div/>',{class:'modal-content'}).appendTo(diag);
	var head = $('<div/>',{class:'modal-header'}).appendTo(cont).html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">×</span></button>');
	var body = $('<div/>',{class:'modal-body'}).appendTo(cont);

	$('<h3/>',{
		text:lov.hasOwnProperty('Title')?lov.Title:["Lista de",lov.Name].join(' '),
		class:"modal-title"
	}).appendTo(head);


	$.each(recordGroups,function(i,group){
		if(group.Name === lov.RecordGroupName){
			var tab = $('<table/>',{
				id:'tl'+lov.Name,
				'data-url':'getSelect',
				//'data-query-params':JSON.stringify({params:'01'}),
				'data-toggle':'table',
				'data-query':fixQuery(group.RecordGroupQuery)
			}).appendTo(body);
			var th = $('<thead/>').appendTo(tab);
			var tr = $('<tr/>').appendTo(th);
			if($.isArray(lov.LOVColumnMapping)){
				$.each(lov.LOVColumnMapping,function(i, column){
					$('<th/>',{
						'data-field':column.Name,
						text:column.Title
					}).appendTo(tr);
				});
			}else{
				$('<th/>',{
					'data-field':lov.LOVColumnMapping.Name,
					text:lov.LOVColumnMapping.Title
				}).appendTo(tr);
			}
		}
	});
}

function downloadDiv() {

	var contenido = '<%@page contentType="text/html" pageEncoding="UTF-8"%>' +
	'<% '+
	'	if (null == session.getAttribute("usuario")) {'+
	'		response.sendRedirect("index.html"); session.invalidate(); '+
	'    }'+
	' %>'+
	'<!DOCTYPE html><html><head>'+
	'<meta charset="UTF-8"/> '+
	'<link rel="stylesheet" type="text/css" href="css/'+ nombre.toUpperCase() +'.css"/>' +
	'</head><body>' +
	$("#divhtml").html() + '</body></html>';


	$("#desHtml").attr({
		download:nombre.toUpperCase()+".jsp",
		href:'data:text/jsp;charset=utf-8,' + encodeURIComponent(contenido)
	});
	
	$("#desCSS").attr({
		download:nombre.toUpperCase()+".css",
		href:'data:text/css;charset=utf-8,' + encodeURIComponent(estilo)
	});

}