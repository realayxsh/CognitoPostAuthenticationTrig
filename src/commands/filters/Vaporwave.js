const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Vaporwave extends AvonCommand {
    get name() { return 'vaporwave' }
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
        let data = player.data.get(`vapor`);
        if (!data || data === false || data === undefined) {
            await player.shoukaku.setFilters({ equalizer: [{ band: 0, gain: 0 },{ band: 1, gain: 0 },{ band: 2, gain: 0 },{ band: 3, gain: 0 },{ band: 4, gain: 0 },{ band: 5, gain: 0 },{ band: 6, gain: 0 },{ band: 7, gain: 0 },{ band: 8, gain: 0.15 },{ band: 9, gain: 0.15 },{ band: 10, gain: 0.15 },{ band: 11, gain: 0.15 },{ band: 12, gain: 0.15 },{ band: 13, gain: 0.15 }], timescale: { pitch: 0.55 } });
            player.data.set(`vapor`, true);
            return send(`${client.emoji.filters} **| Enabled Vaporwave**`);
        }
        if (data === true) {
            await player.shoukaku.clearFilters();
            player.data.set(`vapor`, false);
            return send(`${client.emoji.cross} **| Disabled Vaporwave**`);
        }
    }
}
module.exports = Vaporwave;
