var express     = require('express');
var app         = express();
var server      = require('http').createServer(app);
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var compression = require('compression');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(compression({
  threshold: 512
}))

var oneDay = 86400000;

app.use('/', express.static(__dirname + '/sales', { maxAge: oneDay }));
app.use('/app', express.static(__dirname + '/', { maxAge: oneDay }));

server.listen(1337);

mongoose.connect('mongodb://localhost/subdoc');
var db = mongoose.connection;

var MessageSchema = mongoose.Schema({
    lat: Number,
    lng: Number,
    messageString: String,
    likes: Number,
    dislikes: Number,
  });

var Messages = mongoose.model('Messages', MessageSchema)






db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {
  console.log('Connected to DB');
});

app.get('/', function(req, res){
  console.log('Im Alive!');
});

app.post('/app', function(req, res){
  //var requestParam = req.params.tagId.split('--');
  
  // var lat = requestParam[0];
  // var lng = requestParam[1];
  console.log('POST')
  console.log(req);
  //res.json(req)
});


app.get('/app/:tagId', function (req, res) {
  var requestParam = req.params.tagId;

  var dummy = {dummyData: requestParam};
  
  // should probably delete this at some point?
  res.setHeader('Access-Control-Allow-Origin','*');


  res.json(dummy);
  res.end()


  
});



