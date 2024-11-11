## ⚙️ Installation

* Trying to run Stelle? Here are a few brief steps.
* I will assume you have [the requirements](https://github.com/Ganyu-Studios/stelle-music?tab=readme-ov-file#%EF%B8%8F-minimum-requeriments) to even get started.

###  📋 Clone the repo
* There is not much science on this.... Right?
```bash
git clone https://github.com/Ganyu-Studios/stelle-music.git
```

###  📋 Install Dependencies
* There is not much science on this.
```bash
cd stelle-music
pnpm i
```

###  📋 Configuration
* Stelle has a configuration to save a specific data.

> 1. Go to [the configuration](/src/structures/utils/data/Configuration.ts#L17-L22)
> 2. Replace the IDs with your IDs.

> Example:
```js
guildIds: [
    "123", // Example Guild
    "456", // Example Guild 2
    ...
];
```

###  📋 Traspile and Run
* Stelle is made in `Typescript` but she can runs in `Javascript`.

Run the bot in `Javascript`

```bash
#This is necessary for typescript.
pnpm prisma generate #Generate types for prisma.

#Or you can do it step-by-step
pnpm clean #Will re-create the dist folder
pnpm start #Will start the bot
```

Run the bot in `Typescript`

```bash
#This is necessary for typescript.
pnpm prisma generate #Generate types for prisma.

#And run it!
pnpm dev

``` 

### 🔎 Looking for a lavalink node?
> Stelle needs a [`Lavalink node`](https://github.com/lavalink-devs/Lavalink) to play music.
> See [self hosting a node](/LAVALINK.md) for more.