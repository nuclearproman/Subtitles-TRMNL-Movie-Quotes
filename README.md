# 'Subtitles' TRMNL Movie Quote Plugin Backend

This repo is a data pipeline for the Subtitles TRMNL Movie Quote Plugin. The quotes.json file is what the plugin actually polls.

The plugin generates random movie quotes on your TRMNL from BuzzFeed, filmsite.org and Wikipedia and makes a guessing game out of it.

Quotes from BuzzFeed, filmsite.org and Wikipedia

The markup for the plugin is already in place. 

Edit: My approach to this changed a bit. The file movie_quotes.csv is now the master data source for the quotes.json code. The quotes.json file auto-rebuilds every time movie_quotes.csv is updated and committed. I find this much more efficient and easily expandable. 

