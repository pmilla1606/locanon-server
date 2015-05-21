var express     = require('express');
var app         = express();
var server      = require('http').createServer(app);
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var compression = require('compression');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(compression({
  threshold: 512
}))

var oneDay = 86400000;

server.listen(1337);

mongoose.connect('mongodb://localhost/locanon_dev_db');
var db = mongoose.connection;

var MessageSchema = mongoose.Schema({
    loc: {
      lng: Number,
      lat: Number
    },
    messageString: String,
    likes: Number,
    dislikes: Number,
  });

var Message = mongoose.model('Message', MessageSchema)


db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function callback () {
  console.log('Connected to DB');
});

app.get('/', function(req, res){
  console.log('Im Alive!');
});

// create a new message
app.post('/app', function(req, res){
  var json = req.body;

  a = new Message({
    loc: {
      lng: json.lng,
      lat: json.lat
    },
    messageString: json.message,
    likes: 0,
    dislikes: 0
  });

  a.save();
  res.status(200).json(a)
  res.end()
});

// retrieve all messages for a given location (tag);
app.get('/app/:tagId', function (req, res) {
  var requestParam = req.params.tagId.split('--');

  var lat = Number(requestParam[1]);
  var lng = Number(requestParam[0]);

  Message.find({'loc.lng': lng, 'loc.lat': lat}, function(err, docs){
    
    // should probably delete this at some point?
    //res.setHeader('Access-Control-Allow-Origin','*');
    res.status(200).json(docs)

    res.end()
  });
});



