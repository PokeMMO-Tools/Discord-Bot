require("dotenv").config();

const {
  REST,
  Routes,
  ApplicationCommandOptionType,
  Application,
  SlashCommandBuilder,
  AutocompleteInteraction,
} = require("discord.js");

const commands = [
  {
    name: "price",
    description: "Displays price graph of the item specified.",
    options: [
      {
        name: "item-name",
        description: "Item name",
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
    ],
  },
];

/*
    module.exports = { 
        data: 
        new SlashCommandBuilder()
        .setName('price')
        .setDescription('Displays price graph of the item specified.')
        .addStringOption(option => 
            option.setName('item-name')
                .setDescription('Item name')
                .setRequired(true)
                .setAutocomplete(true))
           //     .setChoices(itemMap)
                
        }
    
                
    const commands = []
    console.log(module.exports.data.toJSON())

 */

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
//PokeMMO Hub server
(async () => {
  try {
    console.log("Registering slash commands");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands were registered correctly");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
//second server (presumably patrouski's)
(async () => {
  try {
    console.log("Registering slash commands");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID2
      ),
      { body: commands }
    );

    console.log("Slash commands were registered correctly");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
// third server (presumably ROO)
(async () => {
  try {
    console.log("Registering slash commands");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID3
      ),
      { body: commands }
    );

    console.log("Slash commands were registered correctly");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
// third server (presumably Hazzeer's)
(async () => {
  try {
    console.log("Registering slash commands");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID4
      ),
      { body: commands }
    );

    console.log("Slash commands were registered correctly");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();


