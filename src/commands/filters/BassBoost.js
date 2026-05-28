const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class BassBoost extends AvonCommand {
    get name() { return 'bassboost' }
    get aliases() { return ['bass']; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get vote() { return true; }
    get cat() { return 'filters' }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
        try {
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
            let db = player.data.get(`bass`);
            if (!db || db === false || db === undefined) {
                await player.shoukaku.setFilters({ equalizer: [{ band: 0, gain: 0.10 },{ band: 1, gain: 0.10 },{ band: 2, gain: 0.05 },{ band: 3, gain: 0.05 },{ band: 4, gain: -0.05 },{ band: 5, gain: -0.05 },{ band: 6, gain: 0 },{ band: 7, gain: -0.05 },{ band: 8, gain: -0.05 },{ band: 9, gain: 0 },{ band: 10, gain: 0.05 },{ band: 11, gain: 0.05 },{ band: 12, gain: 0.10 },{ band: 13, gain: 0.10 }] });
                player.data.set(`bass`, true);
                return send(`**| Enabled BassBoost**`);
            }
            if (db === true) {
                await player.shoukaku.clearFilters();
                player.data.set(`bass`, false);
                return send(`**| Disabled BassBoost**`);
            }
        } catch (e) { console.log(e) }
    }
}
module.exports = BassBoost;
