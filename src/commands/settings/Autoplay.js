const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class autoPlay extends AvonCommand{
    get name(){ return 'autoplay'; }
    get aliases(){ return ['ap','auto'] }
    get premium(){ return true; }
    get cat(){ return 'set' }
    get player(){ return true; }
    get inVoice(){ return true; }
    get sameVoice(){ return true; }
    async run(client, message, args, prefix){
        const send = (text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        let data = await client.data.get(`${message.guild.id}-autoPlay`);
        if(!data) await client.data.set(`${message.guild.id}-autoPlay`, `disabled`);
        if(data === `disabled`){
            client.data.set(`${message.guild.id}-autoPlay`, `enabled`);
            return send(`**| Enabled Autoplay Mode of ${client.user.username}**`);
        } else if(data === `enabled`){
            client.data.set(`${message.guild.id}-autoPlay`, `disabled`);
            return send(`**| Disabled Autoplay Mode of ${client.user.username}**`);
        } else {
            client.data.set(`${message.guild.id}-autoPlay`, `disabled`);
            return send(`**| Please try again running that command**`);
        }
    }
}
module.exports = autoPlay;
