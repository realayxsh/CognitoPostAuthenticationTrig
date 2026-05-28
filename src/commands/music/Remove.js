const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Remove extends AvonCommand {
    get name() { return 'remove' }
    get aliases() { return [] }
    get player() { return false; }
    get cat() { return 'music' }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    async run(client, message, args, prefix) {
        const accentColor = parseInt(client.config.color.replace('#', ''), 16);
        const send = (text) => {
            const container = new ContainerBuilder()
                .setAccentColor(accentColor)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        let player = client.poru.players.get(message.guild.id);
        if (!player) return send(`**| No player is initiated**`);
        if (!args[0] || isNaN(args[0])) return send(`**| Provide a number to remove from queue**`);
        if (args[0] === 1) return send(`**| You cannot remove the current song from queue**`);
        player.queue.remove(args[0] - 1);
        return send(`**| Removed the track**`);
    }
}
module.exports = Remove;
