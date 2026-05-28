const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Seek extends AvonCommand {
    get name() { return 'seek' }
    get aliases() { return [''] }
    get cat() { return 'music' }
    get player() { return true; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    async run(client, message, args, prefix, player) {
        const send = (text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        if (!args[0] || isNaN(args[0])) return send(`${client.emoji.cross} **| Provide a valid seekable number**`);
        if (!player.queue.current.isSeekable) return send(`${client.emoji.cross} **| This track is not seekable**`);
        player.seek(args[0]);
        return send(`${client.emoji.tick} **| Seeked the track to ${args[0]}s**`);
    }
}
module.exports = Seek;
