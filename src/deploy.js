require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

const commands = [
    new SlashCommandBuilder().setName('play').setDescription('Play a song or playlist').addStringOption(o => o.setName('query').setDescription('Song name, Spotify/Deezer/SoundCloud URL').setRequired(true)),
    new SlashCommandBuilder().setName('skip').setDescription('Skip the current song'),
    new SlashCommandBuilder().setName('stop').setDescription('Stop the music and clear the queue'),
    new SlashCommandBuilder().setName('pause').setDescription('Pause the music'),
    new SlashCommandBuilder().setName('resume').setDescription('Resume paused music'),
    new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue'),
    new SlashCommandBuilder().setName('loop').setDescription('Set loop mode').addStringOption(o => o.setName('type').setDescription('Loop type').setRequired(true).addChoices({name:'Track',value:'track'},{name:'Queue',value:'queue'},{name:'None',value:'none'})),
    new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the music queue'),
    new SlashCommandBuilder().setName('clearqueue').setDescription('Clear the entire music queue'),
    new SlashCommandBuilder().setName('volume').setDescription('Set or check the player volume').addIntegerOption(o => o.setName('level').setDescription('Volume level (0-200)').setMinValue(0).setMaxValue(200)),
    new SlashCommandBuilder().setName('seek').setDescription('Seek to a position in the current track').addIntegerOption(o => o.setName('position').setDescription('Position in seconds').setRequired(true)),
    new SlashCommandBuilder().setName('remove').setDescription('Remove a song from the queue').addIntegerOption(o => o.setName('position').setDescription('Queue position to remove').setRequired(true)),
    new SlashCommandBuilder().setName('previous').setDescription('Play the previous track'),
    new SlashCommandBuilder().setName('connect').setDescription('Connect bot to your voice channel'),
    new SlashCommandBuilder().setName('disconnect').setDescription('Disconnect bot from voice channel'),
    new SlashCommandBuilder().setName('restart').setDescription('Restart the current track'),
    new SlashCommandBuilder().setName('bassboost').setDescription('[Premium] Toggle bass boost filter'),
    new SlashCommandBuilder().setName('nightcore').setDescription('[Premium] Toggle nightcore filter'),
    new SlashCommandBuilder().setName('8d').setDescription('[Premium] Toggle 8D audio filter'),
    new SlashCommandBuilder().setName('china').setDescription('[Premium] Toggle china filter'),
    new SlashCommandBuilder().setName('chipmunk').setDescription('[Premium] Toggle chipmunk filter'),
    new SlashCommandBuilder().setName('clearfilters').setDescription('[Premium] Clear all active filters'),
    new SlashCommandBuilder().setName('slowmode').setDescription('[Premium] Toggle slowmode filter'),
    new SlashCommandBuilder().setName('treblebass').setDescription('[Premium] Toggle treble bass filter'),
    new SlashCommandBuilder().setName('tremolo').setDescription('[Premium] Toggle tremolo filter'),
    new SlashCommandBuilder().setName('vaporwave').setDescription('[Premium] Toggle vaporwave filter'),
    new SlashCommandBuilder().setName('vibrato').setDescription('[Premium] Toggle vibrato filter'),
    new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing track with live progress bar'),
    new SlashCommandBuilder().setName('help').setDescription('Show all commands and help menu'),
    new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency'),
    new SlashCommandBuilder().setName('invite').setDescription('Get the bot invite link'),
    new SlashCommandBuilder().setName('vote').setDescription('Vote for the bot on top.gg'),
    new SlashCommandBuilder().setName('sources').setDescription('Show supported music sources'),
    new SlashCommandBuilder().setName('support').setDescription('Get the support server link'),
    new SlashCommandBuilder().setName('uptime').setDescription('Show how long the bot has been online'),
    new SlashCommandBuilder().setName('profile').setDescription('View a user\'s profile and badges')
        .addUserOption(o => o.setName('user').setDescription('The user to view (leave empty for yourself)')),
    new SlashCommandBuilder().setName('setprefix').setDescription('Set a custom prefix for this server').addStringOption(o => o.setName('prefix').setDescription('New prefix (max 3 characters)').setRequired(true).setMaxLength(3)),
    new SlashCommandBuilder().setName('247').setDescription('Toggle 24/7 mode (stay in voice channel)'),
    new SlashCommandBuilder().setName('autoplay').setDescription('Toggle autoplay mode'),

    // Premium — server customization
    new SlashCommandBuilder().setName('customize').setDescription('[Premium] Customize the bot\'s icon and banner for this server')
        .addSubcommand(sub => sub.setName('view').setDescription('View current bot customization for this server'))
        .addSubcommand(sub => sub.setName('icon').setDescription('Set a custom bot icon for this server')
            .addStringOption(o => o.setName('url').setDescription('Direct image URL (.png, .jpg, .gif, .webp)').setRequired(true)))
        .addSubcommand(sub => sub.setName('banner').setDescription('Set a custom banner for this server')
            .addStringOption(o => o.setName('url').setDescription('Direct image URL (.png, .jpg, .gif, .webp)').setRequired(true)))
        .addSubcommand(sub => sub.setName('reset').setDescription('Remove bot customization for this server')
            .addStringOption(o => o.setName('target').setDescription('What to reset').addChoices({name:'Icon',value:'icon'},{name:'Banner',value:'banner'},{name:'Everything',value:'all'}))),

    // Premium commands
    new SlashCommandBuilder().setName('premium').setDescription('Check this server\'s premium status'),
    new SlashCommandBuilder().setName('redeem').setDescription('Redeem a premium code for this server')
        .addStringOption(o => o.setName('code').setDescription('Premium activation code').setRequired(true)),

    // Owner — premium management
    new SlashCommandBuilder().setName('genpremium').setDescription('Generate premium codes (Owner only)')
        .addStringOption(o => o.setName('duration').setDescription('Premium validity duration').setRequired(true)
            .addChoices(
                {name: '30 Days',  value: '30d'},
                {name: '90 Days',  value: '90d'},
                {name: '180 Days', value: '180d'},
                {name: '1 Year',   value: '365d'},
                {name: 'Lifetime', value: 'lifetime'}
            ))
        .addIntegerOption(o => o.setName('amount').setDescription('Number of codes to generate (max 10)').setMinValue(1).setMaxValue(10)),
    new SlashCommandBuilder().setName('revokepremium').setDescription('Revoke premium from a server (Owner only)')
        .addStringOption(o => o.setName('server_id').setDescription('The server ID to revoke premium from').setRequired(true)),
    new SlashCommandBuilder().setName('listpremium').setDescription('List all premium servers (Owner only)'),

    // Owner — no-prefix management
    new SlashCommandBuilder().setName('noprefix').setDescription('Manage no-prefix users (Owner only)')
        .addSubcommand(sub => sub.setName('add').setDescription('Grant a user no-prefix access')
            .addUserOption(o => o.setName('user').setDescription('The user to add').setRequired(true))
            .addStringOption(o => o.setName('scope').setDescription('Use "all" for all servers, or enter a specific server ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove a user\'s no-prefix access')
            .addUserOption(o => o.setName('user').setDescription('The user to remove').setRequired(true))
            .addStringOption(o => o.setName('scope').setDescription('Use "all" for all servers, or enter a specific server ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('show').setDescription('Show no-prefix users')
            .addStringOption(o => o.setName('scope').setDescription('Use "all" for all servers, or enter a specific server ID').setRequired(true))),

].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.token || config.token);
const guildId = process.argv[2]; // optional: pass a guild ID for instant registration

(async () => {
    try {
        if (guildId) {
            // ── Guild registration: INSTANT (for testing) ──
            console.log(`Registering ${commands.length} slash commands to guild ${guildId} (instant)...`);
            const data = await rest.put(
                Routes.applicationGuildCommands(config.clientId, guildId),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} commands to guild ${guildId}!`);
            console.log(`Commands visible in Discord immediately.`);
        } else {
            // ── Global registration: up to 1 hour to propagate ──
            console.log(`Registering ${commands.length} slash commands globally (may take up to 1 hour)...`);
            const data = await rest.put(
                Routes.applicationCommands(config.clientId),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} global slash commands!`);
        }
    } catch (error) {
        console.error('❌ Deploy failed:', error.message || error);
    }
})();
