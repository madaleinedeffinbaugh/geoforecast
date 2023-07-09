"use strict";

//START IIFE
(function () {

    //making dates for the forecast
    let today = new Date()

    let tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let thirdDay = new Date(today)
    thirdDay.setDate(thirdDay.getDate() + 2)

    let fourthDay = new Date(today)
    fourthDay.setDate(fourthDay.getDate() + 3)

    let fifthDay = new Date(today)
    fifthDay.setDate(fifthDay.getDate() + 4)


    //variables to hold date objects containing information from open weather api
    let todayForecast;
    let tomorrowsForecast;
    let thirdDayForecast;
    let fourthDayForecast;
    let fifthDayForecast;


    //calling forecast weather on my hometown first
    currentWeather(-116.444975, 43.484744);
    forecastWeather(-116.444975, 43.484744);

    //creating map
    mapboxgl.accessToken = MAPBOX_KEY;
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/madaleinedeffinbaugh/clh83tlok00ba01oh7vos9y2u',
        center: [-116.444975, 43.484744],
        zoom: 12
    });

    //disable double click on zoom so that double click can be used to place marker
    map.doubleClickZoom.disable();

    //global marker so that there's only one at a time
    let marker;

    //placing initial marker
    placeMarkerGeocode('Kuna, Idaho', MAPBOX_KEY, map);
    geocode('Kuna, Idaho', MAPBOX_KEY).then(function (coordinates) {
        map.setCenter(coordinates);
    });


    map.on('dblclick', (e) => {
        //change marker on double click and update weather
        marker.remove();
        let lonLat = [e.lngLat.lng, e.lngLat.lat];
        placeMarkerCoordinates(lonLat, MAPBOX_KEY, map);
        currentWeather(e.lngLat.lng, e.lngLat.lat)
        forecastWeather(e.lngLat.lng, e.lngLat.lat);
    });

    $('#search').keyup(function (e) {
        //change marker location on search and update weather
        if (e.key === "Enter") {
            let address = $(this).val();
            geocode(address, MAPBOX_KEY).then(function (result) {
                currentWeather(result[0], result[1]);
                forecastWeather(result[0], result[1]);
            });
            marker.remove();
            placeMarkerGeocode(address, MAPBOX_KEY, map);
        }
    })

    $('#slider').click(function () {
        //this event switches the red and purple theme
        if ($('body').hasClass('body-bg-red')) {
            map.setStyle("mapbox://styles/madaleinedeffinbaugh/clh83tlok00ba01oh7vos9y2u");
            $('body').removeClass('body-bg-red').addClass('body-bg-purple');
            $('#search').removeClass('search-red').addClass('search-purple');
            $('#header').removeClass('header-red').addClass('header-purple');
            $('.three-hour').removeClass('red-weather').addClass('purple-weather');
        } else {
            map.setStyle("mapbox://styles/madaleinedeffinbaugh/clh830ofy00az01r5d24whnuy");
            $('body').removeClass('body-bg-purple').addClass('body-bg-red');
            $('#search').removeClass('search-purple').addClass('search-red');
            $('#header').removeClass('header-purple').addClass('header-red');
            $('.three-hour').removeClass('purple-weather').addClass('purple-weather');
        }
    })


    //************* MAP FUNCTIONS *****************//
    function placeMarkerGeocode(info, token, map) {
        //function to place a marker using geocode
        geocode(info, token).then(function (coordinates) {
            marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .addTo(map)
            map.flyTo({center: coordinates});
        });
    }

    function placeMarkerCoordinates(longlat, token, map) {
        //function to place a marker using coordinates
        let coordinates = longlat;
        marker = new mapboxgl.Marker()
            .setLngLat(coordinates)
            .addTo(map)
        map.flyTo({center: coordinates});
    }


    //************* API CALL/FORECAST FUNCTIONS *****************//

    function currentWeather(longitude, latitude) {
        //this function is used to generate today's weather
        $.get("http://api.openweathermap.org/data/2.5/weather", {
            APPID: OPEN_WEATHER_KEY,
            lat: latitude,
            lon: longitude,
            units: 'imperial'
        }).done(function (data) {
            console.log(data)
            $('#location').html(`${data.name}`);
            displayAll();

            //creating the forecast for today and appending it to the first card
            todayForecast = createCurrentDayData(data);
            addRegCard(todayForecast, today, "card-one");
        });
    }

    function createCurrentDayData(data) {
        //this function is used to create the date object for today
        // and hold the values from the api call
        return {
            minTemp: data.main.temp_min,
            maxTemp: data.main.temp_max,
            averageTemp: data.main.temp,
            averageDescription: data.weather[0].description,
            averageIcon: data.weather[0].icon,
            averageSpeed: data.wind.speed,
            averagePressure: data.main.pressure,
            averageHumidity: data.main.humidity
        }
    }

    function forecastWeather(longitude, latitude) {
        //this function is used to get the weather forecast for the next four days
        $.get("http://api.openweathermap.org/data/2.5/forecast", {
            APPID: OPEN_WEATHER_KEY,
            lat: latitude,
            lon: longitude,
            units: 'imperial'
        }).done(function (data) {
            console.log(data)
            //creating the date objects, adding and manipulating the data,
            // and then appending it to their respective cards.

            //tomorrow
            tomorrowsForecast = createDayData(data)
            setDayInfo(tomorrowsForecast, convertDate(tomorrow), data);
            addRegCard(tomorrowsForecast, tomorrow, "card-two");

            //third day
            thirdDayForecast = createDayData(data);
            setDayInfo(thirdDayForecast, convertDate(thirdDay), data);
            addRegCard(thirdDayForecast, thirdDay, "card-three");

            //fourth day
            fourthDayForecast = createDayData(data);
            setDayInfo(fourthDayForecast, convertDate(fourthDay), data);
            addRegCard(fourthDayForecast, fourthDay, "card-four");

            //fifth day
            fifthDayForecast = createDayData(data);
            setDayInfo(fifthDayForecast, convertDate(fifthDay), data);
            addRegCard(fifthDayForecast, fifthDay, "card-five");

            //adding the button listeners to the 'regular' cards
            buttonRegListeners();
        });
    }

    function createDayData(data) {
        //this function is used to create and hold information for the other four days.
        return {
            sunrise: data.city.sunrise,
            sunset: data.city.sunset,
            times: [],
            temps: [],
            feelsLike: [],
            description: [],
            icons: [],
            speeds: [],
            pressures: [],
            humiditys: []
        }
    }

    function setDayInfo(day, date, data) {
        //this function is used to iterate through the list of dates given by the
        // api and send the information the respective date object and also calls
        // the manipulate data function in order to generate wanted information
        for (let i = 0; i < data.list.length; i++) {
            if (convertDateFromDateTime(data.list[i].dt) == date) {
                let dateTxt = data.list[i].dt_txt
                day.times.push(dateTxt.slice(11, 19));
                day.temps.push(data.list[i].main.temp);
                day.feelsLike.push(data.list[i].main.feels_like);
                day.description.push(data.list[i].weather[0].description);
                day.speeds.push(data.list[i].wind.speed);
                day.pressures.push(data.list[i].main.pressure);
                day.humiditys.push(data.list[i].main.humidity);
                day.icons.push(data.list[i].weather[0].icon);
            }
        }
        manipulateData(day);
    }

    function manipulateData(day) {
        //this function is used to get the averages of all 8 forecasts given
        // each day for an overall more accurate predication for the day rather
        // than just picking one of the 8 items per day at random
        day.averageTemp = getAverage(day.temps);
        day.minTemp = Math.min.apply(null, day.temps);
        day.maxTemp = Math.max.apply(null, day.temps);
        day.averageFeelsLike = getAverage(day.feelsLike);
        day.averageDescription = mostFrequent(day.description);
        day.averageSpeed = getAverage(day.speeds);
        day.averagePressure = getAverage(day.pressures);
        day.averageHumidity = getAverage(day.humiditys)
        day.averageIcon = day.icons[day.description.indexOf(day.averageDescription)];
    }

    function getAverage(arr) {
        //this function iterates through a given array and returns the average
        let sum = 0;
        arr.forEach(function (element) {
            sum += element;
        })
        let average = sum / arr.length;
        return average;
    }

    function mostFrequent(arr) {
        //this function is used to find the most frequent description
        // of weather that was provided from the 8
        let words = [];
        let count = [];
        for (let i = 0; i < arr.length; i++) {
            if (!words.includes(arr[i])) {
                words.push(arr[i])
                count.push(1)
            } else {
                let countIndex = words.indexOf(arr[i]);
                count[countIndex] += 1;
            }
        }
        let indexOfMostOccured = count.indexOf(Math.max.apply(null, count));
        let mostOccured = words[indexOfMostOccured];
        return mostOccured;
    }


    //************* CONVERSION AND DISPLAY FUNCTIONS *****************//
    function convertDateFromDateTime(dateTime) {
        //this function does as implied, converts date from datetime format into yyyy-mm-dd
        let unix_timestamp = dateTime;
        let date = new Date(unix_timestamp * 1000);
        return date.toISOString().slice(0, 10);
    }

    function convertDate(date) {
        //this function also converts dates into yyyy-mm-dd format but from a
        // date object instead of datetime
        return date.toISOString().slice(0, 10);
    }

    function convertTime(dateTime) {
        //this function converts dateTime into regular time
        let unix_timestamp = dateTime;
        let date = new Date(unix_timestamp * 1000);
        return date.toString().slice(16, 24);
    }


    function displayTime(time) {
        //This function converts 24 hour time into regular 12 hour time
        let headerTime = time.slice(0, 2);
        let endTime = time.slice(3, 5);
        let suffix = headerTime >= 12 ? "P.M." : "A.M.";

        if (headerTime >= 13) {
            let newHeaderTime = headerTime % 12;
            return (`${newHeaderTime}:${endTime} ${suffix}`)
        } else if (headerTime == '00') {
            return (`12:${endTime} ${suffix}`)
        } else {
            return (`${headerTime}:${endTime} ${suffix}`)
        }
    }

    function capitalize(words) {
        //this function is used to capitalize a passed in set of words.
        let separatedWords = words.split(" ");
        let capitalized = [];
        separatedWords.forEach(function (word) {
            let brokenWord = word.split("");
            brokenWord[0] = brokenWord[0].toUpperCase();
            capitalized.push(brokenWord.join(""));
        })
        return capitalized.join(" ");
    }

    function displayAll() {
        //this function is used to reset the cards in the event a new location is picked
        // when the large card is open (aka, when the other cards have a display of none)
        let cards = ['card-one', 'card-two', 'card-three', 'card-four', 'card-five',];
        cards.forEach(function (card) {
            $(`#${card}`).removeClass('d-none')
        })
    }


    //************* HTML CARD FUNCTIONS *****************//
    function addRegCard(day, date, place) {
        //this function is used to add the information provided from the api calls to the html
        //it disables and hides the button for the first card because the current weather call
        //does not provide hourly forecast information, therefore, there is no need for the view
        //more button
        let button = `<button class="btn view-more ${place}">View 3 Hour Forecast</button>`;

        if (place == 'card-one') {
            let button = `<button class="btn view-more ${place}" disabled>View 3 Hour Forecast</button>`
        }

        let regularCardTemplate = `<div class="card">
                <div class="card-header text-center">
                    <h4>${date.toString().slice(0, 10)}</h4>
                </div>
                <div class="card-body">
                    <div class="text-center">
                        <h5 class="m-0 p-0">${capitalize(day.averageDescription)}</h5>
                        <img class="small-icon" src="http://openweathermap.org/img/w/${day.averageIcon}.png" alt="weather-icon">
                        <h5>${day.averageTemp.toFixed(2)}&#8457;</h5>
                        <p class="mb-3 mt-0">${day.minTemp}&#8457; / ${day.maxTemp}&#8457;</p>
                    </div>
                    <div class="my-1 text-center">
                    <p><strong>Humidity: </strong>${day.averageHumidity.toFixed(2)}%</p>
                    <p><strong>Wind: </strong>${day.averageSpeed.toFixed(2)} mph</p>
                    <p><strong>Pressure: </strong>${day.averagePressure.toFixed(0)} hPa</p>
                    </div>
                </div>
               <div class="card-footer p-0 d-flex justify-content-center">
                    ${button}
                </div>
            </div>`

        $(`#${place}`).html(regularCardTemplate);
    }

    function buttonRegListeners() {
        //this function adds event listeners to the regular cards to enable switching to the view more section
        $('button.card-two').click(function () {
            regButtonActions('card-two', tomorrowsForecast, tomorrow);
        });
        $('button.card-three').click(function () {
            regButtonActions('card-three', thirdDayForecast, thirdDay);
        });
        $('button.card-four').click(function () {
            regButtonActions('card-four', fourthDayForecast, fourthDay);
        });
        $('button.card-five').click(function () {
            regButtonActions('card-five', fifthDayForecast, fifthDay);
        })
    }

    function regButtonActions(cardNo, forecastDay, longDate) {
        //this function is what happens when the view more button is selected.
        //the other cards are hidden and the card selected is switched to its
        //larger version
        let cards = ['card-one', 'card-two', 'card-three', 'card-four', 'card-five'];
        let index = cards.indexOf(cardNo);
        if (index !== -1) {
            cards.splice(index, 1);
        }
        cards.forEach(function (card) {
            $(`#${card}`).addClass('d-none');
        });
        $(`#${cardNo}`).html("<div></div>");
        addLargeCard(cardNo, forecastDay, longDate);
        buttonLargeListeners();
    }

    function addLargeCard(place, day, longDate) {
        //this function adds the api information to the cards in the view more section
        let largeCardTemplate = `<div class="card">
                <div class="card-header text-center">
                   <h3> ${longDate.toString().slice(0, 10)}</h3>
                </div>
                <div class="card-body text-center">
                    <div>
                        <p class="m-0"${day.minTemp}&#8457; / ${day.maxTemp}&#8457;</p>
                   <h5 class="m-0">${capitalize(day.averageDescription)}</h5>
                   <img class="medium-icon" src="http://openweathermap.org/img/w/${day.averageIcon}.png" alt="weather-icon">
                   <h5>${day.averageTemp.toFixed(2)}&#8457;</h5>
                    </div>
                    <div class="d-flex flex-wrap justify-content-evenly mt-3 info">
                        <p><strong>Feels Like: </strong>${day.averageFeelsLike.toFixed(2)}&#8457;</p>
                        <p><strong>Humidity: </strong>${day.averageHumidity.toFixed(2)}%</p>
                        <p><strong>Wind: </strong>${day.averageSpeed.toFixed(2)}mph</p>
                        <p><strong>Pressure: </strong>${day.averagePressure} hPa</p>
                    </div>
                    <div class="d-flex flex-wrap justify-content-evenly mt-3 sun py-2">
                        <p><strong>Sunrise: </strong>${displayTime(convertTime(day.sunrise))}</p>
                        <p><strong>Sunset: </strong>${displayTime(convertTime(day.sunset))}</p>
                    </div>
                    <div class="hourly">
                        <div class="row mx-2 d-flex justify-content-center flex-nowrap overflow-auto">
                            ${hourlys(day)}
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-end">
                    <button class="btn view-less ${place}">Return to Main Forecasts</button>
                </div>
            </div>`

        $(`#${place}`).html(largeCardTemplate);
    }

    function hourlys(day) {
        //this function is used to create the 3-hour forecast used in the large card.
        // It's seperated because have this div 8 times in the addLargeCard function
        // would be veeerryy lengthy.
        let html = ``;
        for (let i = 0; i < day.times.length; i++) {
            html += `<div class="col three-hour purple-weather">
                                <div class="p-0">
                                    <h6 class="m-0">${displayTime(day.times[i])}</h6>
                                     <img class="small-icon" src="http://openweathermap.org/img/w/${day.icons[i]}.png" alt="weather-icon">
                                    <p>${capitalize(day.description[i])}</p>
                                    <p>${day.temps[i]}&#8457;</p>
                                </div>
                            </div>`
        }
        return html;
    }

    function buttonLargeListeners() {
        //this function adds the event listeners to the large cards to enable returning to the main screen
        $('button.card-two').click(function () {
            largeButtonActions('card-two', tomorrowsForecast, tomorrow);
        });
        $('button.card-three').click(function () {
            largeButtonActions('card-three', thirdDayForecast, thirdDay);
        });
        $('button.card-four').click(function () {
            largeButtonActions('card-four', fourthDayForecast, fourthDay);
        });
        $('button.card-five').click(function () {
            largeButtonActions('card-five', fifthDayForecast, fifthDay);
        })
    }

    function largeButtonActions(cardNo, forecastDay, longDate) {
        //this function is what happens when the view less button is selected
        //the large card is replaced by its original version and the other cards
        //are restored
        let cards = ['card-one', 'card-two', 'card-three', 'card-four', 'card-five'];
        let index = cards.indexOf(cardNo);
        if (index !== -1) {
            cards.splice(index, 1);
        }
        cards.forEach(function (card) {
            $(`#${card}`).removeClass('d-none');
        });
        $(`#${cardNo}`).html("<div></div>");
        addRegCard(forecastDay, longDate, cardNo);
        buttonRegListeners();
    }


}()); // END IIFE