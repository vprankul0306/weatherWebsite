require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { json } = require("body-parser");
const { get } = require("http");
const { log } = require("console");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//weather api: https://api.openweathermap.org/data/2.5/weather?q={cityName}&units=metric&appid=env.WEATHER_API

const fetchWeatherData = (city, res) => {
  const apiKey = "b07ee1e13cd777a1e35035134490d1fa";

  const cityURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  https.get(url, function (response) {
    if (response.statusCode === 200) {
      response.on("data", function (data) {
        const json = JSON.parse(data);
        const temp = Math.floor(json.main.temp);
        const windSpeed = Math.floor(json.wind.speed);
        const humidity = json.main.humidity;
        const tempMax = Math.floor(json.main.temp_max);
        const tempMin = Math.floor(json.main.temp_min);
        const iconId = json.weather[0].icon;
        const city = json.name;

        https.get(cityURL, (response) => {
          response.on("data", (data) => {
            const json = JSON.parse(data);
            const lat = json[0].lat;
            const lon = json[0].lon;

            const pollutionURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

            https.get(pollutionURL, (resp) => {
              resp.on("data", (data) => {
                const js = JSON.parse(data);
                const aqi = js.list[0].main.aqi;
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

                const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&`;

                https.get(forecastURL, (r) => {
                  r.on("data", (data) => {
                    const jsonData = JSON.parse(data);
                    const len = jsonData.list.length;
                    let tempArr = [];
                    let iconArr = [];
                    let dateArr = [];
                    let monthArr = [];
                    for (let i = 0; i < len; i++) {
                      if (
                        jsonData.list[i].dt_txt.split(" ")[1].split(":")[0] ==
                        "12"
                      ) {
                        tempArr.push(jsonData.list[i].main.temp);
                        iconArr.push(jsonData.list[i].weather[0].icon);
                        dateArr.push(
                          jsonData.list[i].dt_txt.split(" ")[0].split("-")[2]
                        );
                        monthArr.push(
                          jsonData.list[i].dt_txt.split(" ")[0].split("-")[1]
                        );
                      }
                    }

                    res.render("index", {
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
                      cityName: city,
                    });
                  });
                });
              });
            });
          });
        });
      });
    } else {
      response.on("data", function (data) {
        const json = JSON.parse(data);
        const message = json.message;
        if (message == "city not found" || city == "") {
          res.render("pageNotFound", {
            message: "The entered location is not valid !!",
          });
        } else {
          res.render("pageNotFound", {
            message: "Unknown error occurred!!",
          });
        }
      });
    }
  });
};

app.get("/", (req, res) => {
  fetchWeatherData("London", res);
});

app.get("*", (req, res) => {
  res.render("pageNotFound", { message: "Page not found" });
});

app.post("/", (req, res) => {
  const location = req.body.city;
  fetchWeatherData(location, res);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
