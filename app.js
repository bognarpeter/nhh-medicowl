'use strict';

const url = require("url");
const trimEnd = require("lodash.trimend");
const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
var rp = require('request-promise');
const fs = require("fs");

const PORT = 8080
const APP = {
  appId: "5ho7sgFxsWJxXG2Nwh5AMNIWOlvMv3VO",
  contractId: "fJI8P5Z4cIhP3HawlXVvxWBrbyj5QkTF",
  key: fs.readFileSync("fJI8P5Z4cIhP3HawlXVvxWBrbyj5QkTF.key")
};

const appId = "a509ae41";
const appKey = "07c1cc5bdbcbc2514201dd37ac85aae8";

//TODO: use NLP api either Google's or theysay.io
const Sentiments = ["love", "hate", "cool", "excellent", "like", "angry", "neutral", "wonderful", "dislike"];

const getBasePath = (req) => url.format({
  protocol: req.protocol,
  host: req.headers.host,
  pathname: trimEnd(req.originalUrl, "/"),
});

var logger = function(status, msg){
    var dt = new Date();
    console.log('['+dt+']['+status+'] '+msg);
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

const { establishSession, getWebURL, getDataForSession, getAppURL } = require("@digime/digime-js-sdk");

function initialize () {
  let app = express();
  var allSymptoms = [];
  var diseases = [];


  // View Engine
  app.set('views', path.join(__dirname, 'views'));
  app.engine('hbs', hbs({extname:'hbs', defaultLayout:'layout'}));
  app.set('view engine', 'hbs');

  // BodyParser Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Set Static Folder
  app.use(express.static('public'));

  // Express Session
  app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
  }));

  // Express Validator
  app.use(expressValidator({
    errorFormatter:(param, msg, value) => {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
  }));

  // Connect Flash
  app.use(flash());

  // Global Vars
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

  app.use((err, req, res, next) => {
    res.status(500).send(err);
  });


  //Routes
  app.get('/', (req, res) => {

    establishSession(APP.appId, APP.contractId).then((session) => {

      const appurl = getAppURL(
        APP.appId,
        session,
        `${getBasePath(req)}/overview?sessionId=${session.sessionKey}`
      );
      console.log(appurl);

      // Present the generated URL with a pretty template
      res.render('index', {appurl: appurl});
    }).catch((err) => console.log(err));
  });

  app.get("/home", (req, res) => {
    var results = [];
    const result = req.query.result;

    if (result !== "DATA_READY") {
      res.render('error');
      return;
    }

    const data = getDataForSession(
      req.query.sessionId, // Our Session ID that we retrieved from the URL
      APP.key, // The private key we setup above
      (fileInfo) => {
        //debug
        // console.log("Descriptor:\n", JSON.stringify(fileInfo.fileDescriptor, null, 2));
        // console.log("Content:\n", JSON.stringify(fileInfo.fileData, null, 2));
        var descriptor = fileInfo.fileDescriptor;
        var data = fileInfo.fileData;

        if(descriptor.serviceGroup === "health fitness"){
          results.push(JSON.stringify(data, null, 2));
        }
      },
      ({fileName, error}) => {
        console.log("============================================================================");
        console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
        console.log("============================================================================");
      },
    );

    data.then(() => {
      res.render('home', {results: results});
    }).catch((err) => {
      console.log("Error happened while fetching: " + err.toString());
    });
  });


  var mode = function(array)
    {
        if(array.length == 0)
            return null;
        var modeMap = {};
        var maxEl = array[0], maxCount = 1;
        for(var i = 0; i < array.length; i++)
        {
            var el = array[i];
            if(modeMap[el] == null)
                modeMap[el] = 1;
            else
                modeMap[el]++;
            if(modeMap[el] > maxCount)
            {
                maxEl = el;
                maxCount = modeMap[el];
            }
        }
        return maxEl;
    };



  app.get("/overview", (req, res) => {

      var text = [];
      const result = req.query.result;

      if (result !== "DATA_READY") {
          res.render('error');
          return;
      }

      const data = getDataForSession(
          req.query.sessionId, // Our Session ID that we retrieved from the URL
          APP.key, // The private key we setup above
          (fileInfo) => {
              //debug
              // console.log("Descriptor:\n", JSON.stringify(fileInfo.fileDescriptor, null, 2));
              // console.log("Content:\n", JSON.stringify(fileInfo.fileData, null, 2));
              var descriptor = fileInfo.fileDescriptor;
              var fileData = fileInfo.fileData;

              if(descriptor.serviceName === "twitter"){
                  fileData.map((doc) => {
                      doc.text === undefined ? "" : doc.text.split(' ')
                          .map((w) => {if (yourArray.indexOf("someString") > -1){
                              // {text.push(w)}});

                          }else{

                          }
                  })
          },
          ({fileName, error}) => {
              console.log("============================================================================");
              console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
              console.log("============================================================================");
          },
      );

      data.then(() => {
          var modetext = mode(text);
          console.log(modetext);
          res.render('overview', {modetext: modetext});
      }).catch((err) => {
          console.log("Error happened while fetching: " + err.toString());
      });
  });

  app.post("/overview", (req, res) => {
    var diseases = [];
    var symptomsText = req.body.symptomDescription;
    var optionsInit = {
      method: 'POST',
      uri: 'https://api.infermedica.com/v2/parse',
      headers: {
        "App-Id": appId,
        "App-Key": appKey,
        "Content-Type": 'application/json'
      },
      body: {
        text: symptomsText
      },
      json: true
    };

    rp(optionsInit)
    .then((parsedBody) => {
      var symptomsRaw = parsedBody.mentions;
      var symptomNames = symptomsRaw.map((d) => {
          return d.name;
      });
      var symptoms = symptomsRaw.map((d) => {
        return {
          id: d.id,
          choice_id: d.choice_id,
          initial: true
        };
      });
      allSymptoms = allSymptoms.concat(symptomNames);
      return rp({
        method: 'POST',
        uri: 'https://api.infermedica.com/v2/diagnosis',
        headers: {
          "App-Id": appId,
          "App-Key": appKey,
          "Content-Type": 'application/json'
        },
        body: {
          sex: "female",
          age: 25,
          evidence: symptoms,
          extras: {}
        },
        json: true
      });

    }).then((parsedBody) => {
      var parsedBodyString = JSON.stringify(parsedBody.conditions, null, 2);
      console.log(parsedBodyString);
      parsedBody.conditions.map(function(d){
        diseases.push(JSON.stringify({name: d.name, probability: d.probability},null, 2));
      });
      if(diseases.length == 0){
        res.render('overview', {diseases: diseases, symptoms: allSymptoms});
      } else {
        var illness = JSON.parse(diseases[0]).name;
        console.log(illness);
        res.render('overview', {diseases: diseases, symptoms: allSymptoms, illness: illness});
      }
      // console.log(diseases);
      // console.log(typeof diseases);
      // console.log(JSON.stringify(diseases));
      // console.log(diseases.toString());

    })
    .catch(function (err) {
      console.log(err);
    });
  });

  app.get("/history", (req, res) => {
    res.render('history');
  });

  app.get("/contacts", (req, res) => {
    res.render('contacts');
  });

  app.listen(PORT, (err) => {
    if(err){
      console.log(`Fail: ${err}`);
    }
    console.log(`Server is running.\nListening on port ${PORT}...`);
  });
};

initialize();
