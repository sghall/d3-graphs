var excel = require('node-xlsx'),
    fs    = require('fs');

var output = {};
var input  = excel.parse(__dirname + '/snarks.xlsx');

input.worksheets.forEach(function (ws) {
  console.log(ws.name);
  ws.data.forEach(function (item, j) {
    for (var i = 0; i < item.length; i++) {
      item[i] = item[i].value;
    }
  });
  output[ws.name] = ws.data;
});

fs.writeFile(__dirname + '/snarks.json', JSON.stringify(output), function(err) {
  if(err) { 
    console.log(err); 
  } else {
    console.log("Data saved.");
  }
});
