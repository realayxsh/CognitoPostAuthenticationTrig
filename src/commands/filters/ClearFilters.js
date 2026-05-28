const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class ClearFilters extends AvonCommand {
    get name() { return 'clearfilters' }
    get aliases() { return ['cf', 'clearfilter'] }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get vote() { return true; }
    get cat() { return 'filters' }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
        await player.shoukaku.clearFilters();
        const container = new ContainerBuilder()
            .setAccentColor(parseInt(client.config.color.replace('#', ''), 16))
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Cleared all filters**`))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
            );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = ClearFilters;
