var nombre, modulo, divhtml, estilo, proced = {}, contenido;
var listaGraficos = {};
$(document).ready(function() {
	divhtml = $('#divhtml');
	$('#forma').on('change', extraerXML);
	
	$('#ghtml').on('click', extraerXML);
	$("#gpkg").on('click', generarPaquetes);
	$("#ggjs").on('click',generarTriggers);
	$("#genc").on('click',function(){
		$("#divhtml").empty();
		encriptarSelect();
	});

});
function encriptarSelect(){
	var entrada = $('<textarea/>',{
		cols:100,
		rows:20
	}).appendTo("#divhtml")

	var salida = $('<textarea/>',{
		cols:100,
		rows:20
	}).appendTo("#divhtml");

	$(entrada).on('keyup',function(){
		var texto = $(entrada).val();
		$(salida).val(encriptar(texto));
	});
}
function encriptar(mCadena,mEncripta){
	mCadena = mCadena.toUpperCase();
	var mCad1 = " !#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_{|}~ÀÈIÒÙÑ¿";
	var mCad2 = "¿ÑÚÓÍÉÁ~}|{_^]\\[ZYXWVUTSRQPONMLKJIHGFEDCBA@?>=<;:9876543210/.-,+*)(&%$#! ";
	var mResultado = "";
	var mLong = mCadena.length, mPos;
	for (var i = 0; i < mLong; i++) {
		if(mEncripta){
			mPos = mCad1.indexOf(mCadena[i]);
			mResultado +=  mCad2[mPos];
		}else{
			mPos = mCad2.indexOf(mCadena.charAt(i));
			mResultado +=  mCad1[mPos];
		}
	}
	return mResultado;

}

function generarTriggers(){
	if(modulo){
		divhtml.empty();
		extraerTriggers(modulo);
	}else{
		alert('No se ha cargado ninguna forma');
	}
}

function generarPaquetes(){
	if(modulo){
		divhtml.empty();
		extraerUnidades(modulo);
	}else{
		alert('No se ha cargado ninguna forma');
	}
}
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
	var dLienzo = $( "<div/>",{
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

		var mask = undefined;
		if(item.hasOwnProperty('FormatMask')){
			mask = item.FormatMask;
			mask = mask.replace('G','.','ig');
			mask = mask.replace('D',',','ig');
		}

		var input = $('<input/>',{
			id: nomBloque + "__" + item.Name,
			name: nomBloque + "__" + item.Name,
			type: tipo,
			class: ['form-control' , item.DataType?item.DataType:''].join(' '),
			'data-mask':mask,
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

function fixChain(cadena,rplc){
	if(!rplc){
		rplc = ' ';
	}
	cadena = cadena.replace('&#10;',rplc,'ig')
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

	contenido = '<%@page contentType="text/html" pageEncoding="UTF-8"%>' +
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

	contenido = contenido.replace('><','>\n<','ig');

	var jsp = new Blob([contenido],{type:'txt/jsp;charset=UTF-8'});

	$("#desHtml").attr({
		download:nombre.toUpperCase()+".jsp",
		//href:'data:text/jsp;charset=utf-8,' + encodeURIComponent(contenido) //encodeURIComponent
		href: window.URL.createObjectURL(jsp)
	});
	
	estilo = estilo.replace('}#','}\n#','ig');
	estilo = estilo.replace('{w','{\n\tw','ig');
	estilo = estilo.replace(';}',';\n}','ig');
	
	var css = new Blob([estilo],{type:'txt/css;charset=UTF-8'});	

	$("#desCSS").attr({
		download:nombre.toUpperCase()+".css",
		href:window.URL.createObjectURL(css)
	});

}

/**---------------------------------------------------------------
 * Arranque con la logica XD
 *---------------------------------------------------------------
**/
function extraerUnidades(json){
	var texto = "";
	var jst = "";
	$.each(json.ProgramUnit,function(i, unidad){
		if(unidad){
			var nombre = unidad.Name;
			var procedimiento = fixChain(unidad.ProgramUnitText,'\n');

			proced[nombre] = procedimiento;

			texto += "----------------------------\n" + procedimiento + "\n\n";
			jst += "----------------------------\n" + traducirProc(procedimiento) + "\n\n";

		}
	});

	var txt1 = $('<textarea/>',{
		text:texto,
		cols:100,
		rows:20
	}).appendTo("#divhtml");
	
	var txt2 = $('<textarea/>',{
		text:jst,
		cols:100,
		rows:20
	}).appendTo("#divhtml");

	txt1.on('scroll',function(){
		txt2.scrollTop(txt1.scrollTop());
	});

	txt2.on('scroll',function(){
		txt1.scrollTop(txt2.scrollTop());
	});
}

function traducirProc(proc){
	var traducido =""; 
	proc = proc.replace('PROCEDURE','function');
	proc = proc.replace('IS','(/*');
		proc = proc.replace('BEGIN','*/){');
		proc = proc.replace("null;","return 0;")
		proc = proc.replace("END;","};")
		proc = proc.replace('.','__','ig');
		proc = proc.replace("--","//",'ig')
	//proc = reemplazarGoItem(proc);
	traducido = proc;

	return traducido;
}

function extraerTriggers(forma){
	var triggers = [], texto = "";
	
	var txt1 = $('<textarea/>',{
		width:'94%',
		cols: 100,
		rows: 20
	});

	var btn1 = $('<button/>',{
		text:'Bloques'
	}).appendTo(divhtml).on('click',function(){
		texto = "";
		triggers = [];
		$.each(forma.Block,function(i,bloque){
			if(bloque.hasOwnProperty('Trigger') && !bloque.Name.startsWith('TOOLBAR')){
				texto += bloque.Name;
				texto += leerTrigger(bloque.Trigger);
				//texto += leerTrigger(bloque.Trigger,texto);
			}
		});
		txt1.val(texto);
	});

	$('<button/>',{
		text:'Items'
	}).appendTo(divhtml).on('click',function(){
		alert('XD aun no lo implemento!!!')
	});
	txt1.appendTo(divhtml)
	btn1.click();

}

function leerTrigger(trigger){
	var tx = "";
	if(!$.isArray(trigger)){
		tx += "\n-- " + trigger.Name; 
		tx += "\n\t" + fixChain(trigger.TriggerText,'\n\t');
	}else{
		$.each(trigger,function(i, trig){
			tx += "\n-- " + trig.Name;
			tx += "\n\t" + fixChain(trig.TriggerText,'\n\t');
		});
	}
	return tx;
}