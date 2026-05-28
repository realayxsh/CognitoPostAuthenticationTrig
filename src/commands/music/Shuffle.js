const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Shuffle extends AvonCommand {
    get name() { return 'shuffle'; }
    get aliases() { return ['shuff']; }
    get player() { return true; }
    get cat() { return 'music' }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    async run(client, message, args, prefix, player) {
        const accentColor = parseInt(client.config.color.replace('#', ''), 16);
        const text = !player.queue.length
            ? `**| No queue available to shuffle**`
            : `**| Shuffled the queue**`;
        if (player.queue.length) player.queue.shuffle();
        const container = new ContainerBuilder()
            .setAccentColor(accentColor)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
            );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = Shuffle;
