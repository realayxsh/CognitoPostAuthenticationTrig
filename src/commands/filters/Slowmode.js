const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Slowmode extends AvonCommand {
    get name() { return 'slowmode' }
    get aliases() { return null; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters' }
    get vote() { return true; }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
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
        let db = player.data.get(`slow`);
        if (!db || db === false || db === undefined) {
            player.send({ guildId: message.guild.id, op: 'filters', timescale: { speed: 0.5, pitch: 1.0, rate: 0.8 } });
            player.data.set(`slow`, true);
            return send(`**| Enabled Slowmode**`);
        }
        if (db === true) {
            player.send({ guildId: message.guild.id, op: 'filters', timescale: { speed: 1.0, pitch: 1.0, rate: 1.0 } });
            player.data.set(`slow`, false);
            return send(`**| Disabled Slowmode**`);
        }
    }
}
module.exports = Slowmode;
