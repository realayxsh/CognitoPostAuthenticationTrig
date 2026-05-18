const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");
const { v4: uuidv4 } = require("uuid");

class GenPremium extends AvonCommand{
    get name(){
        return 'genpremium'
    }
    get aliases(){
        return ['generatepremium','genprem','createpremium'];
    }
    async run(client,message,args,prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            let amount = parseInt(args[0]) || 1;
            if(amount > 10) amount = 10;

            let codes = await client.data.get(`premium_codes`) || [];
            let generated = [];

            for(let i = 0; i < amount; i++){
                let code = `PREM-${uuidv4().split('-')[0].toUpperCase()}-${uuidv4().split('-')[1].toUpperCase()}`;
                codes.push(code);
                generated.push(code);
            }

            await client.data.set(`premium_codes`, codes);

            let codeList = generated.map((c, i) => `\`${i+1}\` \`${c}\``).join('\n');
            return message.channel.send({embeds: [
                new EmbedBuilder()
                    .setColor(client.config.color)
                    .setAuthor({name: `| Premium Codes Generated`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                    .setDescription(`Generated **${generated.length}** premium code(s):\n\n${codeList}\n\n**Share these codes with server owners to activate premium.**`)
                    .setFooter({text: `Total active codes in DB: ${codes.length}`})
            ]});
        } catch(e){ console.log(e) }
    }
}
module.exports = GenPremium;
