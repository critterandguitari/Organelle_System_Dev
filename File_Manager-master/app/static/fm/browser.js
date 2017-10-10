

var fsurl = '/fmdata'
var workingDir = '';
var clipboard = {};

// TODO  really anytime the table view changes we want to first call detachPlayer.  
// is there an event we can use rather than having to explictly call it everytime?
function refreshWorkingDir(){
	detachPlayer();
    $.get(fsurl+'?operation=get_node', { 'id' : workingDir})
    .done(function (d) {
        renderFilesTable(d);
        renderBreadcrumb();
    })
    .fail(function () {
        console.log('problem refreshing');
    });    
    // empty clipboard
    clipboard = {};
}

function getWorkingDir() {
    console.log("current dir:" + workingDir);
    return workingDir;
}

function getSelectedNodes(){
    var selectedNodes = [];
    $(".checkbox > input").each(function(){
        if ($(this).is(":checked")) {
            var node = {
                'path' : $(this).closest('tr').data('path'),
                'type' : $(this).closest('tr').data('type'),
            }
            selectedNodes.push(node);
        }
    });
    return selectedNodes
}

function selectedIsOneFile(){
    var selectedNodes = getSelectedNodes();
    console.log(selectedNodes);
    if (selectedNodes.length == 1 && selectedNodes[0].type == 'file') return true;
    else return false;
}

// TODO nodes from server have different attr names than nodes selected, should be same
// might need to change server 'id' to 'path' is all
function nodeNameWithIcon(path, type){
    var basename = path.split('/').pop();
    console.log(type);
    if (type == "file"){
        var extension = basename.split('.').pop();
        var img = '';
        if (extension == 'pd') img = "./assets/pd.png";
        else if (extension == 'wav') img = "./assets/wav.png";
        else img = "./assets/txt.png";
    } else {
        img = "./assets/folder.png";
    }
    return $('<span class="fname-icon"><img src="'+img+'" width=20/>&nbsp;&nbsp;' + basename + '</span>');
}

function renderFilesTable(d){
    detachPlayer();
    $("#ftable").empty();
    var path = '';
    d.forEach(function(c){
        var basename = c.id.split('/').pop();
        if (c.type == 'folder'){
            var trow = $('<tr class="fsdir">');
            var tdata = $('<td class="fsdirname"><span class="gspacer" /></td>');
            tdata.append(nodeNameWithIcon(c.id, c.type));
        } else {
            var trow = $('<tr class="fsfile">');
            var tdata = $('<td class="fsfilename">');
            var dlButton = $('<a class="dl-but" href="/getdl?fpath='+encodeURIComponent(c.id)+'&cb=cool"><span class="glyphicon glyphicon-download-alt"></span></a>');
            tdata.append(dlButton);
            tdata.append(nodeNameWithIcon(c.id, c.type));
        }
        trow.data("path", c.id);
        trow.data("type", c.type);
        var checkbox = $('<td><div class="checkbox"><input type="checkbox" value=""></div></td>');
        trow.append(checkbox);
        trow.append(tdata);
        trow.append('<td>'+c.type+'</td>');
        $("#ftable").append(trow);
    });
    window.scrollTo(0,0);
}

function renderBreadcrumb () {
    $("#fsbreadcrumb").empty();
    var absPath = '/';
    var breadelement = $('<li class="fsdir"><a href="#">USB Drive</a></li>');
    breadelement.data("path", absPath);
    $("#fsbreadcrumb").append(breadelement);
    path = workingDir.split('/');
    path.forEach(function(p) {
        if (p) {
            absPath += '/' + p;
            var breadelement = $('<li class="fsdir"><a href="#">' + p + '</a></li>');
            breadelement.data("path", absPath);
            $("#fsbreadcrumb").append(breadelement);
        }
    });
}

// adjust for scrollable file table
function SetHeight(){
    var h = $(window).height();
    $("#files-table").height(h-200);   
}

$(window).resize(SetHeight);

$(function () {

   // $.ajaxSetup({
   //       async: false
   // });
	$(document).ready(SetHeight);
	$(window).resize(SetHeight);
    
	// init player
    $("#jquery_jplayer_1").jPlayer({
        ready: function(event) {
            $(this).jPlayer("setMedia", {
                wav: "./s1.wav"
            });
        },
        swfPath: "http://www.jplayer.org/2.1.0/js",
        supplied: "wav",
    });
	
	var player = $("#jp_container_1");
	detachPlayer();

    // button actions
    $('#fileupload').fileupload({
        url: '/upload',
        dataType: 'json',
        formData: function() {
            return [{'name':'nid', 'value':getWorkingDir()}];
        },//{'nid': 'asdf'},
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
                //$('<p/>').text(file.name).appendTo('#files');
            });
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        }
    }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');
    $('#fileupload').bind('fileuploadstart', function (e) {$('#upload-modal').modal('show');});
    $('#fileupload').bind('fileuploadstop', function (e, data) {
        $('#upload-modal').modal('hide');
        refreshWorkingDir()
        console.log(data);
    });

    $("#download-but").click(function(){
        if (selectedIsOneFile()) {
            var selectedNodes = getSelectedNodes();
            path = selectedNodes[0].path;
            console.log('this is when we download');
            //$.get(fsurl+'?operation=download_node', { 'id' : path })
            time = new Date(); // cash buster
            $.get('/getdl', { 'fpath' : path, 'cb': time.getTime()})
            .done(function () {
                console.log('downloaded 1');
            })
            .fail(function () {
                console.log('problem downloading');
            });
        }   
        else {
            $('#info-modal').modal('show');
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one file to download.</p>');   
        }
    });

    $("#new-folder-but").click(function(){
        $('#new-folder-modal').modal('show');
    });

    $("#confirm-new-folder").click(function(){
        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        $.get(fsurl+'?operation=create_node', { 'id' : workingDir, 'text' : $('#new-folder-name').val() })
        .done(function () {
            console.log('created 1');
        })
        .fail(function () {
            console.log('problem creating folder');
        });
        console.log('going to refresh');
        refreshWorkingDir();
        $('#new-folder-modal').modal('hide');
        $.ajaxSetup({async: true});
    });


    $("#rename-but").click(function(){
        var selectedNodes = getSelectedNodes();
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();
            $('#rename-modal').modal('show');
            $('#rename-text').val(basename);

        } 
        else {
            $('#info-modal').modal('show');
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one item to rename.</p>');   
        }
    });

    $("#confirm-rename").click(function(){
        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
        $.get(fsurl+'?operation=rename_node', { 'id' : n.path, 'text' : $('#rename-text').val() })
        .done(function () {
            console.log('renamed 1');
        })
        .fail(function () {
            console.log('problem moving');
        });
        console.log('going to refresh');
        refreshWorkingDir();
        clipboard = {};
        $('#rename-modal').modal('hide');
        $.ajaxSetup({async: true});
    });

    $("#copy-but").click(function(){
        clipboard.operation = "copy";
        clipboard.nodes = getSelectedNodes();
        console.log(clipboard);
    });

    $("#cut-but").click(function(){
        clipboard.operation = "cut";
        clipboard.nodes = getSelectedNodes();
        console.log(clipboard);
    });

    $("#paste-but").click(function(){
        var selectedNodes = clipboard.nodes;
        if (clipboard.nodes && clipboard.nodes.length > 0 ){
            if (clipboard.operation == "copy") {
                $('#copy-modal').modal('show');
                $('#copy-modal-msg').empty();   
                $('#copy-modal-msg').append('<p>Paste files: </p>');   
                selectedNodes.forEach(function(n) {
                    $('#copy-modal-msg').append('<p>').append(nodeNameWithIcon(n.path,n.type));   
                });       
                $('#copy-modal-msg').append('<p> to current folder?</p>');   
            }
            else if (clipboard.operation == "cut") {
                $('#move-modal').modal('show');
                $('#move-modal-msg').empty();   
                $('#move-modal-msg').append('<p>Move files: </p>');   
                selectedNodes.forEach(function(n) {
                    $('#move-modal-msg').append('<p>').append(nodeNameWithIcon(n.path,n.type));  
                });       
                $('#move-modal-msg').append('<p> to current folder?</p>');   
            }
        }
        else {
            $('#info-modal').modal('show');
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose files then select Copy or Cut to move.</p>');   
        }
    });

    $("#confirm-move").click(function(){
      
        console.log('about to cut');

        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = clipboard.nodes;
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=move_node', { 'id' : n.path, 'parent' : workingDir })
            .done(function () {
                console.log('moved 1');
            })
            .fail(function () {
                console.log('problem moving');
            });
        });
        console.log('going to refresh');
        refreshWorkingDir();
        clipboard = {};
        $('#move-modal').modal('hide');
        $.ajaxSetup({async: true});
    });

    $("#confirm-copy").click(function(){
      
        console.log('about to copy');

        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = clipboard.nodes;
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=copy_node', { 'id' : n.path, 'parent' : workingDir })
            .done(function () {
                console.log('copied 1');
            })
            .fail(function () {
                console.log('problem copying');
            });
        });
        console.log('going to refresh');
        refreshWorkingDir();
        clipboard = {};
        $('#copy-modal').modal('hide');
        $.ajaxSetup({async: true});
    });

    $("#delete-but").click(function(){
        var selectedNodes = getSelectedNodes();
        $('#del-node-list').empty();
        $('#del-modal').modal('show');
        selectedNodes.forEach(function(n) {
            $('#del-node-list').append('<p>').append(nodeNameWithIcon(n.path,n.type));   
        });
    });

    $("#confirm-delete").click(function(){
        console.log('about to delete');

        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = getSelectedNodes();
        selectedNodes.forEach(function(n) {
            $.get(fsurl+'?operation=delete_node', { 'id' : n.path })
            .done(function () {
                console.log('deleted 1');
            })
            .fail(function () {
                console.log('problem deleting');
            });
        });
        console.log('going to refresh');
        refreshWorkingDir();
        $('#del-modal').modal('hide');
        
        $.ajaxSetup({async: true});
    });

    $("#zip-but").click(function(){
        var selectedNodes = getSelectedNodes();
        var gotaZip = false;
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();

            if (selectedNodes[0].type == 'folder') {
                gotaZip = true;
                $('#zip-modal').modal('show');
                $('#zip-modal-msg').empty();   
                $('#zip-modal-msg').append('<p>Zip <b>'+basename+'?</b></p>');   
            }
        } 
        if (!gotaZip){
            $('#info-modal').modal('show');
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one folder to zip.</p>');   
        }
    });

    $("#confirm-zip").click(function(){
        console.log('about to zip');

        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
        $.get(fsurl+'?operation=zip_node', { 'id' : n.path })
        .done(function () {
            console.log('zipped 1');
        })
        .fail(function () {
            console.log('problem zipping');
        });
        console.log('going to refresh');
        refreshWorkingDir();
        $('#zip-modal').modal('hide');
        
        $.ajaxSetup({async: true});
    });



    $("#unzip-but").click(function(){
        var selectedNodes = getSelectedNodes();
        var gotaZip = false;
        if (selectedNodes.length == 1) {
            var path = selectedNodes[0].path;
            var basename = path.split('/').pop();
            var extension = basename.split('.').pop();

            if (extension == 'zip') {
                gotaZip = true;
                $('#unzip-modal').modal('show');
                $('#unzip-modal-msg').empty();   
                $('#unzip-modal-msg').append('<p>Unzip <b>'+basename+'</b> into current folder?</p>');   
            }
        } 
        if (!gotaZip){
            $('#info-modal').modal('show');
            $('#info-modal-msg').empty();   
            $('#info-modal-msg').append('<p>Choose one .zip file to unzip.</p>');   
        }
    });

    $("#confirm-unzip").click(function(){
        console.log('about to unzip');

        // TODO don't change global ajax (it is deprecated anyway)
        $.ajaxSetup({async: false});
        var selectedNodes = getSelectedNodes();
        n = selectedNodes[0];
        $.get(fsurl+'?operation=unzip_node', { 'id' : n.path })
        .done(function () {
            console.log('unzipped 1');
        })
        .fail(function () {
            console.log('problem unzipping');
        });
        console.log('going to refresh');
        refreshWorkingDir();
        $('#unzip-modal').modal('hide');
        
        $.ajaxSetup({async: true});
    });


    // click on directory table row, excluding input elements
    $('body').on('click', '.fsdir', function(event) {
        var target = $(event.target);
        //console.log(target);
        if (!target.is("input")) {
            workingDir = $(this).data("path");
            $.get(fsurl+'?operation=get_node', { 'id' : $(this).data("path")})
            .done(function (d) {
                renderFilesTable(d);
                renderBreadcrumb(d); 
            })
            .fail(function () {
                console.log('oops');
            });
        }
    });

    // click on file row, excluding input elements
    $('body').on('click', '.fsfile', function(event) {
        var target = $(event.target);
        var clickOnPlayer = ($("#jp_container_1").has(event.target).length > 0)
        //console.log(clickOnPlayer);
        if (!target.is("input") && !clickOnPlayer) { //TODO how to specify target up the dom
            //console.log(target);
            var path=$(this).data("path");
            var extension=path.split(".").pop();
            if (extension == "wav"){
                //console.log($(this.childNodes[1]));
			    detachPlayer();
                $(this.childNodes[1]).append(player);
				loadFile(path);
            }
        }
    });


    /*$('body').on('click', '.fsdirbc', function() {
        workingDir = $(this).data("path");
        $.get(fsurl+'?operation=get_node', { 'id' : $(this).data("path")})
        .done(function (d) {
            renderFilesTable(d);
            renderBreadcrumb(d); 
        })
        .fail(function () {
            console.log('oops');
        });
    });*/

    $.get(fsurl+'?operation=get_node', { 'id' : '/'})
    .done(function (d) {
        renderFilesTable(d);
        renderBreadcrumb();
    })
    .fail(function () {
        console.log('oops');
    });    
});

// these functions is called by the JavascriptView object of the player.
function getUpdate(typ,pr1,pr2,swf) { 
}

function checkPlayState(){
}

function playpause() {
 
    $("#jquery_jplayer_1").jPlayer("play", {});
 
}

function getItemData(idx) {
};

function detachPlayer(){
	$("#jquery_jplayer_1").jPlayer("stop", {});
	$("#jp_container_1").detach();
}

// These functions are caught by the feeder object of the player.
function loadFile(filename) { 
	//alert("loading");

    $("#jquery_jplayer_1").jPlayer("clearMedia");
            $("#jquery_jplayer_1").jPlayer("setMedia", {
                        //wav: "http://thepeacetreaty.org/sounds/kaleidoloops/"+col+"/"+name
                        //wav: "http://thepeacetreaty.org/sounds/kaleidoloops/"+col+"/"+name
                        wav: "/getfile?fpath=" + encodeURIComponent(filename) + "&cb="+ new Date().getTime()
                        //wav: "./soundfiles/wavs/" + name + ".wav"
            });

    //console.log(encodeURIComponent(filename));
 
    $("#jquery_jplayer_1").jPlayer("stop", {});

};

// This is a javascript handler for the player and is always needed.
function thisMovie(movieName) {
};

// This creates the player after the page has finished loading (onload).
function createPlayer() {
};

function secondsToTime(totalSec) {
    hours = parseInt( totalSec / 3600 ) % 24;
    minutes = parseInt( totalSec / 60 ) % 60;
    seconds = totalSec % 60;

    return (hours < 10 ? "0" + hours : hours) + "-" + (minutes < 10 ? "0" + minutes : minutes) + "-" + (seconds  < 10 ? "0" + seconds : seconds);
};

