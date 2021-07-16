<div align="center">
  <br />
  <p>
    <a href="https://discord.js.org"><img src="https://menhera-chan.in/img/Chiro.JS.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://discord.gg/djs"><img src="https://img.shields.io/discord/222078108977594368?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/v/discord.js.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/discord.js"><img src="https://img.shields.io/npm/dt/discord.js.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://github.com/discordjs/discord.js/actions"><img src="https://github.com/discordjs/discord.js/workflows/Testing/badge.svg" alt="Build status" /></a>
    <a href="https://www.patreon.com/discordjs"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
</div>

## About

chiro.js is a powerful [Node.js](https://nodejs.org) module that allows you to easily interact with the
[Nexus](https://discord.com/developers/docs/intro).


## Installation

**Node.js 14.0.0 or newer is required.**  

```sh-session
npm install chiro.js
```

## Example usage

```js
const { Client } = require("discord.js");
const { Manager } = require("chiro.js");
const client = new Client();
const manager = new Manager({    
    nodes:      
        {
            host: "localhost",
            port: 3000,
            password: "mostsecurepassword",
        },
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
}).on("trackStart", (player, track) => {
    console.log(`${track.title} has started`);
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    if (message.content === "play") {
        const player = manager.create({
            guild: message.guild.id,
            textChannel: message.channel.id,
            voiceChannel: message.member.voice.channel.id,
        });
        const res = await player.send({
            query: "play that funky music",
        });

        player.queue.add(res.tracks[0]);
        player.play();
    }
});

client.on('raw', (d)=>{
    manager.updateVoiceState(d);
})

client.login("token");
```

## Links

- [Website](https://chiro.openian.dev/) ([source](https://github.com/discordjs/website))
- [Documentation](chiro.openian.dev/#/docs/main/master/general/welcome)
- [Discord server](https://menhera-chan.in/support)
- [Nexus Discord server](https://discord.gg/snowflakedev)
- [GitHub](https://github.com/discordjs/discord.js)
- [NPM](https://www.npmjs.com/package/discord.js)


## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle
nudge in the right direction, please don't hesitate to join our official [Chiro.js Server](https://discord.gg/djs).
