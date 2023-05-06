const smooth = require("array-smooth");
require("dotenv").config();
const {
  Client,
  IntentsBitField,
  AttachmentBuilder,
  EmbedBuilder,
  Embed,
  GatewayIntentBits,
} = require("discord.js");
const QuickChart = require("quickchart-js");
const { getGradientFillHelper } = require("quickchart-js");
const fetch = require("node-fetch");

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
loadItems();

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete) {
    const itemTyped = interaction.options.get("item-name").value;
    let itemMap2 = itemMap;
    let choices = [];
    // AUTO COMPLETE
    if (itemTyped.length > 1) {
      //   const response = await fetch(`https://proxy.pokemmoprices.com/items/search/${itemTyped}`);
      //   const myJson = await response.json(); //extract JSON from the http response
      //   let entry = myJson['data']

      /*    for (let i = 0; i < entry.length; i++ ){
            let entries = entry[i]
            let searchResult = {
                name: entries.name,
                value: ''+entries.id
            }
            choices.push(searchResult)
            if (i == 24){
                console.log ('option limit reached')
                i = entry.length
            }   */

      let searchResult = itemMap2.filter((item) =>
        item.name.toLowerCase().includes(itemTyped + "")
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
        //WEIRD WORK AROUND.... autocomplete and bot will crash if i dont stop it here. idk why tbh

        return;
      }
      if (choices.length > 0) {
  /* 
     let placeholder = {
          name: "No results. Delete and try again",
          value: "1000000",
        };
        choices.push(placeholder);
  */
        await interaction
          .respond(choices)
          .then(() => console.log("successfully responded autocomplete"))
          .catch(console.error);
      } else {
        console.log("typing too fast!");
      }
      //   if (!choices[0]) {
      //     //attempt to fix crashes
      //     return;
      //   } else {
      //     await interaction
      //       .respond(choices)
      //       .then(() => console.log("successfully responded autocomplete"))
      //       .catch(console.error);
      //   }
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
    const response = await fetch(
      `https://pokemmoprices.com/api/v2/items/${itemTyped}`
    );

    const myJson = await response.json(); //extract JSON from the http response

    let entry = myJson["data"];
    if (entry != null) {
      itemTypedName = entry.n.en; //english name
      itemTypedName2 = entry.n.en.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')


      console.log(itemTyped); //id
      console.log(itemTypedName); //english name

      console.log(itemTypedName2); //slug

      async function fetching() {
        await interaction.deferReply();

        async function graphItem() {
          const response = await fetch(
            `https://pokemmoprices.com/api/v2/items/graph/min/${itemTyped}`
          );
          const myJson = await response.json(); //extract JSON from the http response
          // do something with myJson
          let entries = myJson["data"];
          for (let i = 0; i < entries.length; i++) {
            entries[i].x *= 1000;
            //entries[i].y = entries[i].y.toLocaleString('en-US')
          }

          //Smoothing our the graph points
          const smoothOffset = 2;
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
                y: part.reduce((acc, value) => acc + value.y, 0) / part.length,
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
                    data: average(smoothed),
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
                      gridLines: {
                        color: "rgba(200, 200, 200, 0.05)",
                        lineWidth: 1,
                      },
                      type: "time",
                      time: {
                        unit: "month",
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
            .setTitle(itemTypedName + " Chart")
            .setDescription(
              `View full chart: https://pokemmohub.com/items/${itemTypedName2}`
            )
            .setImage(url);
          await interaction.editReply({ content: "", embeds: [chartEmbed] });
        }

        await graphItem();
      }
      fetching();
    }
  }
});

client.login(process.env.TOKEN);
