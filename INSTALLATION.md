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

###  📋 Traspile and Run
* Stelle is made in `Typescript` but runs in `Javascript`.
```bash
#You can use the test command
pnpm test #It will do everything for you!

#Or you can do it step-by-step
pnpm clean #Will redo the dist folder
pnpm start #Will startthe bot
```

### 🔎 Looking for a lavalink node?
> Stelle needs a [`Lavalink node`](https://github.com/lavalink-devs/Lavalink) to play music.
> See [self hosting a node](/LAVALINK.md) for more.