// add system clipboard functionality with chrome
// works with images and notebook cells (MIME-type 'notebook-cell/json')

"using strict";
define( function () {
    var load_ipython_extension = function () {
        if (window.chrome == undefined) return;

        /* http://stackoverflow.com/questions/3231459/create-unique-id-with-javascript */
        function uniqueid(){
            // always start with a letter (for DOM friendlyness)
            var idstr=String.fromCharCode(Math.floor((Math.random()*25)+65));
            do {                
                // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
                var ascicode=Math.floor((Math.random()*42)+48);
                if (ascicode<58 || ascicode>64){
                    // exclude all chars between : (58) and @ (64)
                    idstr+=String.fromCharCode(ascicode);    
                }                
            } while (idstr.length<32);

            return (idstr);
        }
        
        send_to_server = function(name,path,msg) {
            if (name == '') {
                name = uniqueid() + '.' + msg.match(/data:image\/(\S+);/)[1];
                }
            var url = 'http://' + location.host + '/api/contents/' + path + '/' + name;
            var img = msg.replace(/(^\S+,)/, ''); // strip header
//            console.log("send_to_server:", url, msg);
            data = {'name': name, 'format':'base64', 'content': img, 'type': 'file'}
           var settings = {
                processData : false,
                cache : false,
                type : "PUT",
                dataType : "json",
                data : JSON.stringify(data),
                headers : {'Content-Type': 'text/plain'},
                async : false,
                success : function (data, status, xhr) {
                    var new_cell = IPython.notebook.insert_cell_below('markdown');
                    var str = '<img  src="' + name + '"/>';
                    new_cell.set_text(str);
                    new_cell.execute();
                    //new_cell.select();
                    },
                error : function() {console.log('fail'); },
            };
            $.ajax(url, settings);
        }        
        /* 
         * override clipboard 'paste' and insert new cell from json data in clipboard
         */
        window.addEventListener('paste', function(event){
            var cell = IPython.notebook.get_selected_cell();
            if (cell.mode == "command" ) {
                event.preventDefault();
                var items = event.clipboardData.items;
                for (var i = 0; i < items.length; i++) {
                    console.log("items:", items[i].type);
                    if (items[i].type == 'notebook-cell/json') {
                        /* json data adds a new notebook cell */
                        var data = event.clipboardData.getData('notebook-cell/json');
                        var new_cell_data = JSON.parse(data);
                        var new_cell = IPython.notebook.insert_cell_below(new_cell_data.cell_type);
                        new_cell.fromJSON(new_cell_data);
                    } else if (items[i].type.indexOf('image/') !== -1) {
                        /* images are transferred to the server as file and linked to */
                        var blob = items[i].getAsFile();
                        var reader = new FileReader();
                        reader.onload = ( function(evt) {
                            var filename = '';
                            send_to_server(filename, IPython.notebook.notebook_path, evt.target.result); 
                            event.preventDefault();
                            } );
                        reader.readAsDataURL(blob);
                    }
                }
            }
        });

        /* 
         * override clipboard 'copy' and copy current cell as json and text to clipboard
         */
        window.addEventListener('copy', function(event){
            
            var cell = IPython.notebook.get_selected_cell();
            if (cell.mode == "command") { 
                var sel = window.getSelection();
                if (sel.type == "Range") return; /* default: copy marked text */
                event.preventDefault();
                var j = cell.toJSON();
                var json = JSON.stringify(j);           
                var text = cell.code_mirror.getValue();
                /* copy cell as json and cell contents as text */
                event.clipboardData.setData('notebook-cell/json',json);        
                event.clipboardData.setData("Text", text);
            }
        });    

        /* 
         * override clipboard 'cut' and copy current cell as json and text to clipboard
         */
        window.addEventListener('cut', function(event){
            
            var cell = IPython.notebook.get_selected_cell();
            if (cell.mode == "command" ) {  
                var sel = window.getSelection();
                if (sel.type == "Range") return; /* default: cut marked text */
                event.preventDefault();
                var j = cell.toJSON();
                var json = JSON.stringify(j);
                var text = cell.code_mirror.getValue();       
                /* copy cell as json and cell contents as text */        
                event.clipboardData.setData('notebook-cell/json',json);
                event.clipboardData.setData("Text", text);
                IPython.notebook.delete_cell(IPython.notebook.find_cell_index(cell));
            }
        });
    };

    return {
        load_ipython_extension : load_ipython_extension,
    };
});

