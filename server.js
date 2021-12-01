var express = require('express');
var app = express();
var cors = require('cors');
var AWS = require("aws-sdk");
AWS.config.update({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
});

const PAGE_LIMIT = 10;

var docClient = new AWS.DynamoDB.DocumentClient();
// This responds with "Hello World" on the homepage
var allowlist = ["http://localhost:4200"];
var methods = ('GET,POST,PUT,DELETE')
var corsOptions = {
    origin: allowlist,
    methods: methods
}
app.get('/', cors(corsOptions), function (req, res) {
    console.log('got a root get request');
    res.send('hello world');
});

app.get("/movies", cors(corsOptions), function (req, res) {
  console.log("Got a GET request for movies endpoint");
  console.log('req.query is ', req.query, ' req.params is ', req.params);
  var params = {
    TableName: "Movies",
    Limit: PAGE_LIMIT,
  };
  if (req.query.startKeyTitle !== undefined) {
    params.ExclusiveStartKey = {
      title: req.query.startKeyTitle,
      year: parseInt(req.query.startKeyYear)
    }
  }
  if (req.query.year) {
    var yearSearch = parseInt(req.query.year);
    params.ExpressionAttributeNames = { "#y": "year"}
    params.KeyConditionExpression = '#y = :s';
    params.ExpressionAttributeValues =  { ':s': yearSearch }
  } else {
    params.ExpressionAttributeNames = { "#y": "year" };
    params.KeyConditionExpression = "#y = :s";
    params.ExpressionAttributeValues = { ":s": 1940 };
  }
  console.log('going to scan, params is ', params);
  // TODO: Query is not guaranteed to bring back all 20 records
  docClient.query(params, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res.status(500).json({ error: err.message });
    } else {
      console.log("Query succeeded.");
      resObject = {
          Items: data.Items,
          Count: data.Count
      }
      if (data.LastEvaluatedKey !== undefined) {
        resObject.LastEvaluatedKey = data.LastEvaluatedKey
      }
      res.send(resObject);
    }
  });
});

app.get("/movies/:year", cors(corsOptions), function (req, res) {
  console.log("Got a GET request for movies endpoint");

  console.log("request param", req.params.year);
  var yearValue = parseInt(req.params.year);
  var params = {
    TableName: "Movies",
    KeyConditionExpression: "#yr = :yyyy",
    ExpressionAttributeNames: {
      "#yr": "year",
    },
    ExpressionAttributeValues: {
      ":yyyy": yearValue,
    },
  };
  docClient.query(params, function (err, data) {
    if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res.status(500).json({ error: "message" });
    } else {
      console.log("Query succeeded.");
      data.Items.forEach(function (item) {
        console.log(" -", item.year + ": " + item.title);
      });
      res.send(data.Items);
    }
  });
});

// This responds a POST request for the homepage
app.post("/movies", cors(corsOptions), function (req, res) {
  console.log("Got a POST request for the homepage");
  console.log("body:", req.body);
  createMovie(req.body);
  res.send("Hello POST");
});

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Tiger dynamoDB server listening at http://%s:%s", host, port)
})

function createMovie(body) {
    console.log('received post request, body is ', body);
}