var jsonWork;
var zoom = 1.8;
var estilo = "";
var proced = new Object();


$( document ).ready(function() {
	logger("ready!");

	$("#desHtml").hide();
	$("#desCSS").hide();

	$("#zoom").val(zoom);
	$("#ghtml").on('click',function(){
		zoom = $("#zoom").val();
		$("#divhtml").empty();
		$.get("xml/" + $("#forma").val()+"_fmb.xml",function(xml){
			estilo = "";
			var json = $.xml2json(xml)
			jsonWork = json.FormModule;
			crearHTML(json.FormModule);
			$("#respjson").text(JSON.stringify(json));

		});
		$("#desHtml").show();
		$("#desCSS").show();

	});
	$("#gpkg").on('click',function(){
		$("#divhtml").empty();
		$.get("xml/" + $("#forma").val()+"_fmb.xml",function(xml){
			var json = $.xml2json(xml)
			jsonWork = json.FormModule;
			extraerUnidades(json.FormModule);
			$("#respjson").text(JSON.stringify(json));
		});
	});
	$("#genc").on('click',function(){
		$("#divhtml").empty();
		encriptarSelect();
	});
});

function logger(msj){
	console.log(msj);
}

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
function crearHTML(json){
	jsonWork = json;
	//Pinta los atributos Window
	if(!$.isArray(json.Window)){
		pintarVentana(json.Window);
	}else{
		$.each(json.Window,function(i,ventana){
			pintarVentana(ventana);
		});
	}

	//Pinta los atributos Canvas
	if(!$.isArray(json.Canvas)){
		pintarCanvas(json.Canvas);
	}else{
		$.each(json.Canvas,function(i,canvas){
			pintarCanvas(canvas);
		});
	}

	//Pinta los bloques 
	if(!$.isArray(json.Block)){
		pintarBloque(json.Block);
	}else{
		$.each(json.Block,function(i,bloque){
			pintarBloque(bloque);
		});
	}

	downloadDiv();
}

function pintarVentana(window){
	$( "<div/>",{
		id:"w"+window.Name,
		title:window.Title,
		class:"window"
	}).appendTo("#divhtml");

	estilo += "#w"+window.Name+"{"+
	"width:" + Math.round(zoom * window.Width) + "px;" + 
	"height:" + Math.round(zoom * window.Height) + "px;"+
	"}";
}

function pintarCanvas(canvas){

	if(canvas.Name ==='TOOLBAR' || canvas.Name ==='TOOLBAR1'|| canvas.Name ==='TOOLBAR2'){
		return;
	}

	$( "<div/>",{
		id:"c"+canvas.Name,
		title:canvas.Title,
		class:"canvas"
	}).appendTo("#w" + canvas.WindowName);

	estilo += "#c"+canvas.Name+"{"+
	"width:" + Math.round(zoom * canvas.Width) + "px;" + 
	"height:" + Math.round(zoom * canvas.Height) + "px;"+
	"position:relative;"+
	"}";

	leerGraphics(canvas.Graphics,canvas.Name);
}

function leerGraphics(Graphics,canvas){
	if(!Graphics){
		return;
	}
	var contenedora;
	//Pinta los atributos Graphics
	if(!$.isArray(Graphics)){
		contenedora = Graphics.Name;
		pintarGraphics(Graphics,canvas);

		$("#"+contenedora).removeClass("bloque").addClass("mayor");

		return;
	}else{
		$.each(Graphics,function(i, graphics){
			pintarGraphics(graphics,canvas);
		});
	}

	var contenedora;
	var areaMayor = 0, area = 0;

	$.each(Graphics,function(i, graphics){
		area = (graphics.Width - graphics.XPosition) *(graphics.Height - graphics.YPosition);
		if(area > areaMayor){
			areaMayor = area;
			contenedora = graphics.Name+"_"+canvas;
		}
	});
	
	$("#"+contenedora).removeClass("bloque").addClass("mayor");
	
}

function pintarGraphics(graphics,canvas){
	try{
		if(graphics.Width <= 0){
			return;
		}

		var grp = $( "<div/>",{
			id:graphics.Name+"_"+canvas,
			class:"graphics"
		}).appendTo("#c" + canvas);

		estilo += "#"+graphics.Name+"_"+canvas+"{"+
		"width:" + Math.round(zoom * graphics.Width) + "px;" + 
		"height:" + Math.round(zoom * graphics.Height) + "px;"+
		"position:absolute;"+
		"top:" + Math.round(zoom * graphics.YPosition) + "px;" + 
		"left:" + Math.round(zoom * graphics.XPosition) + "px;"+
		"}";

		if(graphics.GraphicsText){
			var texto = graphics.GraphicsText;
			texto = texto.replace("&#10;","");
			grp.text(texto);
		}

		if(graphics.CornerRadiusY > 0){
			grp.addClass('bloque');
		}
		
	}catch(e){
		logger("Error en graphics canvas:"+canvas);
	}
}

function pintarBloque(block){

//		if(block.RecordsDisplayCount !== "1"){

	crearSelect(block);
//		}else{
	if(!$.isArray(block.Item)){
		pintarItems(block.Item,block.Name);
	}else{
		for (var i = 0; i < block.Item.length; i++) {
			pintarItems(block.Item[i],block);
		};
	}
		//}
	}

	function pintarItems(item,block){
		try{

			var divCont =$('<div/>',{
				id:"d"+block.Name+"_"+item.Name
			});
			if(item.hasOwnProperty('Prompt')){
				try{
					var label = $("<label/>",{
						id:"l"+block.Name+"_"+item.Name,
						'for':block.Name+"_"+item.Name,
						text:item.Prompt.replace('&#10;','\n')
					}).appendTo(divCont);

					var lTop,lLeft;

				}catch(e){
					logger(block.Name+"_"+item.Name + " error en label")
					item.Prompt = "";
				}
			}else{
				item.Prompt = "";
			}

			var input = $('<input/>',{
				id:block.Name+"__"+item.Name,
				placeholder:item.Prompt.replace('&#10;',' '),
				title:item.Prompt.replace('&#10;',' '),
				required:item.Required?"True":"False",
				'data-mask':item.FormatMask
			}).appendTo(divCont);

			if(item.UpdateAllowed === "false"){
				$(input).attr("readonly","readonly")
			}

			if(!isNaN(item.Width) && !isNaN(item.Height) && !isNaN(item.YPosition) && !isNaN(item.XPosition)){
				var lTop = Math.round(zoom * item.YPosition);
				var lLeft = Math.round(zoom * item.XPosition);
				var contenedor, contName;
				var divGraph = $("#c"+item.CanvasName);

				try{
					salida:
					for(var i=0; i < jsonWork.Canvas.length;i++){
						if(jsonWork.Canvas[i].Graphics && jsonWork.Canvas[i].Name === item.CanvasName){ 
							if($.isArray(jsonWork.Canvas[i].Graphics)){
								for (var j = 0; j < jsonWork.Canvas[i].Graphics.length; j++) {
									contenedor = jsonWork.Canvas[i].Graphics[j];
									contName = contenedor.Name + "_" + jsonWork.Canvas[i].Name;
									if($('#'+contName).hasClass('bloque') ){
										var pos = {"top": Math.round(zoom*contenedor.YPosition), "left": Math.round(zoom*contenedor.XPosition),
										"width": Math.round(zoom*contenedor.Width), "height": Math.round(zoom*contenedor.Height)};
										var it = {"top": Math.round(zoom * item.YPosition),"left": Math.round(zoom * item.XPosition)};

										if((pos.left < it.left && it.left < pos.width + pos.left ) && (pos.top < it.top && it.top < pos.height + pos.top)){
											var msj = block.Name+"_"+item.Name + " dentro " + contenedor.Name ;
											lTop = it.top - pos.top;
											lLeft = it.left - pos.left
											divGraph = $('#'+contenedor.Name+"_"+item.CanvasName);
											break salida;
										}
								}//Cierre validacion si es bloque
							}//Cierre for interno
						}else{//Cierre Graphics es array
							divGraph = $('#'+jsonWork.Canvas[i].Graphics.Name+"_"+item.CanvasName);	
						}//Cierre si Graphics es objeto
					}//Cierre canvas.graphics esta definido y nombre canvas es el canvas del item
				}//Cierre for Externo
				divCont.appendTo(divGraph);
			}catch(e){
				logger("Error mirando contenedores" + JSON.stringify(contenedor)+e);
			}

			estilo +="#"+block.Name+"__"+item.Name+"{"+
			"width:" + Math.round(zoom * item.Width) + "px;" + 
			"height:" + Math.round(zoom * item.Height) + "px;" + 
			"position:absolute;" + 
			"top:" + lTop + "px;" + 
			"left:" + lLeft + "px;"+
			"}";

			if(item.Prompt){
				if(item.PromptAttachmentEdge === "Arriba"){
					lTop = Math.round(lTop - 20) + "px;";
					lLeft = lLeft + "px;";
				}else{
					lTop = lTop + "px;";
					lLeft = Math.round(lLeft - (item.Prompt.length) * 8) + "px;"; 
				}
				if(!isNaN(item.YPosition) && !isNaN(item.XPosition) && !isNaN(item.Prompt.length)){
					estilo +="#l"+block.Name+"_"+item.Name+"{"+
					"position:absolute;" +
					"top:" + lTop   + 
					"left:" + lLeft +
					"}";
				}
			}

		}

		if(item.ItemType === "Botón"){
			input.attr('type','button');
			input.attr('value',item.Label);
			input.attr('class','btn btn-primary');
		}else if(item.ItemType === "Elemento de Gráfico"){
			input.attr('type','checkbox');
		}else{
			input.attr('type','text');
			input.attr('class','form-control');
			input.attr('maxlength',item.MaximumLength?item.MaximumLength:100);
			input.addClass(item.DataType);
		}

	}catch(e){
		logger("Error con el item " + item.Name + e)
	}
}


//Agregado para descargar
function downloadDiv() {

	var contenido = '<%@page contentType="text/html" pageEncoding="UTF-8"%>' +
	'<% '+
	'	if (null == session.getAttribute("usuario")) {'+
	'		response.sendRedirect("index.html"); session.invalidate(); '+
	'    }'+
	' %>'+
	'<!DOCTYPE html><html><head>'+
	'<meta charset="UTF-8"/> '+
	'<link rel="stylesheet" type="text/css" href="css/'+ $("#forma").val().toUpperCase() +'.css"/>' +
	'</head><body>' +
	$("#divhtml").html() + '</body></html>';


	$("#desHtml").attr({
		download:$("#forma").val().toUpperCase()+".jsp",
		href:'data:text/jsp;charset=utf-8,' + encodeURIComponent(contenido)
	});

	$("#desCSS").attr({
		download:$("#forma").val().toUpperCase()+".css",
		href:'data:text/css;charset=utf-8,' + encodeURIComponent(estilo)
	});
}

/*---------------------------------------------------------------
* Arranque con la logica XD
*---------------------------------------------------------------*/
function extraerUnidades(json){
	var texto = "";
	var jst = "";
	for(var i = 0; i < json.ProgramUnit.length ; i++  ){
		if(json.ProgramUnit[i]){
			var nombre = json.ProgramUnit[i].Name;
			var procedimiento = json.ProgramUnit[i].ProgramUnitText.replace('&#10;','\n','ig');

			proced[nombre] = procedimiento;

			texto += "----------------------------\n" + procedimiento + "\n\n";
			jst += "----------------------------\n" + traducirProc(procedimiento) + "\n\n";
		}
	}

	$('<textarea/>',{
		text:texto,
		cols:100,
		rows:20
	}).appendTo("#divhtml");
	$('<textarea/>',{
		text:jst,
		cols:100,
		rows:20
	}).appendTo("#divhtml");
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

	return traducido.toUpperCase();
}

function buscarLinea(proce,inicio,finalL){
	var linea = "";

	var posI = proce.search(inicio);
	var lAux = proce.substr(posI,proce.length);
	var posF = lAux.search(finalL);

	linea = proce.substr(posI, posF);
	return linea;
}

function reemplazarGoItem(proce){

	var linea = buscarLinea(proce,'go_item',';')
	var lAux = linea.toUpperCase();

	lAux = lAux.replace('.','_');
	lAux = lAux.replace("GO_ITEM('",'$("#');
		lAux = lAux.replace("')",'").focus()');
		proce = proce.replace(linea,lAux);

		return proce;
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

	function crearSelect(block){
		var selectBloque = "";
		
		var displayItems = block.RecordsDisplayCount
		
		if(displayItems <= 1){
			return "";
		}
		/* Se cargan los campos a consultar del bloque*/

		var columns = block.DataSourceColumn;
		if  (columns){
			var cabecera =[];
			$.each(columns,function(i, source){
				if(verificarEncabezado(source.DSCName,block.Item)){
					cabecera.push(source.DSCName);
				}
			});

			var select = {
				cab:cabecera,
				from:block.DMLDataName ? block.DMLDataName : block.Name,
				where:block.WhereClause,
				order:block.OrderByClause
			};
			logger(select.cab.join(', '))
			/*Se encripta el select*/
			selectBloque = [].join(' ');

		}
		var select = {
			cab:"cabecera",
			from:block.DMLDataName ? block.DMLDataName : block.Name,
			where:block.WhereClause,
			order:block.OrderByClause
		};

		/**/
		var contenedor = $('<div/>',{
			id:block.Name+'__'+block.ScrollbarCanvasName
		}).appendTo("#c"+block.ScrollbarCanvasName);


		var table = $('<table/>',{
			'data-toggle':'table',
			'data-url':'getSelect',
			'data-query':selectBloque,
			'id':block.Name
		}).appendTo(contenedor);
		var thead = $('<thead/>').appendTo(table);
		var tr = $('<tr/>').appendTo(thead);

		$.each(block.Item,function(i, item){
			if(!item.Prompt){
				item.Prompt = "";
			}

			if (item.hasOwnProperty('CanvasName') && item.CanvasName !== ""){
				if((!item.hasOwnProperty('ItemsDisplay') || item.ItemsDisplay === "0" || item.ItemsDisplay !== "1")){
					$('<th/>',{
						'data-field':item.ColumnName?item.ColumnName:item.Name,
						'data-checkbox':item.ItemType==="Elemento de Gráfico"?true:undefined,
						text:item.Prompt!==""?item.Prompt.replace('&#10;','\n'):item.Name
					}).appendTo(tr);
				}
			}
		});
		if(block.ScrollbarYPosition){
			estilo += "#" + block.Name + '__' + block.ScrollbarCanvasName +"{"+"position:absolute; top:"+block.ScrollbarYPosition+"px;}";
		}
		
		return selectBloque;
	}

	function cambiarParametros(query){
		query = query.replace('&#10;','\n','ig');
		if(query.indexOf(':') > 0){
			var posI = query.indexOf(':');
			var posF = query.substring(posI).indexOf(' ') + posI
			if(posF<posI){
				posF = query.length;
			}
			var remp = query.substring(posI,posF);
			query = query.replace(remp,'?');
			return cambiarParametros(query);
		}else{
			return query;
		}
	}

	function verificarEncabezado(nombre,items){
		$.each(items,function(i,item){
			if(item.Name === nombre && item.hasOwnProperty('CanvasName') && item.CanvasName !== ""){
				return true;
			}
		});
		return false;
	}