# Discord Bot for PokeMMO Prices

This is just a simple discord bot which implements the following commands:

 - `/price [item]`: Get the latest price and a price chart over the last 2 weeks.

## For Developers
This Bot uses DiscordJS and runs on NodeJS.
There will be 2 things you need to do before you can run the code.

You will need to create a file called `.env` in the project root with the following content:
```
API_BASE_URL=https://pokemmoprices.com/api/v2
DISCORD_TOKEN=XXXX
```
*DISCORD_TOKEN will be the token of you discord bot for testing*

To install all dependencies run the following command in the project root:
> npm install

After that you can run the bot.
> node ./src/index.js
