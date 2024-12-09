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

###  📋 Database
* Stelle uses Prisma ORM to manage the database.

When prisma is installed the first time (or update prisma) prisma needs to generate the types to work.

1. Run `pnpm prisma generate` to generate the types

This also applies when you make changes in the [schema](/prisma/schema.prisma), you need to generate the new types.

> [!NOTE]
> You can execute also `pnpm prisma db push` to synchronize the database.<br>
> This needs to be executed when you make changes in the [schema](/prisma/schema.prisma)


###  📋 Environment Variables
* Stelle needs some environment variables to work.

1. Copy the `.env.example` file. (localed in the root of the project)
2. Rename the file to: `.env`.
3. Fill the required variables. ([available variables](/.env.example))

> [!IMPORTANT]
> You need to follow the example url format.<br>
> You can learn more about the prisma url format [here](https://www.prisma.io/docs/orm/overview/databases/mongodb#connection-details)


###  📋 Configuration
* Stelle has a configuration to save a specific data.

> 1. Go to [the configuration](/src/structures/utils/data/Configuration.ts#L18-L23)
> 2. Replace the IDs with your IDs.

> Example:
```js
guildIds: [
    "123", // Example guild id
    "456", // Another example guild id
    ...
];
```

* Don't forget to change the channel ids.
> 1. Go to [the configuration](/src/structures/utils/data/Configuration.ts#L39-L41)
> 2. Replace the IDs with your IDs.

```js
channels: {
    guildsId: "1234", // Example channel id
    errorsId: "45678", // Another example channel id
}
```

* Don't forget to change the user ids.
> 1. Go to [the configuration](/src/structures/utils/data/Configuration.ts#L15-L17)
> 2. Replace the IDs with your IDs.

```js
developerIds: [
    "1234", // Example user id
    "5678", // Another example user id
    ...
];
```

###  📋 Traspile and Run
* Stelle is made in `Typescript` but she can runs in `Javascript`.

Run the bot in `Javascript`

```bash
# This is necessary for typescript.
pnpm prisma generate # Generate types for prisma.

# Or you can do it step-by-step
pnpm clean # Will re-create the dist folder
pnpm start # Will start the bot
```

Run the bot in `Typescript`

```bash
# This is necessary for typescript.
pnpm prisma generate # Generate types for prisma.

# And run it!
pnpm dev

``` 

### 🔎 Looking for a lavalink node?
> Stelle needs a [`Lavalink node`](https://github.com/lavalink-devs/Lavalink) to play music.
> See [self hosting a node](/LAVALINK.md) for more.