const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

class Tremolo extends AvonCommand {
    get name() { return 'tremolo' }
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
        let db = player.data.get(`trem`);
        if (!db || db === false || db === undefined) {
            await player.shoukaku.setFilters({ tremolo: { frequency: 4.0, depth: 0.75 } });
            player.data.set(`trem`, true);
            return send(`**| Enabled Tremolo**`);
        }
        if (db === true) {
            await player.shoukaku.clearFilters();
            player.data.set(`trem`, false);
            return send(`**| Disabled Tremolo**`);
        }
    }
}
module.exports = Tremolo;
