const smooth = require("array-smooth");
require("dotenv").config();
const {
  Client,
  IntentsBitField,
  AttachmentBuilder,
  EmbedBuilder,
  MessageEmbed,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Message,
  Embed,
  Events,
  GatewayIntentBits,
} = require("discord.js");
const QuickChart = require("quickchart-js");
const { getGradientFillHelper } = require("quickchart-js");
const fetch = require("node-fetch");

function accentFold(inStr) {
  return inStr.replace(
    /([àáâãäå])|([çčć])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g,
    function (str, a, c, e, i, n, o, s, u, y, ae) {
      if (a) return 'a';
      if (c) return 'c';
      if (e) return 'e';
      if (i) return 'i';
      if (n) return 'n';
      if (o) return 'o';
      if (s) return 's';
      if (u) return 'u';
      if (y) return 'y';
      if (ae) return 'ae';
    }
  );
}

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

client.on("ready", (c) => {
  console.log("PokeMMO Tools bot is ready.");
});

let itemMap = [];

async function loadItems() {
  const result = await fetch(
    //mapping each item in the dropdown to their name and id according to api
    `https://pokemmoprices.com/api/v2/items/all?noDescription=true#`
  );
  const myJson = await result.json();

  const data = myJson.data;
  const list = data.map((item) => {
    return {
      name: item.n.en,
      value: item.i + "",
    };
  });
  itemMap = list; //assigning list of items/id to global variable
}
// ----> Added then for the async function <----
loadItems().then(() => {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete) {
      const itemTyped = accentFold(interaction.options
        .get("item-name")
        .value.toString()
        .toLowerCase())
      let itemMap2 = itemMap;
      let choices = [];
      // AUTO COMPLETE
      if (itemTyped.length > 1) {
        let searchResult = itemMap2.filter((item) =>
          accentFold(item.name.toLowerCase()).includes(itemTyped + "")
        );
        if (searchResult.length < 1) {
        } else {
          for (let i = 0; i < searchResult.length; i++) {
            choices.push(searchResult[i]);
            if (i > 23) {
              //can only handle 25 responses or it will crash
              break;
            }
          }
        }

        if (itemTyped.length > 2 && !isNaN(itemTyped)) {
          return;
        }
        if (choices.length > 0 && typeof interaction.respond === "function") {
          await interaction
            .respond(choices)
            .then(() => {
              console.log("successfully responded autocomplete");
            })
            .catch(console.error);
        } else {
          if (interaction.reply) {
            console.log(`${interaction.reply} <--- error`);
            await interaction.reply({
              content: "Error occurred. Make sure you are selecting a valid item. Do not switch servers before executing the command.",
              ephemeral: true,
            });
          }
        }
      }
      console.log(interaction.options.get("item-name"));
    }
  });

  client.on("interactionCreate", async (interaction) => {
    // if (!interaction.isChatInputCommand()){
    //      return
    //  }

    if (interaction.commandName === "price") {
      const itemTyped = interaction.options.get("item-name").value; //id from previous choice
      let itemTypedName = "item-name";
      let itemTypedName2 = "item-name";
      let myJson;
      let myJson1;
      let myJson2;

      const fetchData = async () => {
        try {
          const responsesJSON = await Promise.all([
            fetch(`https://pokemmoprices.com/api/v2/items/${itemTyped}`),
            fetch(
              `https://pokemmoprices.com/api/v2/items/graph/min/${itemTyped}/14`
            ), //2 weeks
            fetch(
              `https://pokemmoprices.com/api/v2/items/graph/quantity/${itemTyped}`
            ),
          ]);
          const [response, response1, response2] = await Promise.all(
            responsesJSON.map((r) => r.json())
          );
          myJson = response; //extract JSON from the http response
          myJson1 = response1; //extract JSON from the http response
          myJson2 = response2;
        } catch (err) {
          throw err;
        }
      };

      await fetchData();

      let entry = myJson["data"];
      if (entry != null) {
        itemTypedName = entry.n.en; //english name
        itemTypedName2 = entry.n.en
          .toString()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-");

        // console.log(itemTyped); //id
        // console.log(itemTypedName); //english name

        // console.log(itemTypedName2); //slug

        async function fetching() {
          await interaction.deferReply();

          async function graphItem() {
            // do something with myJson
            let entries = myJson1["data"];
            let entries2 = myJson2["data"];
            let currentPrice =
              entries[entries.length - 1].y.toLocaleString("en-US");
            let currentQuantity =
              entries2[entries2.length - 1].y.toLocaleString("en-US");
            for (let i = 0; i < entries.length; i++) {
              entries[i].x *= 1000;
              //entries[i].y = entries[i].y.toLocaleString('en-US')
            }

            //Smoothing our the graph points
            const smoothOffset = 0;
            const smoothed = smooth(
              entries,
              smoothOffset,
              (i) => i.y,
              (i, s) => {
                return { x: i.x, y: s };
              }
            );

            //Smoothing our the graph points
            const average = (datapoints) => {
              const parts = datapoints.reduce((acc, value, index) => {
                if (index % 10 === 0) {
                  acc.push([]);
                }
                acc[acc.length - 1].push(value);
                return acc;
              }, []);
              return parts.map((part) => {
                return {
                  x: Math.round(
                    part.reduce((acc, value) => acc + value.x, 0) / part.length
                  ),
                  y:
                    part.reduce((acc, value) => acc + value.y, 0) / part.length,
                };
              });
            };

            //creating new quickchart (using chartjs)
            const chart = new QuickChart();

            chart
              .setConfig({
                type: "line",
                data: {
                  datasets: [
                    {
                      label: "Price",
                      data: smoothed,
                      fill: false,
                      borderColor: getGradientFillHelper("vertical", [
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
                    text: itemTypedName,
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
                          userCallback: function (value, index, values) {
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

            //embed reply
            const url = await chart.getShortUrl(); //url too long, have to get short one
            const chartEmbed = new EmbedBuilder()
              .setColor("Random")
              .setTitle(itemTypedName)
              .setURL(`https://pokemmohub.com/items/${itemTypedName2}`)
              .setDescription(
                `2 week price history chart. \nView full chart here: https://pokemmohub.com/items/${itemTypedName2}`
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
            await interaction.editReply({ content: "", embeds: [chartEmbed] });
          }

          await graphItem();
        }
        fetching();
      }
    }
  });

  client.login(process.env.TOKEN);
});
