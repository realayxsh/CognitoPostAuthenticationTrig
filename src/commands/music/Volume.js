const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");

class Volume extends AvonCommand {
    get name() { return 'volume' }
    get aliases() { return ['vol', 'volu'] }
    get player() { return false; }
    get cat() { return 'music' }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    async run(client, message, args, prefix) {
        try {
            const send = (text) => {
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                    );
                return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
            };

            let player = client.poru.players.get(message.guild.id);
            if (!player) return send(`${client.emoji.cross} **| I am not playing anything**`);
            if (!args[0]) return send(`${client.emoji.music} **| Current volume of the player is ${player.volume * 100}%**`);

            let vol = Number(args[0]);
            if (vol < 0 || vol > 200) return send(`${client.emoji.cross} **| Volume must be between 0 and 200**`);
            if (player.volume * 100 === vol) return send(`${client.emoji.cross} **| Volume is already set to ${vol}%**`);

            await player.setVolume(vol / 1);
            return send(`${client.emoji.tick} **| Volume has been changed to ${vol}%**`);
        } catch (e) { console.log(e) }
    }
}
module.exports = Volume;
