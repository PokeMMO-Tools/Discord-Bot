const { ApplicationCommandOptionType } = require("discord.js");
const { accentFold, toSlug } = require("../util");
const { fetchItemData } = require("../api");
const { getItems, findItemById, findItemByName, findItemsByName } = require("../items");
const QuickChart = require("quickchart-js");
const smooth = require("array-smooth");
const { EmbedBuilder } = require("discord.js");

const SUPPORTED_LANGUAGES = {
    'en': 'English',
    'cn': 'Chinese',
    'de': 'German',
    'fr': 'French',
    'it': 'Italian',
    'es': 'Spanish',
    'ja': 'Japanese',
    'tw': 'Taiwanese'
};

const onAutocomplete = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    const language = interaction.options.getString('language') || 'en'
    if (itemName.length < 3) return interaction.respond([])
    
    const ITEMS = await getItems();
    const searchName = accentFold(itemName.toLowerCase());
    const items = ITEMS.filter(i => 
        accentFold(i.name?.toLowerCase() || '').includes(searchName)
    )
    const options = items.slice(0, 25).map(i => ({
        name: i.name,
        value: i.id,
    }))
    return interaction.respond(options)
}

const onExecute = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    const language = interaction.options.getString('language') || 'en'
    await interaction.deferReply()
    
    // Find item by name
    const ITEMS = await getItems();
    const item = ITEMS.find(i => i.name.toLowerCase() === itemName.toLowerCase())
    if (!item) {
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: `The given Item could not be found: ${itemName}`,
                    color: 0xFF0000, // red
                },
            ],
        })
    }

    // Validate item ID against API
    const isValid = await validateItemId(item.id)
    if (!isValid) {
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: `The item ${itemName} exists in cache but is no longer valid in the API`,
                    color: 0xFF0000, // red
                },
            ],
        })
    }

    try {
        const { item: itemData, prices, quantities } = await fetchItemData(item.id)
        
        // Get the item name in the selected language
        const itemNameLang = itemData.name[language] || itemData.name.en
        const slug = toSlug(itemNameLang)

        const currentPrice = prices[prices.length - 1].y.toLocaleString("en-US");
        const currentQuantity = quantities[quantities.length - 1].y.toLocaleString("en-US");

        // from seconds to milliseconds
        for (let i = 0; i < prices.length; i++) {
            prices[i].x *= 1000;
        }

        // smooth out the graph
        const smoothOffset = 0;
        const smoothed = smooth(
            prices,
            smoothOffset,
            (i) => i.y,
            (i, s) => {
                return { x: i.x, y: s };
            }
        );

        const chart = new QuickChart();
        chart.setConfig({
            type: "line",
            data: {
                datasets: [
                    {
                        label: "Price",
                        data: smoothed,
                        fill: false,
                        borderColor: QuickChart.getGradientFillHelper("vertical", [
                            "#eb3639",
                            "#a336eb",
                            "#36a2eb",
                        ]),
                        borderWidth: 4,
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                title: {
                    display: true,
                    text: itemNameLang,
                    fontColor: "#fff",
                },
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [
                        {
                            ticks: {
                                fontColor: "#fff",
                                color: "rgba(200, 200, 200, 0.08)"
                            },
                            gridLines: {
                                color: "rgba(200, 200, 200, 0.08)",
                                lineWidth: 1,
                            },
                            type: "time",
                            time: {
                                unit: "day",
                            },
                        },
                    ],
                    yAxes: [
                        {
                            gridLines: {
                                color: "rgba(200, 200, 200, 0.08)",
                                lineWidth: 1,
                            },
                            ticks: {
                                fontColor: "#fff",
                                userCallback: (value, index, values) => {
                                    value = value.toString();
                                    value = value.split(/(?=(?:...)*$)/);
                                    value = value.join(",");
                                    return value;
                                },
                            },
                        },
                    ],
                },
            },
        })
        .setWidth(800)
        .setHeight(400);

        chart.backgroundColor = "#1b1b1b";
        const url = await chart.getShortUrl();
        
        const chartEmbed = new EmbedBuilder()
            .setColor("Random")
            .setTitle(itemNameLang)
            .setURL(`https://pokemmohub.com/items/${slug}`)
            .setDescription(
                `Recent price history chart. \nView full chart here: https://pokemmohub.com/items/${slug}`
            )
            .setThumbnail(
                "https://cdn.discordapp.com/attachments/609023944238039042/1106788804498563122/HubLogo1.png"
            )
            .setImage(url)
            .addFields(
                {
                    name: "Price",
                    value: `${currentPrice}`,
                    inline: true,
                },
                {
                    name: "Quantity",
                    value: `${currentQuantity}`,
                    inline: true,
                }
            );
        return interaction.editReply({ embeds: [chartEmbed] });
    } catch (err) {
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: "There was an error while fetching the item data.",
                    color: 0xFF0000, // red
                },
            ],
        })
    }
}

module.exports = {
    name: 'price',
    description: 'Displays price graph of the item specified.',
    options: [
        {
            name: "item-name",
            description: "Item name",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        },
        {
            name: "language",
            description: "Language for item name",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: Object.entries(SUPPORTED_LANGUAGES).map(([key, value]) => ({
                name: value,
                value: key
            }))
        }
    ],
    execute: onExecute,
    autocomplete: onAutocomplete,
}
