var appId = "07a96fec5d332a2798fa83aba696d9f2";
var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", 
"Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
var ring = ["main", "day1", "day2", "day3", "day4", "day5", "day6"];
var hex = ["#0000ff", "#0040ff", "#0080ff", "#00bfff", "#00ffff", "#00ffbf",
"#00ff80", "#00ff00", "#ffbf00", "#ff8000", "#ff0000"];
var mid = ["day0", "left", "right"];
var obj = null, posX = 0, posY = 0, divX = 0, divY = 0;

function forecastLoc(city) {
  var url = "http://api.openweathermap.org/data/2.5/forecast/daily?" +
  "q=" + city +
  "&cnt=7&units=imperial" +
  "&appid=" + appId;
  sendRequest(url);
}

function forecastCoord(lat, lon) {
  var url = "http://api.openweathermap.org/data/2.5/forecast/daily?" +
  "lat=" + lat +
  "&lon=" + lon +
  "&cnt=7&units=imperial" +
  "&appid=" + appId;
  sendRequest(url);
}

function sendRequest(url) {
  var xmlhttp = new XMLHttpRequest();
  
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var data = JSON.parse(xmlhttp.responseText);
      update(data);
    }
  };
  
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}

function edit(id, info) { document.getElementById(id).innerHTML = info; }

function setDay(id, add) { document.getElementById(id).innerHTML = week[new Date().getDay() + add]; }

function click(div) { obj = div; divX = posX - obj.offsetLeft; divY = posY - obj.offsetTop; }

function drag(div) {
  posX = document.getElementById ? window.event.clientX : div.pageX;
  posY = document.getElementById ? window.event.clientY : div.pageY;
  if (obj !== null) { obj.style.left = (posX - divX) + 'px'; obj.style.top = (posY - divY) + 'px'; }
}

// tempFade provides visual appeal as opposed to a static page
function tempFade(temp, id) {
  var shape = document.getElementById(id);
  
  // provides color recognition for temperature besides plain text
  // each color represents a temperature in 10F degree increments
  for (var i = 1; i < hex.length; i++) {
    if (temp > i * 10) { shape.style.borderColor = hex[i]; }
    else if (temp <= 10) { shape.style.borderColor = hex[0]; }
  }

  document.getElementById(id).style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  for (var i = 0; i < mid.length; i++) { document.getElementById(mid[i]).style.borderColor = "#000000"; }
  for (var i = 1; i < mid.length; i++) { document.getElementById(mid[i]).style.backgroundColor = "#000000"; }

  (function fade() {
    shape.style.opacity =+ shape.style.opacity + 0.03;
    if (shape.style.opacity < 1) { requestAnimationFrame(fade); }
  })();
}

// update passes api information through functions to the display page
function update(data) {
  
  function doc(id) { return document.getElementById(id); }
  
  for (var i = 0; i < 7; i++) { 
    if (i === 0) { edit("icon" + i, '<img src="imgs/' + data.list[i].weather[0].icon + '.png" height="160">'); } 
    else { edit("icon" + i, '<img src="imgs/' + data.list[i].weather[0].icon + '.png" height="90">'); }
    doc(ring[i]).onmousedown = function() { click(this); return false; }
    doc(ring[i]).onmousemove = drag;
    doc(ring[i]).onmouseup = function() { obj = null; };
    edit("max" + i, Math.round(data.list[i].temp.max) + "&deg;");
    edit("min" + i, " | " + Math.round(data.list[i].temp.min) + "&deg;");
    tempFade(data.list[i].temp.max, ring[i]);
    setDay("date" + i, i);
  }

  edit("refresh", '<span id="refresh" onClick="window.location.reload()">Search Again?</span>');
  edit("humidity", data.list[0].humidity + "%");
  edit("wind", Math.round(data.list[0].speed * 10) / 10);
  edit("loc", data.city.name + ",&nbsp;");
  edit("country", data.city.country);
  edit("drop", '<img src="imgs/hmd.png" height="50">');
  edit("gust", '<img src="imgs/wnd.png" height="50">');
  doc("box").style.pointerEvents = "none";
  doc("box").style.opacity = 1;
  
  (function fadeOut() {
    if ((doc("box").style.opacity -= 0.05) < 0) { doc("box").style.display = "none"; }
    else { requestAnimationFrame(fadeOut); }
  })();
}

function locate(pos) { var crd = pos.coords; forecastCoord(crd.latitude, crd.longitude); } 

function error() { 
  edit("geo", "Geolocation failed. Search by city"); 
  document.getElementById("geo").setAttribute("style", "background-color: transparent; color: white");
}

window.onload = function() {
  
  document.getElementById("geo").onclick = function() { navigator.geolocation.getCurrentPosition(locate, error) };

}
