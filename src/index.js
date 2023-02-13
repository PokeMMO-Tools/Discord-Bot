const smooth = require('array-smooth')
require('dotenv').config();
const { Client, IntentsBitField, AttachmentBuilder, EmbedBuilder, Embed } = require('discord.js');
const QuickChart = require('quickchart-js');
const { getGradientFillHelper } = require('quickchart-js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})

client.on('ready', (c) =>{
    console.log('PokeMMO Tools bot is ready.')
})


client.on('interactionCreate', async (interaction) =>{
if (interaction.isAutocomplete){
    const itemTyped = interaction.options.get('item-name').value;

// AUTO COMPLETE
    if (itemTyped.length > 2){ 
        const response = await fetch(`https://proxy.pokemmoprices.com/items/search/${itemTyped}`);
        const myJson = await response.json(); //extract JSON from the http response
        let entry = myJson['data']
        let choices = [];

        for (let i = 0; i < entry.length; i++ ){
            let entries = entry[i]
            let searchResult = {
                name: entries.name,
                value: ''+entries.id
            }
            choices.push(searchResult)
            if (i == 24){
                console.log ('option limit reached')
                i = entry.length
            }
        }
        if(itemTyped.length >2 && !isNaN(itemTyped)){ //WEIRD WORK AROUND.... autocomplete will crash if i dont stop it here.
            return
        }
        if (choices.length == 0){
            let placeholder = {
                name: 'No results. Delete and try again',
                value: '1000000'
            }
            choices.push(placeholder)
        }

        await interaction.respond(
            choices
        ).then(() => console.log('successfully responded autocomplete'))
        .catch(console.error)

}
}
})

client.on('interactionCreate', async (interaction) =>{

    if (!interaction.isChatInputCommand()){
        return
    }

    if (interaction.commandName === 'price'){

        const itemTyped = interaction.options.get('item-name').value;
        let itemTypedName = 'item-name'
        const response = await fetch(`https://pokemmoprices.com/api/v2/items/table/${itemTyped}`);

        const myJson = await response.json(); //extract JSON from the http response
        let entry = myJson['data']

        itemTypedName = entry[0].i.en //english name

        async function fetching(){

            await interaction.deferReply();

            async function doThis(){
                    const response = await fetch(`https://pokemmoprices.com/api/v2/items/graph/min/${itemTyped}`);
                    const myJson = await response.json(); //extract JSON from the http response
                    // do something with myJson
                    let entries = myJson['data']
                    for (let i = 0; i < entries.length; i++) {
                    entries[i].x *= 1000;
                        //entries[i].y = entries[i].y.toLocaleString('en-US')
                    }

                    const smoothOffset = 2
                    const smoothed = smooth(
                    entries,
                    smoothOffset,
                    (i) => i.y,
                    (i, s) => {
                        return { x: i.x, y: s }
                    },
                    )


                    const average = (datapoints) => {
                        const parts = datapoints.reduce((acc, value, index) => {
                            if (index % 10 === 0) {
                                acc.push([]);
                            }
                            acc[acc.length - 1].push(value);
                            return acc;
                        }, []);
                        return parts.map(part => {
                            return {
                                x: Math.round(part.reduce((acc, value) => acc + value.x, 0) / part.length),
                                y: part.reduce((acc, value) => acc + value.y, 0) / part.length
                            };
                        });
                    }

                    

                    const chart = new QuickChart();


                    chart.setConfig({
                        type: 'line',
                        data: {
                            datasets: [
                                {
                                label: 'Price',
                                data: average(smoothed),
                                fill: false,
                                borderColor: getGradientFillHelper('vertical', ['#eb3639', '#a336eb', '#36a2eb']),
                                borderWidth: 4,
                                pointRadius: 0,
                            }
                        ]
                        },
                        options: {
                            title:{
                                display: true,
                                text: itemTypedName,
                                fontColor: '#fff'
                            },
                            legend: {
                                display: false
                            },
                            scales: {
                                xAxes: [{
                                    gridLines: {
                                        color: 'rgba(200, 200, 200, 0.05)',
                                        lineWidth: 1
                                    },
                                    type: 'time',
                                    time: {
                                        unit: 'day',
                                    },
                                }],
                                yAxes: [{
                                    gridLines: {
                                        color: 'rgba(200, 200, 200, 0.08)',
                                        lineWidth: 1
                                    },
                                    ticks: {
                                        fontColor: '#fff',
                                        userCallback: function(value, index, values) {
                                            value = value.toString();
                                            value = value.split(/(?=(?:...)*$)/);
                                            value = value.join(',');
                                            return value;
                                        }
                                    }
                                }]
                            },
                        }
                    }).setWidth(800)
                    .setHeight(400);

                chart.backgroundColor = '#1b1b1b'
                    
                const url = await chart.getShortUrl()
                const chartEmbed = new EmbedBuilder().setTitle(itemTypedName+' Chart').setDescription(`View full chart: https://pokemmoprices.com/item?id=${itemTyped}`).setImage(url)
                await interaction.editReply({ content: '', embeds: [chartEmbed] });
            }

        await doThis()

    }

    fetching()

}
})

client.login(process.env.TOKEN);
