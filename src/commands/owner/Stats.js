const { EmbedBuilder } = require("discord.js");
const AvonCommand = require("../../structures/avonCommand");
const os = require("os");

class Stats extends AvonCommand{
    get name(){
        return 'stats'
    }
    get aliases(){
        return ['botstats','statistics','botinfo'];
    }
    async run(client,message,args,prefix){
        try{
            if(!client.config.owners.includes(message.author.id)) return;

            const totalServers = client.guilds.cache.size;
            const totalUsers = client.guilds.cache.reduce((a,b) => a + b.memberCount, 0);
            const activePlayers = client.poru.players.size;

            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            const memUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const memTotal = (os.totalmem() / 1024 / 1024).toFixed(2);
            const cpuLoad = os.loadavg()[0].toFixed(2);
            const ping = client.ws.ping;

            let premiumCount = 0;
            for(let g of client.guilds.cache.values()){
                let isPremium = await client.data.get(`premium_${g.id}`);
                if(isPremium) premiumCount++;
            }

            const embed = new EmbedBuilder()
                .setColor(`#FFD700`)
                .setAuthor({name: `| ${client.user.username} Statistics`, iconURL: client.user.displayAvatarURL({dynamic: true})})
                .addFields(
                    {name: `${client.emoji.servers} Servers`, value: `\`${totalServers}\``, inline: true},
                    {name: `${client.emoji.members} Users`, value: `\`${totalUsers.toLocaleString()}\``, inline: true},
                    {name: `${client.emoji.player} Active Players`, value: `\`${activePlayers}\``, inline: true},
                    {name: `${client.emoji.premium} Premium Servers`, value: `\`${premiumCount}\``, inline: true},
                    {name: `${client.emoji.ping} Ping`, value: `\`${ping}ms\``, inline: true},
                    {name: `${client.emoji.uptime} Uptime`, value: `\`${uptimeStr}\``, inline: true},
                    {name: `${client.emoji.ram} RAM Usage`, value: `\`${memUsed} MB / ${memTotal} MB\``, inline: true},
                    {name: `${client.emoji.cpu} CPU Load`, value: `\`${cpuLoad}%\``, inline: true},
                    {name: `${client.emoji.nodejs} Node.js`, value: `\`${process.version}\``, inline: true},
                )
                .setThumbnail(client.user.displayAvatarURL({dynamic: true}))
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({dynamic: true})})
                .setTimestamp();

            return message.channel.send({embeds: [embed]});
        } catch(e){ console.log(e) }
    }
}
module.exports = Stats;
