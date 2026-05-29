const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Treblebass extends AvonCommand {
    get name() { return 'treblebass' }
    get aliases() { return null; }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get cat() { return 'filters' }
    get vote() { return true; }
    get player() { return true; }
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
        let data = player.data.get(`treble`);
        if (!data || data === false || data === undefined) {
            await player.shoukaku.setFilters({ equalizer: [{ band: 0, gain: 0.6 },{ band: 1, gain: 0.67 },{ band: 2, gain: 0.67 },{ band: 3, gain: 0 },{ band: 4, gain: -0.5 },{ band: 5, gain: 0.15 },{ band: 6, gain: -0.45 },{ band: 7, gain: 0.23 },{ band: 8, gain: 0.35 },{ band: 9, gain: 0.45 },{ band: 10, gain: 0.55 },{ band: 11, gain: 0.6 },{ band: 12, gain: 0.55 },{ band: 13, gain: 0 }] });
            player.data.set(`treble`, true);
            return send(`${client.emoji.filters} **| Enabled TrebleBass**`);
        }
        if (data === true) {
            player.data.set(`treble`, false);
            await player.shoukaku.clearFilters();
            return send(`${client.emoji.cross} **| Disabled TrebleBass**`);
        }
    }
}
module.exports = Treblebass;
