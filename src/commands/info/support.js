const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonCommand = require(`../../structures/avonCommand`);

class Support extends AvonCommand{
    get name(){ return 'support' }
    get aliases(){ return ['supp']; }
    get cat(){ return 'info'; }
    async run(client, message, args, prefix){
        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                        `Get support **[here](${client.config.server})**`
                    ))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(client.user.displayAvatarURL()))
            );
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Support`).setURL(client.config.server)
        );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container, row] });
    }
}
module.exports = Support;
