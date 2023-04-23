$(".themechange__btn").on("click", function () {
  $(".full__cover").toggleClass("theme_change");
  $(".description").toggleClass("suggestion__dark");
  $(".card").toggleClass("search__dark");
  $(".nav__contactus").toggleClass("contactus__dark");
  $(".font__color_dark").toggleClass("theme_change_font");
});
$(".dark__search").on("click", function () {
  $(".full__cover").toggleClass("theme_change");
  $(".description").toggleClass("suggestion__dark");
  $(".card").toggleClass("search__dark");
  $(".nav__contactus").toggleClass("contactus__dark");
  $(".font__color_dark").toggleClass("theme_change_font");
});

$(".themechange__btn").on("click", function () {
  if ($(".full__cover").hasClass("theme_change")) {
    $(".themeChangeIcon").removeClass("uil-moon");
    $(".themeChangeIcon").addClass("uil-sun");
  } else {
    $(".themeChangeIcon").removeClass("uil-sun");
    $(".themeChangeIcon").addClass("uil-moon");
  }
});

// function toggleTemp() {
//   var tempToggle = document.getElementById("toggleBtn");
//   var currentTempUnit = tempToggle.innerHTML;

//   if (currentTempUnit === "Celsius") {
//     tempToggle.innerHTML = "Fahrenheit";
//     // Code to switch temperature data from Celsius to Fahrenheit
//   } else {
//     tempToggle.innerHTML = "Celsius";
//     // Code to switch temperature data from Fahrenheit to Celsius
//   }
// }

// hooooooooooooooooooo gyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
