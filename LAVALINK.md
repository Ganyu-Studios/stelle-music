## ⚙️ Installation

* Trying to run a Lavalink? Here are a few brief steps.

> [!IMPORTANT]
> If you don't want to host your own node, you can consider using one of the [public nodes](https://lavalink.darrennathanael.com) maintained by the community.

###  📋 Install Java
* This in case you do not have Java installed.
1. Go to [this site](https://adoptium.net/es/temurin/releases/?package=jdks)
2. Look for your OS. (Windows, Linux, etc...)
3. Select the Java version of your choice (17 or newer)
4. Download the .msi file
5. Install

###  📋 Lavalink node
* Go to the Lavalink repository and download the [latest version](https://github.com/lavalink-devs/Lavalink/releases).
1. Create a directory.
2. Go to your directory with cd. `cd my-node`
3. Drop the jar with the `application.yml`
4. Start the node.

You can use my example:

- [`application.yml`](https://github.com/Ganyu-Studios/stelle-music/blob/main/assets/application.yml)
- [`start scripts`](https://github.com/Ganyu-Studios/stelle-music/tree/main/assets)

*Just do `./start.bat` if you are on Windows*
*Or `sh start.sh` if you are on a ubuntu server*

### 📋 Using the node
* Just, go to the [configuration](https://github.com/Ganyu-Studios/stelle-music/blob/main/src/structures/utils/data/Configuration.ts#L17) of Stelle and add the node to the list.