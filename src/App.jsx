// App.jsx
import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const OPENWEATHER_API_KEY = "d7124a74993165ce2b9129c4dd4d38f3";
const LOCATIONIQ_API_KEY = "pk.6d16c00c5ff650e0aa2e2c1fd1997861";

function App() {
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const debounceRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        fetchWeatherByCoords(coords.latitude, coords.longitude);
      });
    }
  }, []);

  const fetchWeather = async (q) => {
    const query = q || city;
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      const fRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const fData = await fRes.json();
      setLoading(false);
      if (data.cod === 200 && fData.cod === "200") {
        setWeather(data);
        setForecast(fData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5));
        setLastUpdated(new Date());
        setCity(query);
        setSuggestions([]);
      } else {
        alert("Location not found");
      }
    } catch {
      setLoading(false);
      alert("Error fetching weather");
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      const fRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const fData = await fRes.json();
      setLoading(false);
      if (data.cod === 200 && fData.cod === "200") {
        setWeather(data);
        setForecast(fData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5));
        setLastUpdated(new Date());
        setCity(data.name);
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchSuggestions = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!q) return setSuggestions([]);
      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(q)}&limit=5&format=json`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setCity(val);
    fetchSuggestions(val);
  };

  const handleSuggestionClick = (place) => {
    setCity(place.display_name);
    setSuggestions([]);
    fetchWeather(place.display_name);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") fetchWeather();
  };

  const getBackgroundClass = () => {
    if (!weather) return "bg-mid";
    const main = weather.weather[0].main;
    switch (main) {
      case "Clear": return "bg-clear";
      case "Clouds": return "bg-clouds";
      case "Rain": return "bg-rain";
      case "Drizzle": return "bg-drizzle";
      case "Thunderstorm": return "bg-thunderstorm";
      case "Snow": return "bg-snow";
      case "Mist":
      case "Haze": return "bg-mist";
      case "Fog": return "bg-fog";
      case "Dust": return "bg-dust";
      case "Smoke": return "bg-smoke";
      case "Sand": return "bg-sand";
      case "Tornado": return "bg-tornado";
      case "Squall": return "bg-squall";
      default: return "bg-mid";
    }
  };

  const getTempColor = (t) => t < 10 ? "text-primary" : t <= 25 ? "text-success" : "text-danger";

  const renderRain = () => Array.from({ length: 40 }).map((_, i) => (
    <div key={`r${i}`} className="raindrop" style={{ left: `${Math.random() * 100}vw`, animationDelay: `${Math.random()}s` }} />
  ));

  const renderSnow = () => Array.from({ length: 25 }).map((_, i) => (
    <div key={`s${i}`} className="snowflake" style={{ left: `${Math.random() * 100}vw`, animationDelay: `${Math.random() * 5}s` }}>❄️</div>
  ));

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center min-vh-100 text-center ${getBackgroundClass()}`}>
      {weather?.weather[0].main === "Rain" && renderRain()}
      {weather?.weather[0].main === "Snow" && renderSnow()}

      <div className="text-light mb-2">
        <h5>{currentTime.toLocaleTimeString()}</h5>
        {lastUpdated && <div className="small">Last updated: {lastUpdated.toLocaleTimeString()}</div>}
      </div>
      <h1 className="mb-4 text-light">🌤️ Weather App</h1>

      <div className="w-75 w-md-50 position-relative mb-3" style={{ maxWidth: "500px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Enter city or area"
          value={city}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (
          <div className="list-group position-absolute w-100 zindex-tooltip mt-1">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="list-group-item list-group-item-action"
                onClick={() => handleSuggestionClick(s)}
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="btn btn-primary mb-4" onClick={fetchWeather} disabled={loading}>
        {loading ? "Loading..." : "Get Weather"}
      </button>

      {weather && (
        <div className="card mx-auto shadow-lg" style={{ maxWidth: "400px", backgroundColor: "rgba(30,41,59,0.85)" }}>
          <div className="card-body">
            <h3 className="card-title text-light">{weather.name}, {weather.sys.country}</h3>
            <img src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`} alt="icon" />
            <h4 className={`fw-bold ${getTempColor(weather.main.temp)}`}>{weather.main.temp}°C</h4>
            <p className="text-capitalize text-light">{weather.weather[0].description}</p>
            <p className="text-light">Humidity: {weather.main.humidity}%</p>
            <p className="text-light">Wind: {weather.wind.speed} m/s</p>
          </div>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="container mt-4">
          <h4 className="text-light mb-2">📅 5-Day Forecast</h4>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            {forecast.map((day, i) => (
              <div key={i} className="card p-2 shadow-sm text-center" style={{ minWidth: "100px", backgroundColor: "rgba(30,41,59,0.75)" }}>
                <h6 className="text-light">{new Date(day.dt_txt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</h6>
                <img src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`} alt="icon" />
                <p className="mb-0 fw-bold text-light">{Math.round(day.main.temp)}°C</p>
                <small className="text-capitalize text-light">{day.weather[0].description}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;