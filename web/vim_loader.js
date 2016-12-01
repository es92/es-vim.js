


function load_vim(resolve, reject){
  new Promise(function getEmterpreterBinaryData(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'vim.js.binary', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(){
      reject(xhr.statusText);
    };
    xhr.send(null);
  }).then(function(emterpreterBinaryData){
    var vimjs = VimJS({
      emterpreterFile: emterpreterBinaryData,
      noInitialRun: false,
      noExitRuntime: true,
      arguments: ['/usr/local/share/vim/example.js'],
      set_vimjs: function(em_vimjs){
        vimjs.em_vimjs = em_vimjs
        resolve(vimjs);
      },
      preRun: [ function() { 

      } ],
      postRun: [],
      print: function() { 
        if (console.group !== undefined) {
          console.group.apply(console, arguments); 
          console.groupEnd();
        } else {
          // IE
          console.log(arguments);
        }
      },
      printErr: function() { 
        if (console.group !== undefined) {
          console.group.apply(console, arguments); 
          console.groupEnd();
        } else {
          // IE
          console.log(arguments);
        }
      },
    });
  });
}
