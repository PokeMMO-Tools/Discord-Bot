const { ApplicationCommandOptionType } = require("discord.js");
const { accentFold, toSlug } = require("../util");
const { fetchItemData, validateItemId } = require("../api");
const { getItems, findItemById, findItemByName, findItemsByName } = require("../items");
const itemLookup = require("../item_lookup.json");
const QuickChart = require("quickchart-js");
const smooth = require("array-smooth");
const { EmbedBuilder } = require("discord.js");

// Default to Italian language
const DEFAULT_LANGUAGE = 'it';
const DISPLAY_LANGUAGE = 'it';

const onAutocomplete = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    if (itemName.length < 3) return interaction.respond([])
    const ITEMS = await getItems();
    const searchName = accentFold(itemName.toLowerCase());
    const items = ITEMS.filter(i => 
        accentFold(i.name["it"]?.toLowerCase() || '').includes(searchName)
    );
    
    // Get detailed info from item_lookup.json for each item
    const detailedItems = items.map(item => {
        const metadata = itemLookup[item.id];
        return {
            ...item,
            ...metadata
        };
    });
    
    const options = detailedItems.slice(0, 25).map(i => ({
        name: i.name["it"] || i.name["en"], // Fallback to English if Italian not available
        value: i.id.toString(), // Use ID as value
        description: i.description["it"] || i.description["en"] // Fallback to English description
    }));
    return interaction.respond(options);
}

const onExecute = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    await interaction.deferReply()
    const itemId = parseInt(itemName);
    if (!itemId) {
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: `Invalid item ID: ${itemName}`,
                    color: 0xFF0000, // red
                },
            ],
        });
    }
    
    // Get item metadata directly from lookup
    const item = itemLookup[itemId];
    if (!item) {
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: `Item ${itemId} not found in database`,
                    color: 0xFF0000, // red
                },
            ],
        });
    }
    const { item: itemData, prices, quantities } = await fetchItemData(item["i"])
    if (!itemData || !prices || !quantities) {
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
                text: itemData["n"]["it"],
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
    const slug = toSlug(itemData["n"]["en"])
    const chartEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(itemData["n"]["it"])
        .setURL(`https://pokemmohub.com/items/${slug}`)
        .setDescription(
            `2 week price history chart. \nView full chart here: https://pokemmohub.com/items/${slug}`
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
}

module.exports = {
    name: 'price-italian',
    description: 'ITALIAN! Displays price graph of the item specified.',
    options: [
        {
            name: "item-name",
            description: "Item name",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        },
    ],
    execute: onExecute,
    autocomplete: onAutocomplete,
}
    name: 'price-italian',
    description: 'ITALIAN! Displays price graph of the item specified.',
    options: [
        {
            name: "item-name",
            description: "Item name",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
        },
    ],
    execute: onExecute,
    autocomplete: onAutocomplete,
}