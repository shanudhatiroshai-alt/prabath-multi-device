/**
 * Advanced Bot Functions Module
 * Comprehensive feature set for multi-purpose bot functionality
 * Created: 2025-12-20
 */

const axios = require('axios');
const moment = require('moment');

// ============================================================================
// STORAGE (In-memory for now, can be replaced with database)
// ============================================================================

class BotStorage {
  constructor() {
    this.reminders = [];
    this.notes = [];
    this.userPreferences = {};
    this.userHistory = [];
  }

  addReminder(reminder) {
    this.reminders.push({ ...reminder, id: Date.now() });
    return this.reminders[this.reminders.length - 1];
  }

  getReminders(userId) {
    return this.reminders.filter(r => r.userId === userId);
  }

  deleteReminder(reminderId) {
    this.reminders = this.reminders.filter(r => r.id !== reminderId);
    return true;
  }

  addNote(note) {
    this.notes.push({ ...note, id: Date.now() });
    return this.notes[this.notes.length - 1];
  }

  getNotes(userId) {
    return this.notes.filter(n => n.userId === userId);
  }

  updateNote(noteId, content) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.content = content;
      note.updatedAt = new Date();
    }
    return note;
  }

  deleteNote(noteId) {
    this.notes = this.notes.filter(n => n.id !== noteId);
    return true;
  }

  setPreference(userId, key, value) {
    if (!this.userPreferences[userId]) {
      this.userPreferences[userId] = {};
    }
    this.userPreferences[userId][key] = value;
  }

  getPreference(userId, key) {
    return this.userPreferences[userId]?.[key];
  }
}

// ============================================================================
// WEATHER MODULE
// ============================================================================

class WeatherModule {
  constructor(apiKey = process.env.WEATHER_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getWeather(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = response.data;
      return {
        success: true,
        city: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        windSpeed: data.wind.speed,
        cloudiness: data.clouds.all,
        timestamp: new Date(data.dt * 1000)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch weather data. Please check the city name and try again.'
      };
    }
  }

  async getForecast(city, days = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const forecasts = response.data.list.slice(0, days * 8).map(item => ({
        date: new Date(item.dt * 1000),
        temp: item.main.temp,
        description: item.weather[0].description,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed
      }));

      return {
        success: true,
        city: response.data.city.name,
        forecasts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch forecast data.'
      };
    }
  }

  formatWeatherResponse(weatherData) {
    if (!weatherData.success) return weatherData.error;

    return `
🌍 Weather in ${weatherData.city}, ${weatherData.country}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️  Temperature: ${weatherData.temperature}°C (feels like ${weatherData.feelsLike}°C)
📝 Description: ${weatherData.description}
💨 Wind Speed: ${weatherData.windSpeed} m/s
💧 Humidity: ${weatherData.humidity}%
🔽 Pressure: ${weatherData.pressure} hPa
☁️  Cloudiness: ${weatherData.cloudiness}%
    `;
  }
}

// ============================================================================
// JOKE MODULE
// ============================================================================

class JokeModule {
  async getRandomJoke() {
    try {
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
      return {
        success: true,
        setup: response.data.setup,
        punchline: response.data.punchline,
        type: response.data.type
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch a joke at this moment.'
      };
    }
  }

  async getJokeByType(type = 'general') {
    try {
      const response = await axios.get(`https://official-joke-api.appspot.com/jokes/${type}/random`);
      const data = Array.isArray(response.data) ? response.data[0] : response.data;
      return {
        success: true,
        setup: data.setup,
        punchline: data.punchline,
        type: data.type
      };
    } catch (error) {
      return {
        success: false,
        error: `Could not fetch a ${type} joke.`
      };
    }
  }

  formatJokeResponse(jokeData) {
    if (!jokeData.success) return jokeData.error;
    return `😂 ${jokeData.setup}\n\n${jokeData.punchline}`;
  }
}

// ============================================================================
// CALCULATOR MODULE
// ============================================================================

class CalculatorModule {
  evaluate(expression) {
    try {
      // Security: Only allow safe characters
      const safeExpr = expression.replace(/[^0-9+\-*/().%\s]/g, '');
      
      if (safeExpr !== expression) {
        return { success: false, error: 'Invalid characters in expression' };
      }

      // Using Function constructor instead of eval for slightly better safety
      const result = Function('"use strict"; return (' + safeExpr + ')')();
      
      return {
        success: true,
        expression: expression,
        result: Math.round(result * 10000) / 10000 // Round to 4 decimal places
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid mathematical expression. Please try again.'
      };
    }
  }

  add(a, b) {
    return a + b;
  }

  subtract(a, b) {
    return a - b;
  }

  multiply(a, b) {
    return a * b;
  }

  divide(a, b) {
    if (b === 0) {
      return { error: 'Cannot divide by zero' };
    }
    return a / b;
  }

  power(base, exponent) {
    return Math.pow(base, exponent);
  }

  squareRoot(num) {
    if (num < 0) {
      return { error: 'Cannot calculate square root of negative number' };
    }
    return Math.sqrt(num);
  }

  percentage(num, percent) {
    return (num * percent) / 100;
  }

  formatCalculatorResponse(calcResult) {
    if (!calcResult.success) return calcResult.error;
    return `🧮 Calculation\n━━━━━━━━━━━━━━\n${calcResult.expression} = **${calcResult.result}**`;
  }
}

// ============================================================================
// REMINDERS MODULE
// ============================================================================

class RemindersModule {
  constructor(storage) {
    this.storage = storage;
    this.activeReminders = new Map();
  }

  createReminder(userId, text, delayMs, notifyCallback) {
    const reminder = this.storage.addReminder({
      userId,
      text,
      createdAt: new Date(),
      dueAt: new Date(Date.now() + delayMs)
    });

    const timeoutId = setTimeout(() => {
      notifyCallback(reminder);
      this.storage.deleteReminder(reminder.id);
    }, delayMs);

    this.activeReminders.set(reminder.id, timeoutId);
    return reminder;
  }

  createScheduledReminder(userId, text, dueDate, notifyCallback) {
    const now = new Date();
    const delayMs = dueDate.getTime() - now.getTime();

    if (delayMs < 0) {
      return { success: false, error: 'Due date must be in the future' };
    }

    const reminder = this.createReminder(userId, text, delayMs, notifyCallback);
    return { success: true, reminder };
  }

  listReminders(userId) {
    return this.storage.getReminders(userId);
  }

  deleteReminder(reminderId) {
    const timeoutId = this.activeReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeReminders.delete(reminderId);
    }
    return this.storage.deleteReminder(reminderId);
  }

  formatRemindersResponse(reminders) {
    if (reminders.length === 0) {
      return '📝 No reminders set.';
    }

    let response = '📝 Your Reminders:\n━━━━━━━━━━━━━━━━\n';
    reminders.forEach((reminder, index) => {
      const dueTime = moment(reminder.dueAt).format('YYYY-MM-DD HH:mm:ss');
      response += `${index + 1}. ${reminder.text}\n   Due: ${dueTime}\n`;
    });

    return response;
  }
}

// ============================================================================
// NOTES MODULE
// ============================================================================

class NotesModule {
  constructor(storage) {
    this.storage = storage;
  }

  createNote(userId, title, content) {
    const note = this.storage.addNote({
      userId,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, note };
  }

  listNotes(userId) {
    return this.storage.getNotes(userId);
  }

  getNote(noteId, userId) {
    const note = this.storage.notes.find(n => n.id === noteId && n.userId === userId);
    return note || { error: 'Note not found' };
  }

  updateNote(noteId, content) {
    return this.storage.updateNote(noteId, content);
  }

  deleteNote(noteId) {
    return this.storage.deleteNote(noteId);
  }

  searchNotes(userId, query) {
    const userNotes = this.storage.getNotes(userId);
    return userNotes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  formatNotesResponse(notes) {
    if (notes.length === 0) {
      return '📓 No notes found.';
    }

    let response = '📓 Your Notes:\n━━━━━━━━━━━━━━\n';
    notes.forEach((note, index) => {
      const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
      response += `${index + 1}. **${note.title}**\n   ${preview}\n`;
    });

    return response;
  }
}

// ============================================================================
// QUOTES MODULE
// ============================================================================

class QuotesModule {
  async getRandomQuote() {
    try {
      const response = await axios.get('https://api.quotable.io/random');
      return {
        success: true,
        quote: response.data.content,
        author: response.data.author,
        tags: response.data.tags
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch a quote at this moment.'
      };
    }
  }

  async getQuoteByAuthor(author) {
    try {
      const response = await axios.get('https://api.quotable.io/quotes', {
        params: { author }
      });

      if (response.data.results.length === 0) {
        return { success: false, error: `No quotes found for author: ${author}` };
      }

      const quote = response.data.results[Math.floor(Math.random() * response.data.results.length)];
      return {
        success: true,
        quote: quote.content,
        author: quote.author,
        tags: quote.tags
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch the quote.'
      };
    }
  }

  formatQuoteResponse(quoteData) {
    if (!quoteData.success) return quoteData.error;
    return `✨ "${quoteData.quote}"\n— ${quoteData.author}`;
  }
}

// ============================================================================
// FACTS MODULE
// ============================================================================

class FactsModule {
  async getRandomFact() {
    try {
      const response = await axios.get('https://uselessfacts.jsoup.com/random.json');
      return {
        success: true,
        fact: response.data.text
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch a fact at this moment.'
      };
    }
  }

  async getNumberFact(number) {
    try {
      const response = await axios.get(`http://numbersapi.com/${number}`);
      return {
        success: true,
        fact: response.data,
        number
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not fetch a fact about this number.'
      };
    }
  }

  formatFactResponse(factData) {
    if (!factData.success) return factData.error;
    return `💡 ${factData.fact}`;
  }
}

// ============================================================================
// CURRENCY CONVERTER MODULE
// ============================================================================

class CurrencyModule {
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/' + fromCurrency);
      const rate = response.data.rates[toCurrency];

      if (!rate) {
        return { success: false, error: `Currency ${toCurrency} not found.` };
      }

      const result = amount * rate;
      return {
        success: true,
        amount,
        fromCurrency,
        toCurrency,
        rate,
        result: Math.round(result * 100) / 100
      };
    } catch (error) {
      return {
        success: false,
        error: 'Could not convert currency. Please check the currency codes.'
      };
    }
  }

  formatCurrencyResponse(conversionData) {
    if (!conversionData.success) return conversionData.error;
    return `💱 Currency Conversion\n━━━━━━━━━━━━━━━━━━━━\n${conversionData.amount} ${conversionData.fromCurrency} = ${conversionData.result} ${conversionData.toCurrency}\nRate: 1 ${conversionData.fromCurrency} = ${conversionData.rate} ${conversionData.toCurrency}`;
  }
}

// ============================================================================
// TIME & GREETING MODULE
// ============================================================================

class TimeModule {
  getFormattedTime(timezone = 'UTC') {
    const time = moment().tz(timezone);
    return {
      time: time.format('HH:mm:ss'),
      date: time.format('YYYY-MM-DD'),
      timezone,
      dayOfWeek: time.format('dddd'),
      full: time.format('YYYY-MM-DD HH:mm:ss Z')
    };
  }

  getGreeting() {
    const hour = moment().hour();
    if (hour >= 5 && hour < 12) return '🌅 Good Morning!';
    if (hour >= 12 && hour < 17) return '☀️  Good Afternoon!';
    if (hour >= 17 && hour < 21) return '🌆 Good Evening!';
    return '🌙 Good Night!';
  }

  formatTimeResponse(timeData) {
    return `${timeData.full}\n${timeData.dayOfWeek}`;
  }

  getCountdown(targetDate) {
    const now = moment();
    const target = moment(targetDate);
    const diff = target.diff(now);

    if (diff < 0) {
      return { success: false, error: 'Target date is in the past' };
    }

    const duration = moment.duration(diff);
    return {
      success: true,
      days: Math.floor(duration.asDays()),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      totalSeconds: Math.floor(duration.asSeconds())
    };
  }

  formatCountdownResponse(countdown) {
    if (!countdown.success) return countdown.error;
    return `⏱️  ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s remaining`;
  }
}

// ============================================================================
// HELP & DOCUMENTATION MODULE
// ============================================================================

class HelpModule {
  getHelpMenu() {
    return `
🤖 **Advanced Bot Functions - Help Menu**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 **Available Commands:**

🌍 **Weather**
  • \`/weather <city>\` - Get current weather
  • \`/forecast <city>\` - 5-day forecast

😂 **Entertainment**
  • \`/joke\` - Random joke
  • \`/quote\` - Inspirational quote
  • \`/fact\` - Random fact
  • \`/numberfact <number>\` - Fact about a number

🧮 **Calculator**
  • \`/calc <expression>\` - Evaluate math expression
  • Examples: /calc 2+2, /calc (10*5)/2

⏰ **Reminders & Notes**
  • \`/remind <text> <time>\` - Set a reminder
  • \`/reminders\` - List all reminders
  • \`/note <title> <content>\` - Create a note
  • \`/notes\` - List all notes
  • \`/search <query>\` - Search notes

💱 **Utilities**
  • \`/convert <amount> <from> <to>\` - Convert currency
  • \`/time\` - Get current time
  • \`/countdown <date>\` - Count down to a date

ℹ️  **More Help**
  • \`/help\` - Show this menu
  • \`/version\` - Show version info
    `;
  }

  getVersionInfo() {
    return `
🤖 **Bot Information**
━━━━━━━━━━━━━━━━━━━
Version: 1.0.0
Created: 2025-12-20
Author: Advanced Bot Team
Status: Active & Running ✅
    `;
  }
}

// ============================================================================
// MAIN BOT MANAGER CLASS
// ============================================================================

class AdvancedBotManager {
  constructor() {
    this.storage = new BotStorage();
    
    // Initialize all modules
    this.weather = new WeatherModule();
    this.jokes = new JokeModule();
    this.calculator = new CalculatorModule();
    this.quotes = new QuotesModule();
    this.facts = new FactsModule();
    this.currency = new CurrencyModule();
    this.time = new TimeModule();
    this.help = new HelpModule();
    
    // Initialize storage-dependent modules
    this.reminders = new RemindersModule(this.storage);
    this.notes = new NotesModule(this.storage);
  }

  async processCommand(userId, command, args) {
    try {
      const cmd = command.toLowerCase();

      switch (cmd) {
        case 'weather':
          return await this.weather.getWeather(args.join(' '));

        case 'forecast':
          return await this.weather.getForecast(args.join(' '));

        case 'joke':
          return await this.jokes.getRandomJoke();

        case 'quote':
          return await this.quotes.getRandomQuote();

        case 'fact':
          return await this.facts.getRandomFact();

        case 'numberfact':
          return await this.facts.getNumberFact(args[0]);

        case 'calc':
          return this.calculator.evaluate(args.join(''));

        case 'reminder':
        case 'remind':
          return { success: false, error: 'Use /remind-set to create reminders' };

        case 'reminders':
          return this.reminders.listReminders(userId);

        case 'note':
          if (args.length < 2) {
            return { success: false, error: 'Usage: /note <title> <content>' };
          }
          const title = args[0];
          const content = args.slice(1).join(' ');
          return this.notes.createNote(userId, title, content);

        case 'notes':
          return this.notes.listNotes(userId);

        case 'search':
          return this.notes.searchNotes(userId, args.join(' '));

        case 'convert':
          if (args.length < 3) {
            return { success: false, error: 'Usage: /convert <amount> <from> <to>' };
          }
          return await this.currency.convertCurrency(
            parseFloat(args[0]),
            args[1].toUpperCase(),
            args[2].toUpperCase()
          );

        case 'time':
          return this.time.getFormattedTime(args[0] || 'UTC');

        case 'countdown':
          return this.time.getCountdown(args.join(' '));

        case 'help':
          return { success: true, help: true };

        case 'version':
          return { success: true, version: true };

        default:
          return { success: false, error: 'Unknown command. Type /help for available commands.' };
      }
    } catch (error) {
      return { success: false, error: `Error processing command: ${error.message}` };
    }
  }

  formatResponse(result, command) {
    if (result.help) return this.help.getHelpMenu();
    if (result.version) return this.help.getVersionInfo();
    if (!result.success && result.error) return `❌ ${result.error}`;

    switch (command.toLowerCase()) {
      case 'weather':
        return this.weather.formatWeatherResponse(result);
      case 'joke':
        return this.jokes.formatJokeResponse(result);
      case 'quote':
        return this.quotes.formatQuoteResponse(result);
      case 'fact':
      case 'numberfact':
        return this.facts.formatFactResponse(result);
      case 'calc':
        return this.calculator.formatCalculatorResponse(result);
      case 'convert':
        return this.currency.formatCurrencyResponse(result);
      case 'time':
        return this.time.formatTimeResponse(result);
      case 'countdown':
        return this.time.formatCountdownResponse(result);
      case 'reminders':
        return this.reminders.formatRemindersResponse(result);
      case 'notes':
      case 'search':
        return Array.isArray(result) ? this.notes.formatNotesResponse(result) : result;
      default:
        return JSON.stringify(result, null, 2);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  AdvancedBotManager,
  WeatherModule,
  JokeModule,
  CalculatorModule,
  RemindersModule,
  NotesModule,
  QuotesModule,
  FactsModule,
  CurrencyModule,
  TimeModule,
  HelpModule,
  BotStorage
};
