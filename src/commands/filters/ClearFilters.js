const AvonCommand = require("../../structures/avonCommand");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, MessageFlags } = require("discord.js");

const CLARITY_EQ = [
    { band: 0,  gain: -0.05 }, { band: 1,  gain: -0.05 }, { band: 2,  gain:  0.0  },
    { band: 3,  gain:  0.02 }, { band: 4,  gain:  0.04 }, { band: 5,  gain:  0.02 },
    { band: 6,  gain:  0.0  }, { band: 7,  gain:  0.0  }, { band: 8,  gain:  0.06 },
    { band: 9,  gain:  0.06 }, { band: 10, gain:  0.04 }, { band: 11, gain:  0.02 },
    { band: 12, gain:  0.0  }, { band: 13, gain:  0.0  },
];

class ClearFilters extends AvonCommand {
    get name() { return 'clearfilters' }
    get aliases() { return ['cf', 'clearfilter'] }
    get inVoice() { return true; }
    get sameVoice() { return true; }
    get vote() { return true; }
    get cat() { return 'filters' }
    get player() { return true; }
    get premium() { return true; }
    async run(client, message, args, prefix, player) {
        await player.shoukaku.clearFilters();
        player.data.set('8d',false); player.data.set('bass',false); player.data.set('night',false);
        player.data.set('vib',false); player.data.set('trem',false); player.data.set('treble',false);
        player.data.set('slow',false); player.data.set('chip',false); player.data.set('china',false);
        player.data.set('vapor',false);
        player.shoukaku.setFilters({ equalizer: CLARITY_EQ }).catch(() => {});
        const container = new ContainerBuilder()
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${client.emoji.tick} **| Cleared all filters**`))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
            );
        return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = ClearFilters;
