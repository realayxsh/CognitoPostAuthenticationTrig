const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Invite extends AvonCommand{
    get name(){ return 'invite' }
    get aliases(){ return 'inv' }
    get cat(){ return 'info'; }
    async run(client, message, args, prefix){
        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `Click **[here](https://discord.com/api/oauth2/authorize?client_id=1097475016880304180&permissions=36768832&scope=applications.commands%20bot)** to invite **${client.user.username}** to your server!`
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL()))
            );
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://discord.com/api/oauth2/authorize?client_id=1097475016880304180&permissions=36768832&scope=applications.commands%20bot`).setLabel(`Invite`)
        );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container, row] });
    }
}
module.exports = Invite;
