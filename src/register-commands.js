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
