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
    messageString: String,
    timesFlagged: Number,
    loc: {
      'type': {
        type: String,
        enum: "Point",
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0,0]
      }
    },
  });

MessageSchema.index({'loc': '2dsphere'});

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

  var coords = [];
  coords[0] = json.lng;
  coords[1] = json.lat;

  a = new Message({
    messageString: json.message,
    timesFlagged: 0, // ++ this from users, if timesFlagged == 5 e.g. don't display it
    loc: {
      coordinates: coords
    }
  });

  a.save();
  res.status(200).json(a)
  res.end()
});

// retrieve all messages for a given location (tag);
app.get('/app/:tagId', function (req, res) {
  var requestParam = req.params.tagId.split('--');

  var lng = Number(requestParam[0]);
  var lat = Number(requestParam[1]);

  Message.find({
    loc: {
      $nearSphere: {
       $geometry: {
          type : "Point",
          coordinates : requestParam
       },
       $maxDistance: 20 // 100 meters?
      }
    },
  },
  function(err, docs){
    if (err) console.log(err)

    // should probably delete this at some point?
    //res.setHeader('Access-Control-Allow-Origin','*');
    res.status(200).json(docs)
    res.end()
  });
});



