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
        const send = (text) => {
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
        };
        let db = player.data.get(`slow`);
        if (!db || db === false || db === undefined) {
            await player.shoukaku.setFilters({ timescale: { speed: 0.5, pitch: 1.0, rate: 0.8 } });
            player.data.set(`slow`, true);
            return send(`${client.emoji.filters} **| Enabled Slowmode**`);
        }
        if (db === true) {
            await player.shoukaku.setFilters({ timescale: null });
            player.data.set(`slow`, false);
            return send(`${client.emoji.cross} **| Disabled Slowmode**`);
        }
    }
}
module.exports = Slowmode;
