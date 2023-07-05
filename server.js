require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const fetchWeatherData = async (city, unit, res) => {
  try {
    const apiKey = process.env.openweather_api;

    const cityURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;

    const weatherData = await axios.get(url).then((response) => {
      return response;
    });
    const temp = Math.floor(weatherData.data.main.temp);
    const windSpeed = Math.floor(weatherData.data.wind.speed);
    const humidity = weatherData.data.main.humidity;
    const tempMax = Math.floor(weatherData.data.main.temp_max);
    const tempMin = Math.floor(weatherData.data.main.temp_min);
    const iconId = weatherData.data.weather[0].icon;
    const cityName = weatherData.data.name;

    const locationData = await axios.get(cityURL).then((response) => {
      return response;
    });
    const lat = locationData.data[0].lat;
    const lon = locationData.data[0].lon;
    const pollutionURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&`;

    const pollutionData = await axios.get(pollutionURL).then((response) => {
      return response;
    });
    const aqi = pollutionData.data.list[0].main.aqi;
    let pollutionInfo = "";
    if (aqi == 1) {
      pollutionInfo = "Good";
    } else if (aqi == 2) {
      pollutionInfo = "Fair";
    } else if (aqi == 3) {
      pollutionInfo = "Moderate";
    } else if (aqi == 4) {
      pollutionInfo = "Poor";
    } else if (aqi == 5) {
      pollutionInfo = "Very Poor";
    }

    const forecastData = await axios.get(forecastURL).then((response) => {
      return response;
    });
    let tempArr = [];
    let iconArr = [];
    let dateArr = [];
    let monthArr = [];
    const len = forecastData.data.list.length;
    for (let i = 0; i < len; i++) {
      if (
        forecastData.data.list[i].dt_txt.split(" ")[1].split(":")[0] == "12"
      ) {
        tempArr.push(forecastData.data.list[i].main.temp);
        iconArr.push(forecastData.data.list[i].weather[0].icon);
        dateArr.push(
          forecastData.data.list[i].dt_txt.split(" ")[0].split("-")[2]
        );
        monthArr.push(
          forecastData.data.list[i].dt_txt.split(" ")[0].split("-")[1]
        );
      }
    }

    let displayUnit = "";

    if (unit == "metric") {
      displayUnit = "C";
    } else {
      displayUnit = "F";
    }

    res.render("index", {
      lat: lat,
      lon: lon,
      displayUnit: displayUnit,
      monthArr: monthArr,
      tempArr: tempArr,
      iconArr: iconArr,
      dateArr: dateArr,
      aqi: pollutionInfo,
      temp: temp,
      windSpeed: windSpeed,
      humidity: humidity,
      tempMax: tempMax,
      tempMin: tempMin,
      iconId: iconId,
      cityName: cityName,
    });
  } catch (err) {
    const message = err.response.data.message;
    if (message == "city not found" || city == "") {
      res.render("pageNotFound", {
        message: "The entered location is not valid !!",
      });
    } else {
      res.render("pageNotFound", {
        message: "Unknown error occurred!!",
      });
    }
  }
};

app.get("/", (req, res) => {
  fetchWeatherData("London", "metric", res);
});

app.get("*", (req, res) => {
  res.render("pageNotFound", { message: "Page not found" });
});

app.post("/", (req, res) => {
  const location = req.body.city;
  let tempUnit = "metric";
  fetchWeatherData(location, tempUnit, res);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
