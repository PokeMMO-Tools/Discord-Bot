require('dotenv').config();
const commands = require('./commands');
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageTyping,
  ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.application.commands.set(commands);
});

const onCommand = async (interaction) => {
    const command = commands.find(c => c.name === interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.editReply({ 
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: "There was an error while executing this command.",
                    color: 0xFF0000, // red
                },
            ]
        });
    }
}

const onAutocomplete = async (interaction) => {
    const command = commands.find(c => c.name === interaction.commandName);
    if (!command) return;
    try {
        await command.autocomplete(interaction);
    } catch (error) {
        console.error(error);
    }
}

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) return onCommand(interaction);
    if (interaction.isAutocomplete()) return onAutocomplete(interaction);
    // console.log(`Unhandled interaction type: ${interaction.type}`); // https://discord-api-types.dev/api/discord-api-types-v10/enum/InteractionType
});

client.login(process.env.DISCORD_TOKEN);