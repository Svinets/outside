var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", 
  "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var ring = ["main", "day1", "day2", "day3", "day4", "day5", "day6"];
var hex = ["#0000ff", "#0040ff", "#0080ff", "#00bfff", "#00ffff", "#00ffbf",
  "#00ff80", "#00ff00", "#ffbf00", "#ff8000", "#ff0000"];
var choices = ["forecast", "exercise", "restaurant", "movie"];
var mid = ["day0", "mainLeft", "mainRight"];
var weatherData = {}, locale = [], markers = [], map;

function doc(id) { 
  return document.getElementById(id);
}

function edit(id, info) { 
  document.getElementById(id).innerHTML = info; 
}

// data fetcher for apis
function sendRequest(url, handler, obj = 0) {
  var xmlhttp = new XMLHttpRequest();
  
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var data = JSON.parse(xmlhttp.responseText);
      handler(data);
      for (var prop in data) {
        obj[prop] = data[prop];
      }
    }
  };
  
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

// finds city of corresponding zip code
function forecastZip(zip) {
  var url = "https://www.zipcodeapi.com/rest/" +
    "V3Qvcl5UUl3fn4a7gwj06W5sGhUzFgXAjN6v9bq3xtjUyt2OZmP6iUzYbtyQJvq2/info.json/" +
    zip + "/degrees";

  sendRequest(url, function(data) {
    forecastLoc(data.city + " " + data.state);
  });
}

// finds weather info based on city or coords passed in
function forecastLoc(city) {
  var url = "http://api.openweathermap.org/data/2.5/forecast/daily?" +
    "q=" + city +
    "&cnt=7&units=imperial" +
    "&appid=07a96fec5d332a2798fa83aba696d9f2";
  
  sendRequest(url, function(data) {
    if (data.cod === "404") {
      edit("error", "Location not found, search again");
    } else {
      fadeOut("box");
      fadeIn("back");
      locale.push(data.city.name, " " + data.city.country);
      edit("refresh", '<span id="refresh" onClick="window.location.reload()">Search Again?</span>');
      edit("humidity", data.list[0].humidity + "%");
      edit("wind", Math.round(data.list[0].speed * 10) / 10);
      edit("loc", data.city.name + ",&nbsp;");
      edit("country", data.city.country);
      edit("drop", '<img src="imgs/hmd.png" height="50">');
      edit("gust", '<img src="imgs/wnd.png" height="50">');
      doc("box").style.pointerEvents = "none";
      doc("box").style.opacity = 1;
      addDay(0, data);

      choices.forEach(fadeIn);
    }
  }, weatherData);
}

function cityToCoord(type, radius, movie) {
  var url = "http://nominatim.openstreetmap.org/search.php?" +
    "q=" + locale[0] + locale[1] +
    "&limit=1&format=json";
  
  sendRequest(url, function(data) {
    setTimeout(function() {
      search(data[0].lat, data[0].lon, type, radius, movie);
    }, 1000);
    
    locale.push(data[0].lat, data[0].lon);
    createMap(Number(locale[2]), Number(locale[3]));
  });
}

// uses google places to fetch a list of locations
function search(lat, lon, type, radius, movie) {
  var url = "https://maps.googleapis.com/maps/api/place/search/json?" +
    "location=" + lat +
    "," + lon +
    "&radius=" + radius +
    "&types=" + type +
    "&key=AIzaSyAEe16vB_ubDz7tbXPJCRXQpbg4yscbdrQ";
  
  sendRequest(url, function(data) {
    var target = document.getElementsByClassName("store");
    var list = [], loc = [];

    if (data.status === "ZERO_RESULTS") { 
      edit("results", "<span style='font-size: 30px;'>No Results Found</span>" +
      "<img style='position: absolute; width: 25%; bottom: 0; left: 0;' src='imgs/sadpug.png'>");
    } else {
      edit("results", "<span style='font-size: 30px;'>Search Results</span>");
      for (var i = 0; i < data.results.length; i++) {
        loc.push(data.results[i].name, data.results[i].geometry.location.lat,
          data.results[i].geometry.location.lng, data.results[i].vicinity);
        list.push("<span class='store'>" + (i + 1) + ". " + data.results[i].name + "</span><br>");
      }
      edit("stores", list.join(" "));
    }
    
    fadeOut("main");
    fadeIn("search");
        
    for (var i = 0; i < target.length; i++) {
      target[i].addEventListener("click", function() {
        var place = this.innerHTML.slice(3, this.innerHTML.length).replace("&amp;", "&");
        var index = loc.indexOf(place);
        
        if (this.innerHTML.charAt(1) === ".") {
          panMap(loc[index + 1], loc[index + 2], loc[index + 3], place);
        } else {
          place = this.innerHTML.slice(4, this.innerHTML.length).replace("&amp;", "&");
          index = loc.indexOf(place);
          panMap(loc[index + 1], loc[index + 2], loc[index + 3], place);
        }
        
        if (movie) {
          showtimes(loc[index + 1], loc[index + 2]);
          fadeOut("stores");
          fadeOut("results");
        }
      });
    }
  });
}

// if the BORED button is pressed, adds the ability to search for theater lineup (US and Canada)
function showtimes(lat, lng) {
  var url = "http://data.tmsapi.com/v1.1/movies/showings?" +
    "startDate=" + new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate() +
    "&lat=" + lat +
    "&lng=" + lng +
    "&radius=0.1&api_key=asbpcfvx7v6myr6rj3ae5ghy";
  var movies = [], info = [], year = [];

  sendRequest(url, function(data) {
    data.forEach(function(item) {
      if (item.title.indexOf("3D") === -1) {
        movies.push(item);
      }
    });
  });

  setTimeout(function() {
    var target = document.getElementsByClassName("movie");

    if (movies.length === 0) {
      edit("theater", "<span style='font-size: 30px;'>No Results Found</span>" +
      "<img style='position: absolute; width: 25%; bottom: 0; left: 0;' src='imgs/sadpug.png'>");
      fadeIn("theater");
    } else {      
      edit("theater", "<span style='font-size: 30px;'>" + movies[0].showtimes[0].theatre.name + "</span>");
      for (var i = 0; i < movies.length; i++) {
        !!movies[i].releaseYear
          ? year.push(movies[i].title, movies[i].releaseYear)
          : year.push(movies[i].title, undefined);
        info.push("<span class='movie'>" + (i + 1) + ". " + movies[i].title + "</span><br>");
        if (i === 19) { break; }
      }

      edit("showtimes", info.join(" "));
      fadeIn("theater");
      fadeIn("showtimes");
      
      for (var i = 0; i < target.length; i++) {
        target[i].addEventListener("click", function() {
          var movie = this.innerHTML.slice(3, this.innerHTML.length).replace("&amp;", "&");
          var index = year.indexOf(movie);
        
          this.innerHTML.charAt(1) === "."
            ? details(this.innerHTML.slice(3, this.innerHTML.length), year[index + 1])              
            : details(this.innerHTML.slice(4, this.innerHTML.length), year[index + 1]);
        });
      }
    }
  }, 3000);
}

// displays info about individual movies
function details(title, year) {
  var url = "http://www.omdbapi.com/?t=" + title +
  "&y=" + year;

  sendRequest(url, function(data) {
    doc("searchRight").style.backgroundColor = "transparent";
    if (data.Response === "True") {
      edit("searchRight", "<br><div id='poster'><div id='crop'><img style='width: 300px; height: 445px;' src='" +
        data.Poster + "'></div><br>" + data.Title + "<br>MPAA: " + data.Rated + " | IMDB: " + data.imdbRating + 
        "</div><hr>" + data.Plot);
    } else {
      edit("searchRight", "<div class='prompt'>Movie information not found.</span>");
    }
  });
}

// defaults a map to coordinates based on initial location search
function createMap(lat, lng) {
  var mapOptions = {
    center: {lat: lat, lng: lng},
    zoom: 15,
    disableDefaultUI: true
  };

  map = new google.maps.Map(doc("searchRight"), mapOptions);
}

// zooms the map into the coordinates of the specified location
function panMap(lat, lng, loc, place) {
  var latLng = new google.maps.LatLng(lat, lng);
  
  markers.forEach(function(item) {
    item.setMap(null);
  });

  map.panTo(latLng);
  map.setZoom(18);

  var marker = new google.maps.Marker({
    position: latLng,
    map: map
  });

  var infowindow = new google.maps.InfoWindow({
    content: "<span style='color: #000000; font-size: 16px;'>" + place + "<br>" + loc + "</span>"
  });

  google.maps.event.addListener(marker, "click", function() {
     infowindow.open(map,marker);
  });

  infowindow.open(map,marker);
  markers.push(marker);
}

// displays the rest of the week's weather
function addDay(num, obj) {
  num === 0
    ? edit("icon" + num, '<img src="imgs/' + obj.list[num].weather[0].icon + '.png" height="160">')
    : edit("icon" + num, '<img src="imgs/' + obj.list[num].weather[0].icon + '.png" height="90">');
  
  edit("date" + num, week[new Date().getDay() + num]);
  edit("max" + num, Math.round(obj.list[num].temp.max) + "&deg;");
  edit("min" + num, " | " + Math.round(obj.list[num].temp.min) + "&deg;");
  doc(ring[num]).style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  draggable(ring[num]);

  for (var i = 1; i < hex.length; i++) {
    if (obj.list[num].temp.max > i * 10) { 
      doc(ring[num]).style.borderColor = hex[i]; 
    } else if (obj.list[num].temp.max <= 10) { 
      doc(ring[num]).style.borderColor = hex[0]; 
    }
  }

  mid.forEach(function(item) {
    doc(item).style.borderColor = "#000000"; 
  });

  for (var i = 1; i < mid.length; i++) { 
    doc(mid[i]).style.backgroundColor = "#000000";
  }
  
  fadeIn(ring[num]);
}

// makes transitions easier on the eyes
function fadeIn(div) {
  doc(div).style.opacity = 0;

  (function fade() {
    doc(div).style.opacity =+ doc(div).style.opacity + 0.03;
    if (doc(div).style.opacity < 1) {
      requestAnimationFrame(fade);
    }
  })();

  doc(div).style.pointerEvents = "auto";
}

function fadeOut(div){
  doc(div).style.opacity = 1;

  (function fade() {
    (doc(div).style.opacity -= .1) < 0
      ? doc(div).style.display = "none"
      : requestAnimationFrame(fade);
  })();

  doc(div).style.pointerEvents = "none";
}

// allows divs to be moved around (doesn't work on mobile)
function draggable(div) {
  var target = null, posX = 0, posY = 0, divX = 0, divY = 0;

  doc(div).onmousedown = function() {
    target = this;
    divX = posX - target.offsetLeft;
    divY = posY - target.offsetTop;
    return false;
  }
  
  doc(div).onmousemove = function() {
    posX = document.getElementById ? window.event.clientX : div.pageX;
    posY = document.getElementById ? window.event.clientY : div.pageY;
    if (target !== null) {
      target.style.left = (posX - divX) + 'px'; target.style.top = (posY - divY) + 'px';
    }
  };
  
  doc(div).onmouseup = function() {
    target = null;
  }
}

function eventClick(id, func, types, radius, movie) {
  doc(id).addEventListener("click", function() {
    func(types, radius, movie);
  });
}

function eventHover(id, rgb) {
  doc(id).addEventListener("mouseover", function() {  
    doc(id).style.backgroundColor = "rgba(" + rgb + ", 1)";
  });
  doc(id).addEventListener("mouseout", function() {
    doc(id).style.backgroundColor = "rgba(" + rgb + ", 0.8)";
  });
}

window.onload = function() {
  fadeIn("box");

  choices.forEach(function(item) {
    doc(item).addEventListener("click", function() {
      choices.forEach(fadeOut);
    });
  });
  // searches for provided city
  doc("mag").addEventListener("click", function() {

    setTimeout(function() {
      Number(doc("city").value).toString().length === 5
        ? forecastZip(doc("city").value)
        : forecastLoc(doc("city").value);
    }, 300);
  });

  eventClick("forecast", function(obj) {
    for (var i = 1; i < 7; i++) {
      addDay(i, obj);
    }
  }, weatherData);

  eventClick("exercise", cityToCoord, "gym|park", 3000);
  eventClick("restaurant", cityToCoord, "bar|restaurant", 2000);
  eventClick("movie", cityToCoord, "movie_theater", 10000, true);

  eventHover("forecast", "0, 0, 255");
  eventHover("exercise", "255, 255, 0");
  eventHover("restaurant", "255, 0, 0");
  eventHover("movie", "50, 50, 50");
}
