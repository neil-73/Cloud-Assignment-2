// Server JavaScript File

/* 	
	-- Cloud Assignment 2 -- 
	Name: 	Neil Ramdath
	ID: 	100519195
	------------------------ 
*/

// Get modules.
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var AWS = require('aws-sdk');
var app = express();

// App settings
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.locals.theme = process.env.THEME; //Make the THEME environment variable available to the app. 

// Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

// Create DynamoDB client and pass into the appropriate region.
var db = new AWS.DynamoDB({region: config.AWS_REGION});
// Create SNS client and pass into the appropriate region
var sns = new AWS.SNS({ region: config.AWS_REGION});

// Get the home page
app.get('/', routes.index);

// The post signup form
app.post('/signup', function(req, res) 
{
  var nameField = req.body.name,
      emailField = req.body.email,
      previewBool = req.body.previewAccess;
  res.send(200);
  signup(nameField, emailField, previewBool);
});

// Add the signup form data to database.
var signup = function (nameSubmitted, emailSubmitted, previewPreference) {
  var formData = 
  {
    TableName: config.STARTUP_SIGNUP_TABLE,
    Item: 
    {
      email: {'S': emailSubmitted}, 
      name: {'S': nameSubmitted},
      preview: {'S': previewPreference}
    }
  };

  // Put item into database
  db.putItem(formData, function(err, data) 
  {
    if (err) 
    {
      console.log('Error adding item to database: ', err);
    } 
    else 
    {
      console.log('Form data added to database.');
      
      // Send SNS notification containing email from form.
      var snsMessage = 'Notice! New signup for the Mississauga Ramblers: %EMAIL%'; 
      snsMessage = snsMessage.replace('%EMAIL%', formData.Item.email['S']);
      sns.publish({ TopicArn: config.NEW_SIGNUP_TOPIC, Message: snsMessage }, function(err, data) 
      {
        if (err) 
        {
          console.log('Error publishing SNS message: ' + err);
        } 
        else 
        {
          console.log('SNS message sent.');
        }
      });  
    }
  });
};

http.createServer(app).listen(app.get('port'), function()
{
  console.log('Express server listening on port ' + app.get('port'));
});
