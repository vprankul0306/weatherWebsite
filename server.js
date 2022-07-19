require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { json } = require("body-parser");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//weather api: https://api.openweathermap.org/data/2.5/weather?q={cityName}&units=metric&appid=env.WEATHER_API

const fetchWeatherData = (city, res) => {
  let location = city;
  const apiKey = process.env.WEATHER_API;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;
  https.get(url, function (response) {
    if (response.statusCode === 200) {
      response.on("data", function (data) {
        const json = JSON.parse(data);
        const temp = Math.floor(json.main.temp);
        const windSpeed = Math.floor(json.wind.speed);
        const humidity = json.main.humidity;
        const tempMax = Math.floor(json.main.temp_max);
        const tempMin = Math.floor(json.main.temp_min);
        const city = json.name;
        res.render("index", {
          temp: temp,
          windSpeed: windSpeed,
          humidity: humidity,
          tempMax: tempMax,
          tempMin: tempMin,
          location: city,
        });
      });
    } else {
      res.render("pageNotFound");
    }
  });
};

app.get("/", (req, res) => {
  fetchWeatherData("London", res);
});

app.post("/", (req, res) => {
  const location = req.body.city;
  fetchWeatherData(location, res);
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
