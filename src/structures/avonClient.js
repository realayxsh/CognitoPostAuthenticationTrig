 const { Client, GatewayIntentBits, Collection, WebhookClient, Partials, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require(`discord.js`);
const { Guilds, MessageContent, GuildInvites, GuildVoiceStates, GuildMessages, DirectMessages } = GatewayIntentBits;
const { User, Channel, Reaction, Message, GuildMember } = Partials;
const { Database } = require("quickmongo");
const { ClusterClient, getInfo } = require(`discord-hybrid-sharding`);
const AvonEvents = require("./avonEvents");
const AvonCommands = require("./CommandHandler");
const config = require(`../../config.json`);
const Shoukaku = require("./Shoukaku");
const Lavasfy = require("./Lavasfy");
const errorsUrl = process.env.errorswebhook || config.errors || '';
const web = errorsUrl ? new WebhookClient({ url: errorsUrl }) : null;

function sendErrorToWebhook(web, label, err) {
    if (!web) return;
    const stack = err?.stack || String(err);
    const truncated = stack.length > 3800 ? stack.slice(0, 3800) + '\n...(truncated)' : stack;
    const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**[${label}]**\n\`\`\`js\n${truncated}\`\`\``));
    web.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
}

class Avon extends Client {
    constructor(){
        super({
            intents: [Guilds, MessageContent, GuildInvites, GuildMessages, DirectMessages, GuildVoiceStates],
            shardCount: getInfo().TOTAL_SHARDS,
            shards: getInfo().SHARD_LIST,
            partials: [Channel, User, Reaction, Message, GuildMember],
            allowedMentions: {
                repliedUser: true,
                parse: ['everyone', 'roles', 'users']
            }
        });
        this.cluster = new ClusterClient(this);
        this.data = new Database(process.env.mongourl || config.mongourl, { writeConcern: { w: 'majority' } });
        this.data.connect();
        this.data2 = new Database(process.env.mongourl2 || config.mongourl2, { writeConcern: { w: 'majority' } });
        this.data2.connect();
        this.data3 = new Database(process.env.mongourl3 || process.env.mongourl || config.mongourl, { writeConcern: { w: 'majority' } });
        this.data3.connect();
        this.data4 = new Database(process.env.mongourl4 || process.env.mongourl || config.mongourl, { writeConcern: { w: 'majority' } });
        this.data4.connect();
        this.data5 = new Database(process.env.mongourl5 || config.mongourl5 || process.env.mongourl || config.mongourl, { writeConcern: { w: 'majority' } });
        this.data5.connect();
        this.data6 = new Database(process.env.mongourl6 || config.mongourl6 || process.env.mongourl || config.mongourl, { writeConcern: { w: 'majority' } });
        this.data6.connect();
        this.poru = new Shoukaku(this);
        this.lavasfy = new Lavasfy(this);
        this.poru.shoukaku.on('ready', (name) => { console.log(`[SHOUKAKU] => Node ${name} is connected`) });
        this.poru.shoukaku.on('error', (name, error) => {
            console.error(`[SHOUKAKU] => Node ${name} got error: ${error?.message || error}`);
            sendErrorToWebhook(web, `Lavalink Node Error — ${name}`, error);
        });
        this.poru.shoukaku.on('close', (name, code, reason) => {
            console.warn(`[SHOUKAKU] => Node ${name} closed | Code: ${code} | Reason: ${reason}`);
            if(web){
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**[Lavalink Node Closed — ${name}]**\nCode: \`${code}\` | Reason: \`${reason || 'none'}\``));
                web.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
            }
        });
        this.poru.shoukaku.on('debug', (name, info) => { console.log(`[SHOUKAKU] => Node ${name} Debug: ${info}`) });
        this.poru.shoukaku.on('disconnect', (name, players, moved) => {
            if(moved) return;
            console.warn(`[SHOUKAKU] => Node ${name}: Disconnected`);
            if(web){
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**[Lavalink Node Disconnected — ${name}]**\nPlayers affected: \`${players?.length ?? 0}\``));
                web.send({ flags: [MessageFlags.IsComponentsV2], components: [container] }).catch(() => {});
            }
        });
        this.poru.on("playerClosed", (player, data) => {
            console.warn(`[PORU] playerClosed => Guild: ${player?.guildId} | Code: ${data?.code} | Reason: ${data?.reason}`);
        });
        this.emoji = require(`${process.cwd()}/emoji.json`);
        this.config = require(`${process.cwd()}/config.json`);
        this.AvonCommands = new AvonCommands(this).loadCommands();
        this.events = new AvonEvents(this).loadEvents();
        this.login(process.env.token);
        process.on('unhandledRejection', async (er) => {
            console.error(er);
            sendErrorToWebhook(web, 'unhandledRejection', er);
        });
        process.on('uncaughtException', async (err) => {
            console.error(err);
            sendErrorToWebhook(web, 'uncaughtException', err);
        });
    }
}
module.exports = Avon;
