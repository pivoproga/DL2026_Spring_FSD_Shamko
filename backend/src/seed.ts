import db from './models/database';

/**
 * Скрипт начального наполнения базы мемами.
 * Запуск: npm run seed
 */

const memes = [
  // hot
  { url: 'https://api.memegen.link/images/drake/its_35c/nope.png', category: 'hot' },
  { url: 'https://api.memegen.link/images/doge/such_heat/much_sun.png', category: 'hot' },
  { url: 'https://api.memegen.link/images/badchoice/go_outside_at_noon/what_could_go_wrong.png', category: 'hot' },
  // cold
  { url: 'https://api.memegen.link/images/grumpycat/its_minus_10/no_thanks.png', category: 'cold' },
  { url: 'https://api.memegen.link/images/aag/winter/blankets.png', category: 'cold' },
  { url: 'https://api.memegen.link/images/fry/not_sure_if_cold/or_dead_inside.png', category: 'cold' },
  // rain
  { url: 'https://api.memegen.link/images/buzz/rain/rain_everywhere.png', category: 'rain' },
  { url: 'https://api.memegen.link/images/facepalm/forgot_umbrella/perfect.png', category: 'rain' },
  { url: 'https://api.memegen.link/images/drake/go_for_walk_in_rain/nope.png', category: 'rain' },
  // snow
  { url: 'https://api.memegen.link/images/awesome/snow_day/hot_tea_ready.png', category: 'snow' },
  { url: 'https://api.memegen.link/images/awkward/left_jacket_home/snow_started.png', category: 'snow' },
  { url: 'https://api.memegen.link/images/blb/build_snowman/lost_gloves.png', category: 'snow' },
  // wind
  { url: 'https://api.memegen.link/images/buzz/wind/wind_everywhere.png', category: 'wind' },
  { url: 'https://api.memegen.link/images/doge/such_wind/much_hair.png', category: 'wind' },
  { url: 'https://api.memegen.link/images/facepalm/windy_day/bad_hair_day.png', category: 'wind' },
  // cloudy
  { url: 'https://api.memegen.link/images/both/cloudy_or_sunny/why_not_both.png', category: 'cloudy' },
  { url: 'https://api.memegen.link/images/fry/not_sure_if_cloudy/or_foggy.png', category: 'cloudy' },
  { url: 'https://api.memegen.link/images/grumpycat/cloudy_again/no_sun.png', category: 'cloudy' },
  // clear
  { url: 'https://api.memegen.link/images/drake/clear_sky/go_outside.png', category: 'clear' },
  { url: 'https://api.memegen.link/images/awesome/sunny_day/no_jacket_needed.png', category: 'clear' },
  { url: 'https://api.memegen.link/images/bihw/clear_sky/great_day.png', category: 'clear' },
];

const clearMemes = db.prepare('DELETE FROM memes');
const insert = db.prepare('INSERT INTO memes (url, category) VALUES (?, ?)');

const insertMany = db.transaction(() => {
  clearMemes.run();
  for (const meme of memes) {
    insert.run(meme.url, meme.category);
  }
});

insertMany();
console.log(`Re-seeded ${memes.length} memes into the database.`);
