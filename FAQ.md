## 🔎 FAQ

### 🔎 Q: I'm getting: `Error: 401: Unauthorized 0`
![Q](https://i.imgur.com/QnpxyTb.png)
* R: Make sure you filled the `.env` file with a valid discord token.

### 🔎 Q: I'm getting: `Error: Missing Access 50001`
![Q](https://i.imgur.com/pxEf72k.png)
* R1: If you already changed the IDs in the config, please rebuild the code.
* R2. Go to [`Configuration.ts`](/src/structures/utils/data/Configuration.ts) and change the `guildIds` array,

