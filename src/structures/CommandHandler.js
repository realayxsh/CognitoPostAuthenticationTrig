const { Collection, ButtonBuilder, ActionRowBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, PermissionsBitField, WebhookClient, MessageFlags } = require('discord.js');
const EventEmitter = require('events');
const { readdirSync } = require('fs');
const web = new WebhookClient({ url: `https://discord.com/api/webhooks/1504581750251192400/joU7_yYTcNmDZ2VPreJC5yyw7i_VMpO9EcIWG8Fm0brz8_6f8yYr6y0QHBegSDyQTflV` });
const ascii = require(`ascii-table`);
const config = require(`../../config.json`);
const table = new ascii().setHeading('Avon Commands', 'Status');
const top = require(`@top-gg/sdk`);
const voteApi = new top.Api(process.env.topggapi || config.topggapi);

// ── Vote cache: TTL 5 minutes, gracefully handles missing/invalid API token ──
const _voteCache = new Map();
const VOTE_TTL = 5 * 60 * 1000;
async function hasVoted(userId) {
    const entry = _voteCache.get(userId);
    if (entry && Date.now() < entry.expires) return entry.voted;
    try {
        const voted = await voteApi.hasVoted(userId);
        _voteCache.set(userId, { voted, expires: Date.now() + VOTE_TTL });
        return voted;
    } catch (e) {
        // API token not configured or rate-limited — do not block users
        return true;
    }
}

// ── Premium cache: TTL 2 minutes per guild ──
const _premCache = new Map();
const PREM_TTL = 2 * 60 * 1000;
async function isPremium(client, guildId) {
    const entry = _premCache.get(guildId);
    if (entry && Date.now() < entry.expires) return entry.active;
    const premData = await client.data3.get(`premium_${guildId}`);
    const active = !!(premData && (premData.expiresAt === null || Date.now() < premData.expiresAt));
    if (premData && !active) { client.data3.delete(`premium_${guildId}`); }
    _premCache.set(guildId, { active, expires: Date.now() + PREM_TTL });
    return active;
}
// Allow invalidating the premium cache when redeem/revoke runs
function invalidatePremCache(guildId) { _premCache.delete(guildId); }

const cv2 = (text) => ({
    flags: [MessageFlags.IsComponentsV2],
    components: [new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(text))]
});

class AvonCommands extends EventEmitter {
    constructor(client){
        super();
        this.client = client;
        this.commands = new Collection();
        this.load = false;
        this.on("error", async (err) => { console.error(err) });
        this.client.on('messageCreate', (message) => this.run(message));
    }

    loadCommands(){
        if(this.load) return this;
        readdirSync(`./src/commands/`).forEach(d => {
            const commands = readdirSync(`./src/commands/${d}/`).filter(f => f.endsWith('.js'));
            for(const cmd of commands){
                const AvonCommand = require(`${process.cwd()}/src/commands/${d}/${cmd}`);
                const command = new AvonCommand(this.client);
                this.commands.set(command.name, command);
                table.addRow(command.name, '✅');
            }
        });
        console.log(table.toString());
        this.load = true;
        return this;
    }

    async run(message){
        if(!message.guild || message.author.bot || message.attachments.size || message.stickers.size) return;
        let prefix;
        let data = await this.client.data.get(`${message.guild.id}-prefix`);
        if(data) prefix = data; else prefix = this.client.config.prefix;

        if(message.content === `<@${this.client.user.id}>`){
            let b1 = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Invite`).setURL(`https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=415602886720&scope=bot`);
            let b2 = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Support`).setURL(this.client.config.server);
            let b3 = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote`).setURL(`https://top.gg/bot/1097475016880304180/vote`);
            let b4 = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Web`).setURL(`https://shorturl.at/egszS`);
            let ro = new ActionRowBuilder().addComponents(b1, b2, b3, b4);
            const container = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**Hey I am ${this.client.user.username}**\n\n` +
                            `**__Settings For ${message.guild.name}__**\n` +
                            `Server ID: \`${message.guild.id}\`\n` +
                            `Voice Channel: ${message.guild.members.me.voice.channel ? message.guild.members.me.voice.channel : '`Null`'}\n` +
                            `Voice Channel ID: ${message.guild.members.me.voice.channel ? `\`${message.guild.members.me.voice.channelId}\`` : '`Null`'}\n` +
                            `My Prefix here: \`${prefix}\`\n\n` +
                            `Try me — \`${prefix}help\` or \`${prefix}play\`\n\n` +
                            `**__Links__** — [Support](${this.client.config.server}) | [Invite](https://discord.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=415602886720&scope=bot)\n\n` +
                            `-# Developed By Radio Development`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                );
            return message.channel.send({ flags: [MessageFlags.IsComponentsV2], components: [container, ro] })
                .catch((e) => { message.author.send({ content: `Error while sending message there: ${e.message}` }).catch(() => {}) });
        }

        try{
            let np = ['688067325433610307', '763992862857494558'];
            let regex = RegExp(`^<@!?${this.client.user.id}>`);
            let pre = message.content.match(regex) ? message.content.match(regex)[0] : prefix;
            let db  = await this.client.data2.get(`noprefix_${message.guild.id}`);
            let db2 = await this.client.data2.get(`noprefix_${this.client.user.id}`);
            if(!db2 || db2 === null){ await this.client.data2.set(`noprefix_${this.client.user.id}`, []); db2 = []; }
            db2.forEach(x => np.push(x));
            if(!db || db === null){ await this.client.data2.set(`noprefix_${message.guild.id}`, []); db = []; }
            db.forEach(x => np.push(x));
            if(!np.includes(message.author.id)){ if(!message.content.startsWith(pre)) return; }
            const args = np.includes(message.author.id) == false
                ? message.content.slice(pre.length).trim().split(/ +/)
                : message.content.startsWith(pre) == true
                    ? message.content.slice(pre.length).trim().split(/ +/)
                    : message.content.trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const avonCommand = this.commands.get(commandName) || this.commands.find((c) => c.aliases && c.aliases.includes(commandName));
            if(!avonCommand) return;

            // Fire-and-forget webhook log — never blocks command execution
            const logContainer = new ContainerBuilder()
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `**| Command Run**\n\n` +
                            `**Author:** ${message.author.tag}\n` +
                            `**Guild:** ${message.guild.name} (\`${message.guild.id}\`)\n` +
                            `**Command:** \`${avonCommand.name}\`\n` +
                            `**Channel:** ${message.channel.name} (<#${message.channel.id}>)`
                        ))
                        .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.guild.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
                );
            web.send({ flags: [MessageFlags.IsComponentsV2], components: [logContainer] }).catch(() => {});

            if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.ViewChannel)) return;
            if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.SendMessages)) return message.author.send({ content: `I don't have **Send Messages** permissions in that channel` }).catch(e => null);
            if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.ReadMessageHistory)) return message.channel.send({ content: `I don't have **Read Message History** permissions here` });
            if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.UseExternalEmojis)) return message.channel.send({ content: `I don't have **Use External Emojis** permissions here` });
            if(!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.EmbedLinks)) return message.channel.send({ content: `I don't have **Embed Links** permissions here` });

            let client = this.client;
            if(avonCommand.inVoice){
                if(message.guild.members.me.voice.channel && !message.member.voice.channel)
                    return message.channel.send(cv2(`${client.emoji.cross} | You must be connected to a voice channel.`));
            }
            if(avonCommand.sameVoice){
                if(message.guild.members.me.voice.channelId !== message.member.voice.channelId && message.guild.members.me.voice.channel)
                    return message.channel.send(cv2(`${client.emoji.cross} | You must be connected to ${message.guild.members.me.voice.channel}`));
            }

            // ── Run vote + premium checks in parallel for speed ──
            const needsVote    = !!avonCommand.vote    && !client.config.owners.includes(message.author.id);
            const needsPremium = !!avonCommand.premium && !client.config.owners.includes(message.author.id);

            const [voted, active] = await Promise.all([
                needsVote    ? hasVoted(message.author.id)            : Promise.resolve(true),
                needsPremium ? isPremium(client, message.guild.id)    : Promise.resolve(true),
            ]);

            if(needsVote && !voted){
                return message.channel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(
                            `${client.emoji.tick} | **[Vote](https://top.gg/bot/1097475016880304180/vote) Required** — Click [here](https://top.gg/bot/1097475016880304180/vote) to vote and unlock this command!`
                        )),
                        new ActionRowBuilder().addComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(`Vote on Top.gg`).setURL(`https://top.gg/bot/1097475016880304180/vote`))
                    ]
                });
            }

            if(needsPremium && !active){
                return message.channel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [new ContainerBuilder()
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                                    `**| Premium Required**\n\n` +
                                    `${client.emoji.cross} | This command is **Premium Only!**\n\n` +
                                    `Ask the bot owner for a premium code and use \`${prefix}redeem <code>\` to unlock all filters for this server.\n\n` +
                                    `Check your status with \`${prefix}premium\``
                                ))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                        )
                    ]
                });
            }

            let player = client.poru.players.get(message.guild.id);
            if(avonCommand.player){
                if(!player || !player.queue.current){
                    return message.channel.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [new ContainerBuilder()
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| I am not playing anything**`))
                                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(message.author.displayAvatarURL({ dynamic: true })))
                            )
                        ]
                    });
                }
            }

            avonCommand.run(client, message, args, prefix, player).catch(e => console.log(e));
        } catch(e){ console.error(e) }
    }
}

module.exports = AvonCommands;
module.exports.invalidatePremCache = invalidatePremCache;
