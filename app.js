var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose'); //Datenbank handler

//var helmet = require('helmet');
//helmet modules by their own.
/*var contentSecurityPolicy = require("helmet-csp");
//var expectCt = require("expect-ct");
var referrerPolicy = require("referrer-policy");
var noSniff = require("dont-sniff-mimetype");
var dnsPrefetchControl = require("dns-prefetch-control");
var ieNoOpen = require("ienoopen");
var frameguard = require("frameguard");
var permittedCrossDomainPolicies = require("helmet-crossdomain");
var hidePoweredBy = require("hide-powered-by");
var xssFilter = require("x-xss-protection");*/


//require my config for the MongoDB URL
var config = require('./config');

////getting body parser (erst npm install body_parser ? oder als dev --save-dev dahinter) Um das im package.json als dependencie zu speichern
var bodyParser = require("body-parser");


//var indexRouter = require('./routes/index'); //not in use
//var usersRouter = require('./routes/users'); //not in use

var app = express();
console.log("using helmet");
//app.use(helmet()); //Helmet is a middleware package. It can set appropriate HTTP headers that help protect your app from well-known web vulnerabilities
					// (see the docs for more information on what headers it sets and vulnerabilities it protects against).
					// https://www.npmjs.com/package/helmet

/*////use all helmet features manually
app.use(contentSecurityPolicy());
//app.use(expectCt());
app.use(referrerPolicy());
app.use(noSniff());
app.use(dnsPrefetchControl());
app.use(ieNoOpen());
app.use(frameguard());
app.use(permittedCrossDomainPolicies());
app.use(hidePoweredBy());
app.use(xssFilter());	
////app.use(helmet.hsts());
*/		

					

// view engine setup
app.set('views', path.join(__dirname, 'views')); //Where are the templates
app.set('view engine', 'pug'); //Which Template library

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'))); //__dirname = local root directory Use express to serve all static files in the /public folder (in project root)

////Using body_parser for JSON objects
////app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//both not in use
//app.use('/index', indexRouter);  //BeimPfad localhost:3000/index wird index.js verwendet , der request wird an index.js weitergeleitet
//app.use('/users', usersRouter); //Beim pfad localhost:3000/users wird users.js verwendet

//small test, doesnt work...
/*app.get('/', function(req, res, next){
	console.log("redirect to http?");
	res.redirect('http://' + req.headers.host + req.url);
});*/

//#### Default Page ####
//Um beim pfad server:port/ die main.html zurück zu geben
app.get('/', function(req, res, next) {
	res.sendFile(path.join(__dirname + "/public/main.html")); //Um bei / als pfad die main.html zu geben
});
//##################################
//### Responses/Request handler) ###
app.post('/sendScore', function(req, res, next) {
	var _name = req.body.name;
	var _score = req.body.score;
	console.log("recieved: "+_name +" "+_score);
	
	//in Datenbank speichern
	var testInstance = new UserModel({name: _name, score: _score});
	testInstance.save(function (err, testInstance) {
		if (err) return console.error(err);
		console.log("new Entry saved");
	});
	
	res.send("success"); //Um bei / als pfad die main.html zu geben
});
// GET SCOREBOARD
app.get('/getScore', function(req, res, next) {
	console.log("\n SCORE REQUESTED \n");
	//TODO hier ein JSON object senden und es beim Client auspacken
	testObject = '{"user":[{"name":"hans","score":30},{"name":"hans","score":30}]}';

	// Query 
	// find all athletes that play tennis
	var query = UserModel.find();
	// selecting the 'name' and 'score' fields but no _id field (kann man eigentlich auch drin lassen, lean entfertn das bereits)
	query.select('name score -_id'); 
	// sort by score
	query.sort({ score: -1 });
	//limit our results to 10 items
	query.limit(10);
	//to return JS objects not Mongoose Documents
	query.lean();
	
	//Query ergibt ein array von JS-Objekten mit name und score
	// execute the query at a later time
	query.exec(function (err, queryResult) {
	  if (err) return handleError(err);
	 
		//JSON String aus dem Query Result basteln 
		//(geht bestimmt auch irgendwie einfach und genereller, der String functioniert nur mit name:string und score:number)
		resJSON = '{"user":[';
		for(var i = 0; i < queryResult.length;i++)
		{
		  if(i != 0){resJSON += ",";}
		  resJSON += '{"name":"'+ queryResult[i].name + '","score":' + queryResult[i].score + '}';
		}
		resJSON+=']}';
		
		//Antwort JSON an den Server senden
		res.send(resJSON); 
	});
	
});
//#################


//#############################
//#### DATABASE Connection ####
//Set up default mongoose connection
//Connect to Mongodb Atlas cloud db
//TODO fix harcoded username and Password
var mongoDB = process.env.MONGODB_URI || config.mongDBConnection; //environment MONGODB_URI variable or the one from the config
mongoose.connect(mongoDB, { useNewUrlParser: true },);

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

//Model erstellen (Template für Document/Entry)
var UserModelSchema = new mongoose.Schema({
//ID: Schema.Types.ObjectId, //wird genutzt um verbindungen mit andern Tabellen(documents) herzustellen, wir haben nur eine
name: String,
score: Number
});
var UserModel = mongoose.model('UserModel', UserModelSchema ); //document = 1 object

//Einmalige Operationen für Testzwecke !
db.once("open",function(){
	//To delete all data in UserModel
	//Empty matches all
	/*UserModel.deleteMany({},function (err) {
		if(err) console.log(err);
		console.log("Successful deletion of all");
	});*/
	
	//Delte all with name Hans
	/*UserModel.deleteMany({ name: 'Hans' }, function (err) {
		if(err) console.log(err);
	console.log("Successful deletion");
	});*/
	
	/*var testInstance = new UserModel({name: "TestEintrag", score: "10"});
	//Erstellt automatisch die Tabelle/Model names "UserModels" (weil automatisch en s dran gehängt wird, warum auch immer, zumindest bei mongoDB atlas)
	testInstance.save(function (err, testInstance) {
		if (err) return console.error(err);
	});*/
});
//#############################


// error handler
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// req has information about the HTTP request coming from the client
// res to send back HTTP respond
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
