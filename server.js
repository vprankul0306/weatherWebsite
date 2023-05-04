require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const { json } = require("body-parser");
const { get, request } = require("http");
const { log } = require("console");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json());

mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://admin-prankul:testcase123@cluster0.093b0dl.mongodb.net/weather",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const sessionMiddleware = session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
});
app.use(sessionMiddleware);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  prev_location: String,
});

userSchema.plugin(encrypt, {
  secret: process.env.secret,
  encryptedFields: ["password"],
});

const User = new mongoose.model("User", userSchema);

//weather api: https://api.openweathermap.org/data/2.5/weather?q={cityName}&units=metric&appid=env.WEATHER_API

const fetchWeatherData = (city, unit, res) => {
  const apiKey = "b07ee1e13cd777a1e35035134490d1fa";

  const cityURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;

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
            var lat = json[0].lat;
            var lon = json[0].lon;

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

                const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&`;

                https.get(forecastURL, (r) => {
                  let data = "";
                  r.on("data", (chunk) => {
                    data += chunk;
                  });

                  r.on("end", () => {
                    try {
                      let jsonData = JSON.parse(data);
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
                        cityName: city,
                      });
                    } catch (error) {
                      console.error(error);
                    }
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

app.get("/toggle-temp", function (req, res) {
  let tempUnit = req.cookies.tempUnit || "metric";

  if (tempUnit === "metric") {
    res.cookie("tempUnit", "imperial");
  } else {
    res.cookie("tempUnit", "metric");
  }
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user, err) => {
      if (err) {
        console.log(err);
      } else {
        if (user) {
          if (user.password == password) {
            req.session.user = user;
            res.redirect("/");
          } else {
            res.send("Please enter the correct password");
          }
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const loc = req.body.prev_location;
  let newUser = new User({
    name: name,
    email: email,
    password: password,
    prev_location: "London",
  });
  newUser.save().then((err, result) => {
    console.log(err);
  });
  res.redirect("/login");
});

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  } else {
    const location = req.session.user.prev_location || "London";
    let tempUnit = req.cookies.tempUnit || "metric";
    fetchWeatherData(location, tempUnit, res);
  }
});

app.get("*", (req, res) => {
  res.render("pageNotFound", { message: "Page not found" });
});

app.post("/", (req, res) => {
  const location = req.body.city;
  const email = req.session.user.email;

  User.findOne({ email: email }).then((user, err) => {
    if (err) {
      console.log(err);
    } else {
      user.prev_location = location;
      user.save().then((err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
        }
      });
    }
  });

  let tempUnit = req.cookies.tempUnit || "metric";
  fetchWeatherData(location, tempUnit, res);
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started");
});
