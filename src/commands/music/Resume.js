const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Resume extends AvonCommand {
    get name() { return 'resume' }
    get aliases() { return ['chalu', 'res'] }
    get player() { return true }
    get cat() { return 'music' }
    get inVoice() { return true }
    get sameVoice() { return true }
    async run(client, message, args, prefix, player) {
        const accentColor = parseInt(client.config.color.replace('#', ''), 16);
        const text = !player.paused ? `**| Player is already resumed**` : `**| Resumed the player**`;
        if (player.paused) player.pause(false);
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
module.exports = Resume;
