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
const fs = require("fs");


const PORT = 8080
const APP = {
    appId: "5ho7sgFxsWJxXG2Nwh5AMNIWOlvMv3VO",
    contractId: "NwkLC6cRnxeQ0PSRmysngE0eLSS2NiWr",
    key: fs.readFileSync("NwkLC6cRnxeQ0PSRmysngE0eLSS2NiWr.key")
};

const getBasePath = (req) => url.format({
    protocol: req.protocol,
    host: req.headers.host,
    pathname: trimEnd(req.originalUrl, "/"),
});

const { establishSession, getWebURL, getDataForSession, getAppURL } = require("@digime/digime-js-sdk");

function initialize () {
    let app = express();

    // View Engine
    app.set('views', path.join(__dirname, 'views'));
    app.engine('hbs', hbs({extname:'hbs', defaultLayout:'layout'}));
    app.set('view engine', 'hbs');

    // BodyParser Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

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
                `${getBasePath(req)}/home?sessionId=${session.sessionKey}`
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

                if(descriptor.serviceGroup === "medical"){
                    results.push(data);
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


    app.listen(PORT, (err) => {
        if(err){
            console.log(`Fail: ${err}`);
        }
        console.log(`Server is running.\nListening on port ${PORT}...`);
    });
};

initialize();
