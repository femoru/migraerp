var jsonWork;
var zoom = 1.8;
var estilo = "label{position:absolute;}";
var proced = new Object();


$( document ).ready(function() {
    logger("ready!");

	$("#desHtml").hide();
	$("#desCSS").hide();

    $("#zoom").val(zoom);
    $("#ghtml").on('click',function(){
    	zoom = $("#zoom").val();
    	$("#divhtml").empty();
    	$.get("xml/" + $("#forma").val()+".xml",function(xml){
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
		$.get("xml/" + $("#forma").val()+".xml",function(xml){
    		var json = $.xml2json(xml)
    		jsonWork = json.FormModule;
    		extraerUnidades(json.FormModule);
    		$("#respjson").text(JSON.stringify(json));
	    });
	});

   
});
function logger(msj){
	console.log(msj);
}

function crearHTML(json){
	jsonWork = json;
	//Pinta los atributos Window
	if(!$.isArray(json.Window)){
		pintarVentana(json.Window);
	}else{
		for (var i = 0; i < json.Window.length; i++) {
			pintarVentana(json.Window[i]);

		};
	}

	//Pinta los atributos Canvas
	if(!$.isArray(json.Canvas)){
		pintarCanvas(json.Canvas);
	}else{
		for (var i = 0; i < json.Canvas.length; i++) {
			pintarCanvas(json.Canvas[i]);

		};
	}

	//Pinta los bloques 
	if(!$.isArray(json.Block)){
		pintarBloque(json.Block);
	}else{
		for (var i = 0; i < json.Block.length; i++) {
			pintarBloque(json.Block[i]);

		};
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
	//Pinta los atributos Graphics
	if(!$.isArray(Graphics)){
		pintarGraphics(Graphics,canvas);
	}else{
		for (var i = 0; i < Graphics.length; i++) {
			pintarGraphics(Graphics[i],canvas);
		};
	}
	if(Graphics ){
		var contenedora;
		var areaMayor = 0;
		var area = 0;
		for (var i = 0; i <Graphics.length;i++) {
			area = (Graphics[i].Width - Graphics[i].XPosition) *(Graphics[i].Height - Graphics[i].YPosition);
			if(area > areaMayor){
				areaMayor = area;
				contenedora = Graphics[i].Name+"_"+canvas;
			}
		}
		$("#"+contenedora).removeClass("bloque");
		$("#"+contenedora).addClass("mayor");
	}
	
}

function pintarGraphics(graphics,canvas){
	try{
		if(graphics.Width > 0){
			
			var grp = $( "<div/>",{
				id:graphics.Name+"_"+canvas,
				class:"graphics"
			}).appendTo("#c" + canvas);

			estilo += "#"+graphics.Name+"_"+canvas+"{"+
				"width:" + Math.round(zoom * graphics.Width) + "px;" + 
				"height:" + Math.round(zoom * graphics.Height) + "px;"+
				"position:absolute;"+
				"Top:" + Math.round(zoom * graphics.YPosition) + "px;" + 
				"Left:" + Math.round(zoom * graphics.XPosition) + "px;"+
				"color: " + graphics.GraphicsFontColor + ";"+
				"}";

			if(graphics.GraphicsText){
				var texto = graphics.GraphicsText;
				texto = texto.replace("&#10;","");
				grp.text(texto);
			}

			if(graphics.CornerRadiusY > 0){
				grp.css('border-radius',graphics.CornerRadiusY + "px")	;
				grp.css('background-color',"#A6F6F6");	
				grp.css('border',"1px solid white");	
				grp.addClass('bloque');
			}
		}
	}catch(e){
		logger("Error en graphics canvas:"+canvas);
	}
}

function pintarBloque(block){

	if(!$.isArray(block.Item)){
		pintarItems(block.Item,block.Name);
	}else{
		for (var i = 0; i < block.Item.length; i++) {
			pintarItems(block.Item[i],block);
		};
	}
}

function pintarItems(item,block){
	try{

		var divCont =$('<div/>',{
			id:"d"+block.Name+"_"+item.Name
		});

		try{
			var label = $("<label/>",{
				id:"l"+block.Name+"_"+item.Name,
				'for':block.Name+"_"+item.Name,
				text:item.Prompt.replace('&#10;','\n')
			}).appendTo(divCont);

			var lTop,lLeft;

		}catch(e){
			logger(item.Name + " error en label")
			item.Prompt = "";
		}

		var input = $('<input/>',{
			id:block.Name+"_"+item.Name,
			placeholder:item.Prompt.replace('&#10;',' '),
			title:item.Prompt.replace('&#10;',' ')
		}).appendTo(divCont);

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

			estilo +="#"+block.Name+"_"+item.Name+"{"+
				"width:" + Math.round(zoom * item.Width) + "px;" + 
				"height:" + Math.round(zoom * item.Height) + "px;" + 
				"position:absolute;" + 
				"Top:" + lTop + "px;" + 
				"Left:" + lLeft + "px;"+
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
						"Top:" + lTop   + 
						"Left:" + lLeft +
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
		}

	}catch(e){
		logger("Error con el item " + item.Name)
	}
}


//Agregado para descargar
function downloadDiv() {

	var contenido = '<!DOCTYPE html><html><head>'+
	'<meta charset="UTF-8"/> '+
	'<script src="js/jquery.min.js"></script>' +
	'<script src="js/bootstrap.min.js"></script>' +
	'<link rel="stylesheet" type="text/css" href="css/bootstrap.min.css">' +
	'<link rel="stylesheet" type="text/css" href="css/roboto.css">' +
	'<link rel="stylesheet" type="text/css" href="css/font-awesome.min.css">' +
	'<link rel="stylesheet" type="text/css" href="css/'+ $("#forma").val() +'.css"/>' +
	'</head><body>' +
	$("#divhtml").html() + '</body></html>';

	$("#desHtml").attr({
		download:$("#forma").val()+".html",
		href:'data:text/html;charset=utf-8,' + encodeURIComponent(contenido)
	});

	$("#desCSS").attr({
		download:$("#forma").val()+".css",
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
	proc = reemplazarGoItem(proc);
	traducido = proc;

	return traducido;
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