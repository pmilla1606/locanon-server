var express     = require('express');
var app         = express();
var server      = require('http').createServer(app);
var bodyParser  = require('body-parser');
var mongoose    = require('mongoose');
var compression = require('compression');
var http        = require('http');

// parse application/json
app.use(bodyParser.json());

app.use(compression({
  threshold: 512
}))

var oneDay = 86400000;

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || '8080');
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
app.use(bodyParser.urlencoded({
  extended: true
}));
http.createServer(app).listen(app.get('port') ,app.get('ip'), function () {
    console.log("✔ Express server listening at %s:%d ", app.get('ip'),app.get('port'));
});

// default to a 'localhost' configuration:
var connection_string = 'mongodb://localhost/locanon_dev_db';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
  process.env.OPENSHIFT_APP_NAME;
}
console.log('CONNECTION STRING', connection_string)
mongoose.connect(connection_string);
var db = mongoose.connection;

var MessageSchema = mongoose.Schema({
    created_at: { type: Date },
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
  console.log(req.body)
  var coords = [];
  coords[0] = Number(json.lng);
  coords[1] = Number(json.lat);

  // console.log('creating new msg with coords -> ', coords)
  a = new Message({
    created_at: new Date(),
    messageString: json.msg,
    timesFlagged: 0, // ++ this from users, if timesFlagged == 5 e.g. don't display it
    loc: {
      coordinates: coords
    }
  });

  a.save();
  console.log('Saved ', a);
  res.status(200).json(a)
  res.end()
});

// retrieve all messages for a given location (tag);
app.get('/app/:tagId', function (req, res) {
  var requestParam = req.params.tagId.split('--');

  var lng = Number(requestParam[0]);
  var lat = Number(requestParam[1]);

  var coords = [lng, lat]

  // console.log('retrieving msg with coords -> ', coords)
  // find({ size: 'small' }).where('createdDate').gt(oneYearAgo).exec(callback);
  Message.find({
    loc: {
      $nearSphere: {
        $geometry: {
          type : "Point",
          coordinates : coords
        },
        $maxDistance: 20 // 100 meters?}
      }
    }
  }).sort({created_at: -1}).exec(function(err, docs){
    if (err) console.log(err)
    // should probably delete this at some point?
    //res.setHeader('Access-Control-Allow-Origin','*');
    res.status(200).json(docs)
    res.end()
  });
});

