const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class China extends AvonCommand {
    get name() { return 'china' }
    get aliases() { return null; }
    get vote() { return true; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters' }
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
        let db = player.data.get(`china`);
        if (!db || db === undefined || db === false) {
            await player.shoukaku.setFilters({ timescale: { speed: 0.75, pitch: 1.25, rate: 1.25 } });
            player.data.set(`china`, true);
            return send(`**| Enabled China**`);
        }
        if (db === true) {
            await player.shoukaku.setFilters({ timescale: null });
            player.data.set(`china`, false);
            return send(`**| Disabled China**`);
        }
    }
}
module.exports = China;
