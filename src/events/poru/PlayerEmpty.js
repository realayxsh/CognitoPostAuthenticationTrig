const delay = require("delay");
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const AvonClientEvent = require("../../structures/Eventhandler");

// Max history size — keeps last N song URIs to avoid repeats
const HISTORY_LIMIT = 30;

// Detect language from song title + author so autoplay stays in the same language
function detectLanguage(title, author) {
    const text = `${title} ${author}`;
    // Gurmukhi script (Punjabi)
    if (/[\u0A00-\u0A7F]/.test(text)) return 'punjabi';
    // Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(text)) return 'hindi';

    const lower = text.toLowerCase();

    // Well-known Punjabi artists (romanized)
    const punjabiArtists = [
        'diljit','sidhu moosewala','moosewala','ap dhillon','shubh','karan aujla',
        'babbu maan','gurdas maan','ammy virk','jordan sandhu','parmish verma',
        'mankirt aulakh','b praak','jassi gill','harrdy sandhu','kulwinder billa',
        'ninja','satinder sartaaj','jazzy b','sukshinder shinda','hans raj hans',
        'gurnam bhullar','himmat sandhu','ranjit bawa','dilpreet dhillon','jass manak',
        'guri','deep jandu','bohemia','imran khan','garry sandhu','sharry mann',
        'akhil','jaani','surjit bindrakhia','labh heera','kanwar grewal'
    ];
    // Well-known Hindi/Bollywood artists (romanized)
    const hindiArtists = [
        'arijit singh','shreya ghoshal','atif aslam','lata mangeshkar','kishore kumar',
        'jubin nautiyal','darshan raval','armaan malik','neha kakkar','yo yo honey singh',
        'badshah','guru randhawa','vishal mishra','mohd rafi','mukesh','sonu nigam',
        'kumar sanu','udit narayan','alka yagnik','asha bhosle','sunidhi chauhan',
        'palak muchhal','asees kaur','tulsi kumar','kanika kapoor','mika singh',
        'himesh reshammiya','ankit tiwari','dev negi','akhil sachdeva','javed ali',
        'shankar mahadevan','kailash kher','rahat fateh ali','bollywood','filmi'
    ];
    // Punjabi keywords in titles
    const punjabiKeywords = ['punjabi','punjab','bhangra','giddha','patiala','ludhiana','chandigarh'];
    // Hindi keywords in titles
    const hindiKeywords = ['hindi','bollywood','filmi','desi','hindustani','urdu'];

    if (punjabiArtists.some(a => lower.includes(a))) return 'punjabi';
    if (hindiArtists.some(a => lower.includes(a))) return 'hindi';
    if (punjabiKeywords.some(k => lower.includes(k))) return 'punjabi';
    if (hindiKeywords.some(k => lower.includes(k))) return 'hindi';

    return 'english';
}

// Build language-locked queries so autoplay stays in the same language/genre
function buildQueries(title, author, lang) {
    const yr = new Date().getFullYear();
    if (lang === 'punjabi') {
        const q = [];
        if (author) q.push(`${author} Punjabi songs`);
        if (author) q.push(`${author} new songs`);
        if (title)  q.push(`${title} Punjabi`);
        q.push(`new Punjabi songs ${yr}`);
        q.push(`top Punjabi hits ${yr}`);
        q.push('best Punjabi songs');
        return q;
    }
    if (lang === 'hindi') {
        const q = [];
        if (author) q.push(`${author} Hindi songs`);
        if (author) q.push(`${author} new songs`);
        if (title)  q.push(`${title} Bollywood`);
        q.push(`new Hindi songs ${yr}`);
        q.push(`top Bollywood hits ${yr}`);
        q.push('best Hindi songs');
        return q;
    }
    // English / default
    const q = [];
    if (author && title) q.push(`${author} - ${title} radio`);
    if (author)          q.push(`${author} mix`);
    if (title)           q.push(`${title} similar songs`);
    if (author)          q.push(`${author} songs`);
    q.push('popular songs');
    return q;
}

function getHistory(player) {
    if (!player.data.get('apHistory')) player.data.set('apHistory', []);
    return player.data.get('apHistory');
}

function addToHistory(player, track) {
    const history = getHistory(player);
    const id = track.uri || track.title;
    if (!history.includes(id)) {
        history.push(id);
        if (history.length > HISTORY_LIMIT) history.shift();
    }
    player.data.set('apHistory', history);
}

function filterNew(tracks, player) {
    const history = getHistory(player);
    return tracks.filter(t => {
        const id = t.uri || t.title;
        return !history.includes(id);
    });
}

class PlayerEmpty extends AvonClientEvent{
    get name(){ return 'playerEmpty'; }
    async run(player){
        let data = await this.client.data.get(`${player.guildId}-247`);
        if(!data || data === null) this.client.data.set(`${player.guildId}-247`, `disabled`);
        const is247 = data === `enabled`;

        let db = await this.client.data.get(`${player.guildId}-autoPlay`);
        if(!db || db === null) this.client.data.set(`${player.guildId}-autoPlay`, `disabled`);

        if(db === `enabled`){
            try {
                const prev = player.data.get('previousTrack') || (Array.isArray(player.queue.previous) ? player.queue.previous[0] : player.queue.previous);
                const title  = prev?.title  || '';
                const author = prev?.author || '';

                // Detect language so queries stay in the same language
                const lang = detectLanguage(title, author);
                console.log(`[Autoplay] Guild: ${player.guildId} | Prev: "${title}" by "${author}" | Lang: ${lang}`);

                // Add the last played track to history so it doesn't repeat
                if (prev) addToHistory(player, prev);

                // Build language-aware queries and rotate through them
                const queries = buildQueries(title, author, lang);

                const qIdx = (player.data.get('apQueryIdx') || 0) % queries.length;
                player.data.set('apQueryIdx', qIdx + 1);
                const query = queries[qIdx];
                console.log(`[Autoplay] Query: "${query}"`);

                // Try Spotify first (up to 2 attempts), then SoundCloud as fallback
                const engines = ['spotify', 'soundcloud'];
                let picked = null;

                for (const engine of engines) {
                    const attempts = engine === 'spotify' ? 2 : 1;
                    for (let attempt = 1; attempt <= attempts; attempt++) {
                        try {
                            const result = await player.search(query, { engine, requester: this.client.user });
                            console.log(`[Autoplay][${engine}] attempt ${attempt} Results: ${result?.tracks?.length ?? 0}`);
                            if (!result || !result.tracks.length) {
                                if (attempt < attempts) await new Promise(r => setTimeout(r, 600));
                                continue;
                            }

                            // Filter out songs already played this session
                            const fresh = filterNew(result.tracks, player);
                            const pool = fresh.length ? fresh : result.tracks.filter(t => {
                                const id = t.uri || t.title;
                                const prev_id = prev ? (prev.uri || prev.title) : null;
                                return id !== prev_id;
                            });

                            if (pool.length) {
                                picked = pool[Math.floor(Math.random() * Math.min(pool.length, 8))];
                                console.log(`[Autoplay] Picked: "${picked.title}" via ${engine}`);
                                break;
                            }
                        } catch(e) {
                            console.error(`[Autoplay][${engine}] attempt ${attempt} error:`, e.message);
                            if (attempt < attempts) await new Promise(r => setTimeout(r, 600));
                        }
                    }
                    if (picked) break;
                }

                if (picked) {
                    player.queue.add(picked);
                    console.log(`[Autoplay] Calling play()...`);
                    await player.play().catch(e => console.error('[Autoplay] play() error:', e.message));
                    console.log(`[Autoplay] play() completed`);
                    return;
                }

                console.warn(`[Autoplay] No track found for query: "${query}"`);
            } catch(e) { console.error('[Autoplay] Outer error:', e.message, e.stack); }
        }

        if(db !== `enabled` && !is247){
            let ch = this.client.channels.cache.get(player.textId);
            if(!ch) ch = await this.client.channels.fetch(player.textId).catch(() => null);
            let guild = this.client.guilds.cache.get(player.guildId);
            if(ch){
                const container = new ContainerBuilder()
                    .addSectionComponents(
                        new SectionBuilder()
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**| Queue Concluded**`))
                            .setThumbnailAccessory(new ThumbnailBuilder().setURL(guild?.iconURL({ dynamic: true }) || this.client.user.displayAvatarURL()))
                    );
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(`https://top.gg/bot/1097475016880304180/vote`).setLabel(`Vote`)
                );
                ch.send({ flags: [MessageFlags.IsComponentsV2], components: [container, row] }).catch(() => {});
            }
        }

        if(is247) return;

        await delay(180000);
        let activePlayer = this.client.poru.players.get(player.guildId);
        if(!activePlayer) return;
        if(activePlayer.isPlaying || activePlayer.queue.size > 0 || activePlayer.queue.current) return;
        activePlayer.destroy().catch(() => {});
        let ch = this.client.channels.cache.get(player.textId);
        if(!ch){
            let channel = await this.client.channels.fetch(player.textId).catch(() => null);
            if(!channel) return;
            else ch = channel;
        }
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `${this.client.emoji.cross} | Enable 247 mode of **${this.client.user.username}** to keep me in the voice channel.`
            ));
        ch.send({ flags: [MessageFlags.IsComponentsV2], components: [container] });
    }
}
module.exports = PlayerEmpty;
