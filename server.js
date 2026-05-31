const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const imie="Martyna";
const nazwisko="Debowczyk";
const data=new Date().toLocaleDateString();
//ustawienie dwoch lokalizacji, krakowa i pragi
const locations = {
    krakow: { country: "Polska", city: "Kraków", lat: 50.0647, lon: 19.9450 },
    praga: { country: "Czechy", city: "Praga", lat: 50.0755, lon: 14.4378 },
};
//metoda get dla strony wyswietlajacej formularz w ktorym wybiera sie lokalizacje
app.get('/', (req, res) => {
    const options = Object.entries(locations)
        .map(([key, loc]) => `<option value="${key}">${loc.country}, ${loc.city}</option>`)
        .join('');

    //wysylanie wybranej lokalizacji 
    res.send(`
    <h2>Wybierz lokalizację</h2>
    <form action="/weather">
      <select name="city">
        ${options}
      </select>
      <button type="submit">Pokaż pogodę</button>
    </form>
  `);
});

app.get('/weather', async (req, res) => {
    const loc = locations[req.query.city];

    if (!loc) {
        return res.send('Nieprawidłowy wybór');
    }

    try {
        //darmowe api do pobrania pogody w wybranym miejscu
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current_weather=true`
        );

        const data = await response.json();

        res.send(`
      <h1>${loc.city}, ${loc.country}</h1>
      <p>Temperatura: ${data.current_weather.temperature}°C</p>
      <p>Wiatr: ${data.current_weather.windspeed} km/h</p>
      <a href="/">Powrót</a>
    `);

    } catch {
        res.send('Błąd pobierania pogody');
    }
});

app.listen(port, () => {
    console.log(`Autor aplikacji: ${imie} ${nazwisko}`);
    console.log(`Data uruchomienia: ${data}`);
    console.log(`Aplikacja działa na porcie ${port}`);
});