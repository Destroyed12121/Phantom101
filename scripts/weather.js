// Weather widget for Phantom
(function() {
    const Weather = {
        config: {
            locationApi: 'https://demo.ip-api.com/json/',
            weatherApi: 'https://api.open-meteo.com/v1/forecast'
        },

        init() {
            this.containers = document.querySelectorAll('#weather-widget, #weather-widget-mobile');
            if (this.containers.length === 0) return;
            this.load();
        },

        async load() {
            try {
                this.renderLoading();
                
                let locData = null;
                try {
                    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                    const data = await res.json();
                    locData = { lat: data.latitude, lon: data.longitude, city: data.city };
                } catch (e) {
                    try {
                         const res = await fetch('https://ipapi.co/json/');
                         const data = await res.json();
                         locData = { lat: data.latitude, lon: data.longitude, city: data.city };
                    } catch (ee) {
                         locData = { lat: 40.71, lon: -74.01, city: 'New York' }; 
                    }
                }
                
                const lat = locData.lat || 40.71;
                const lon = locData.lon || -74.01;
                const city = locData.city || 'Your Area';

                const data = await this.getWeather(lat, lon);
                this.render(data, city);
            } catch (err) {
                console.error('Weather error:', err);
                this.renderError();
            }
        },

        async getLocation() {
            const res = await fetch(this.config.locationApi);
            return await res.json();
        },

        async getWeather(lat, lon) {
            const url = `${this.config.weatherApi}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=1`;
            const res = await fetch(url);
            return await res.json();
        },

        getWeatherIcon(code) {
            const icons = {
                0: { icon: 'sun', desc: 'Clear' },
                1: { icon: 'cloud-sun', desc: 'Mostly Clear' },
                2: { icon: 'cloud-sun', desc: 'Partly Cloudy' },
                3: { icon: 'cloud', desc: 'Cloudy' },
                45: { icon: 'smog', desc: 'Foggy' },
                48: { icon: 'smog', desc: 'Rime Fog' },
                51: { icon: 'cloud-rain', desc: 'Light Drizzle' },
                53: { icon: 'cloud-rain', desc: 'Drizzle' },
                55: { icon: 'cloud-rain', desc: 'Heavy Drizzle' },
                61: { icon: 'cloud-showers-heavy', desc: 'Light Rain' },
                63: { icon: 'cloud-showers-heavy', desc: 'Rain' },
                65: { icon: 'cloud-showers-heavy', desc: 'Heavy Rain' },
                71: { icon: 'snowflake', desc: 'Light Snow' },
                73: { icon: 'snowflake', desc: 'Snow' },
                75: { icon: 'snowflake', desc: 'Heavy Snow' },
                80: { icon: 'cloud-showers-water', desc: 'Rain Showers' },
                95: { icon: 'bolt', desc: 'Thunderstorm' },
            };
            return icons[code] || { icon: 'cloud-sun', desc: 'Fair' };
        },

        renderLoading() {
            this.containers.forEach(c => c.innerHTML = '<div class="skeleton" style="height: 60px; width: 100px; border-radius: 30px;"></div>');
        },

        renderError() {
            this.containers.forEach(c => c.innerHTML = '');
        },

        render(data, city) {
            const temp = Math.round(data.current.temperature_2m);
            const precip = data.daily.precipitation_probability_max[0];
            const code = data.current.weather_code;
            const iconInfo = this.getWeatherIcon(code);

            this.containers.forEach(c => {
                c.innerHTML = `
                    <div class="weather-hud">
                        <div class="weather-temp-bin">
                            <i class="fa-solid fa-${iconInfo.icon}"></i>
                            <span>${temp}°</span>
                        </div>
                        <div class="weather-precip-bin">
                            <i class="fa-solid fa-droplet"></i>
                            <span>${precip}%</span>
                        </div>
                        <div class="weather-loc-tag">${city}</div>
                    </div>
                `;
            });
        }
    };

    window.WeatherWidget = Weather;
    document.addEventListener('DOMContentLoaded', () => Weather.init());
})();
