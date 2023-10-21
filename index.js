'use strict';

const refs = {
    form: document.querySelector("form"),
    addInput: document.querySelector(".add-input"),
    weatherList: document.querySelector(".weather-list"),
    calculate: document.querySelector(".calculate"),
    countryList: document.querySelector(".country-list"),
}

refs.addInput.addEventListener("click", addInput);
refs.calculate.addEventListener("click", serviceWeather);

function addInput(event) {
    event.preventDefault();
    refs.countryList.insertAdjacentHTML("beforeend", '<li><input name="country" type="text"placeholder="Write county"/></li>')
}

function getValidateNames() {
    const countries = new FormData(refs.form).getAll("country");
    const validateCountries = countries.map(country => country.trim()).filter(country => country !== '');
    return validateCountries;
}

async function serviceWeather(event) {
    event.preventDefault();
    refs.calculate.disabled = true;

    const countries = getValidateNames();

    try {
        const capitals = await getCapitals(countries);
        const weather = await getWeather(capitals);
        markupWeather(weather);
    } catch(error) {
        console.log(error);
    } finally {
        refs.calculate.disabled = false;
    }
}

async function getCapitals(countries) {
    const BASE_URL = "https://restcountries.com/v3.1/name/";
    const responses = countries.map(async (country) => {
        const resp = await axios.get(`${BASE_URL}${country}`);
        return resp.data;
    })

    const data = await Promise.allSettled(responses);
    return data.filter(({ status }) => status === "fulfilled").map(({ value }) => value[0].capital[0]);
}

async function getWeather(capitals) {
    const BASE_URL = "http://api.weatherapi.com/v1/"
    const API_KEY = "eae6da24d59f49d5b1e140429232110";
    const END_POINT = "current.json?"
    const responses = capitals.map(async (capital) => {
        const resp = await axios.get(`${BASE_URL}${END_POINT}key=${API_KEY}&q=${capital}&lang=uk`);
        return resp.data;
    })

    const data = await Promise.allSettled(responses);
    return data.filter(({ status }) => status === 'fulfilled').map(({ value: { current, location }}) => {
        const { country, name } = location;
        const { temp_c, condition: { text, icon } } = current;

        return { country, name, text, temp_c, icon };
    });
}

function markupWeather(weather) {
    refs.weatherList.innerHTML = '';
    
    weather.forEach(element => {
        const markup = `
        <li>
            <h2>Місце: ${element.country}, ${element.name}</h2>
            <h3>${element.text}</h3>
            <p>${element.temp_c}</p>
            <img src="${element.icon}">
        </li>`

        refs.weatherList.insertAdjacentHTML("beforeend", markup);
    });
}