<div align="center">
  <br />
  <p>
    <a href="https://chirojs.openian.dev"><img src="https://menhera-chan.in/img/Chiro.JS.svg" width="546" alt="discord.js" /></a>
  </p>
  <br />
  <p>
    <a href="https://menhera-chan.in/support"><img src="https://img.shields.io/discord/735899211677041099?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
    <a href="https://www.npmjs.com/package/chiro.js"><img src="https://img.shields.io/npm/v/chiro.js.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/chiro.js"><img src="https://img.shields.io/npm/dt/chiro.js.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://www.patreon.com/rohank05"><img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" /></a>
  </p>
</div>

## About

Chiro.js is a powerful [Node.js](https://nodejs.org) module that allows you to easily interact with the
[Nexus](https://github.com/DevSnowflake/Nexus). Chiro.js is highly inspired from [Erela.JS](https://github.com/MenuDocs/erela.js) which is a module for lavalink.


## Installation

**Node.js 14.0.0 or newer is required.**  

```sh-session
npm install chiro.js
```

## Example usage

```js
const Discord = require("discord.js");
const Chiro = require("chiro.js");
const client = new Discord.Client();
const manager = new Chiro.Manager({    
    nodes: [{ host: "localhost", port: 3000, password: "SwagLordNitroUser12345", secure: true }],
    onData(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    },
});

manager.on("ready", () => {
    console.log("Chiro manager is ready.");
});

manager.on("trackStart", (player, track) => {
    console.log(`${track.title} has started playing!`);
});

manager.on("error", console.log);

client.on("ready", () => {
    manager.init(client.user.id);
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
    if (message.content === "play") {
        const player = await manager.createPlayer({
            guild: message.guild.id,
            textChannel: message.channel.id,
            voiceChannel: message.member.voice.channel.id,
        });

        const response = await player.search({ query: "play that funky music" });
        player.queue.add(response.tracks[0]);
        await player.connect().then(p => p.play());
    }
});

client.on('raw', manager.updateVoiceState.bind(manager));

client.login("token");
```

## Links

- [Website](https://chirojs.openian.dev/)
- [Documentation](https://chirojs.openian.dev/)
- [Discord server](https://menhera-chan.in/support)
- [Nexus Discord server](https://snowflakedev.org/discord)
- [GitHub](https://github.com/DevSnowflake/chiro.js)
- [NPM](https://www.npmjs.com/package/chiro.js)

## Help

If you don't understand something in the documentation, you are experiencing problems, or you just need a gentle nudge in the right direction kindly create an github issue or join our official [Chiro.js Support Server](https://snowflakedev.org/discord).