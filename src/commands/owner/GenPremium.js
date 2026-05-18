const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");
const { v4: uuidv4 } = require("uuid");

const DURATIONS = {
    '30d':      30  * 24 * 60 * 60 * 1000,
    '90d':      90  * 24 * 60 * 60 * 1000,
    '180d':     180 * 24 * 60 * 60 * 1000,
    '365d':     365 * 24 * 60 * 60 * 1000,
    'lifetime': null
};

const DURATION_LABELS = {
    '30d': '30 Days', '90d': '90 Days', '180d': '180 Days',
    '365d': '1 Year', 'lifetime': 'Lifetime'
};

class GenPremium extends AvonCommand{
    get name(){ return 'genpremium' }
    get aliases(){ return ['generatepremium','genprem','createpremium']; }
    async run(client, message, args, prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            // Support both prefix (+genpremium 3 30d) and slash (/genpremium duration:30d amount:3)
            let amount = 1;
            let durKey = '30d';
            for(let a of args){
                let n = parseInt(a);
                if(!isNaN(n)) amount = n;
                else if(DURATIONS.hasOwnProperty(a.toLowerCase())) durKey = a.toLowerCase();
            }
            if(amount > 10) amount = 10;

            let codes    = await client.data3.get(`premium_codes`) || [];
            let generated = [];

            for(let i = 0; i < amount; i++){
                let code = `PREM-${uuidv4().split('-')[0].toUpperCase()}-${uuidv4().split('-')[1].toUpperCase()}`;
                codes.push({ code, duration: durKey });
                generated.push(code);
            }

            await client.data3.set(`premium_codes`, codes);

            let label    = DURATION_LABELS[durKey];
            let codeList = generated.map((c, i) => `\`${i+1}\` \`${c}\``).join('\n');

            return message.channel.send({embeds: [
                new EmbedBuilder()
                    .setColor(client.config.color)
                    .setAuthor({name: `| Premium Codes Generated`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(`Generated **${generated.length}** code(s) • Validity: **${label}**\n\n${codeList}\n\n**Share these with server owners to activate premium.**`)
                    .setFooter({text: `Total active codes in DB: ${codes.length}`})
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = GenPremium;
