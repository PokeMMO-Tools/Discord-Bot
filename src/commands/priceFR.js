const { ApplicationCommandOptionType } = require("discord.js");
const { accentFold, toSlug } = require("../util");
const { fetchItemData, validateItemId } = require("../api");
const { getItems, findItemById, findItemByName, findItemsByName } = require("../items");
const itemLookup = require("../item_lookup.json");
const QuickChart = require("quickchart-js");
const smooth = require("array-smooth");
const { EmbedBuilder } = require("discord.js");

// Default to English language
const DEFAULT_LANGUAGE = 'fr';
const DISPLAY_LANGUAGE = 'fr'; // Change this to switch display language

const onAutocomplete = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    const language = interaction.options.getString('language') || 'en'
    if (itemName.length < 3) return interaction.respond([])
    
    const ITEMS = await getItems();
    const searchName = accentFold(itemName.toLowerCase());
    const items = ITEMS.filter(i => 
        accentFold(i.name[language]?.toLowerCase() || '').includes(searchName)
    )
    
    // Get detailed info from item_lookup.json for each item
    const detailedItems = items.map(item => {
        const metadata = itemLookup[item.id];
        return {
            ...item,
            ...metadata
        };
    });
    
    const options = detailedItems.slice(0, 25).map(i => ({
        name: i.name[language] || i.name.en, // Use selected language or fall back to English
        value: i.id.toString(), // Convert ID to string
        description: i.description[language] || i.description.en // Use selected language or fall back to English
    }))
    return interaction.respond(options)
}

const onExecute = async (interaction) => {
    const itemName = interaction.options.getString('item-name') || ''
    await interaction.deferReply()
    
    console.log('Price command execution:', {
        input: itemName,
        interactionId: interaction.id,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        userName: interaction.user.username,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name
    });

    const itemId = parseInt(itemName);
    if (!itemId) {
        console.error('Invalid item ID:', itemName);
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

    console.log('Fetching data for item:', { itemId });
    
    // Get item metadata directly from lookup
    const item = itemLookup[itemId];
    if (!item) {
        console.error('Item not found in lookup:', { itemId });
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

    try {
        // Fetch data for the last 30 days
        const { item: itemData, prices, quantities } = await fetchItemData(itemId, 30);
        
        // Debug logging
        console.log('Fetched data:', {
            pricesCount: prices?.length,
            quantitiesCount: quantities?.length,
            firstPrice: prices?.[0],
            firstQuantity: quantities?.[0]
        });

        // Validate data
        if (!prices?.length || !quantities?.length) {
            console.error('No price or quantity data available');
            return interaction.editReply({
                ephemeral: true,
                embeds: [
                    {
                        title: "Error",
                        description: "No price data available for this item",
                        color: 0xFF0000,
                    },
                ],
            });
        }

        // Get the item name in display language
        const itemNameLang = item.name[DISPLAY_LANGUAGE] || item.name.en;
        const slug = toSlug('en');

        // Get the latest price and quantity
        const currentPrice = prices[0]?.y?.toLocaleString("en-US") || 'N/A';
        const currentQuantity = quantities[0]?.y?.toLocaleString("en-US") || 'N/A';

        // Convert timestamps to milliseconds and validate data
        const pricesWithTimestamps = prices.map(p => ({
            x: p.x * 1000,
            y: p.y
        }));
        
        // Debug logging of raw data
        console.log('Raw price data:', pricesWithTimestamps.slice(0, 5)); // Log first 5 points for debugging
        
        // Validate data before smoothing
        if (!Array.isArray(pricesWithTimestamps) || pricesWithTimestamps.length === 0) {
            console.error('No price data:', pricesWithTimestamps);
            return interaction.editReply({
                ephemeral: true,
                embeds: [
                    {
                        title: "Error",
                        description: "No price data available",
                        color: 0xFF0000,
                    },
                ],
            });
        }

        // Filter out any invalid data points
        const validPrices = pricesWithTimestamps.filter(p => p && p.y !== undefined && !isNaN(p.y));
        
        // Debug logging of filtered data
        console.log('Filtered price data:', validPrices.slice(0, 5)); // Log first 5 points for debugging
        
        if (validPrices.length === 0) {
            console.error('All price data points were invalid:', pricesWithTimestamps);
            return interaction.editReply({
                ephemeral: true,
                embeds: [
                    {
                        title: "Error",
                        description: "All price data points were invalid",
                        color: 0xFF0000,
                    },
                ],
            });
        }

        // Sort data by timestamp to ensure proper ordering
        const sortedPrices = validPrices.sort((a, b) => a.x - b.x);
        
        // Debug logging of sorted data
        console.log('Sorted price data:', sortedPrices.slice(0, 5));

        const chart = new QuickChart();
        chart.setConfig({
            type: "line",
            data: {
                datasets: [
                    {
                        label: "Price",
                        data: sortedPrices,
                        fill: false,
                        borderColor: QuickChart.getGradientFillHelper("vertical", [
                            "#eb3639",
                            "#a336eb",
                            "#36a2eb",
                        ]),
                        borderWidth: 4,
                        pointRadius: 0,
                        tension: 0.3, // Add tension for smoother lines
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
                elements: {
                    line: {
                        tension: 0.3, // Global tension setting
                        cubicInterpolationMode: 'monotone' // Prevents overshooting
                    }
                },
            },
        });
        chart.setWidth(800);
        chart.setHeight(400);
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
                },
                {
                    name: "Last Updated",
                    value: `<t:${Math.floor(sortedPrices[sortedPrices.length - 1]?.x / 1000)}:R>`,
                    inline: true,
                }
            );

        await interaction.editReply({ embeds: [chartEmbed] });
    } catch (error) {
        console.error('Error creating price chart:', error);
        return interaction.editReply({
            ephemeral: true,
            embeds: [
                {
                    title: "Error",
                    description: "Failed to create price chart",
                    color: 0xFF0000,
                },
            ],
        });
    }
}

module.exports = {
    name: 'price-french',
    description: 'French version of the price command',
    options: [
        {
            name: "item-name",
            description: "The name of the item you want to look up",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        },
        {
            name: "language",
            description: "Language to display the item name and description",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: 'English', value: 'en' },
                { name: 'French', value: 'fr' }
            ]
        }
    ],
    execute: onExecute,
    autocomplete: onAutocomplete,
}
