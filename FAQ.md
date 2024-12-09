## 🔎 FAQ

* Something is missing? Please let me know.

---

### 🔎 Q: I'm getting: `Error: 401: Unauthorized 0`
![Q](https://i.imgur.com/QnpxyTb.png)
* R: Make sure you filled the `.env` file with a valid discord token.

---

### 🔎 Q: I'm getting: `Error: Missing Access 50001`
![Q](https://i.imgur.com/pxEf72k.png)
* R1: If you already changed the IDs in the config, please rebuild the code.
* R2. Go to [`Configuration.ts`](/src/structures/utils/data/Configuration.ts) and change the `guildIds` array,

---

### 🔎 Q: I'm getting the prisma error: `Error: P1013`
![Q](https://i.imgur.com/LzVyd0y.png)
* R: Make sure you **followed** the example database url format. (or you can see it [here](https://www.prisma.io/docs/orm/overview/databases/mongodb#connection-details))

---

### 🔎 Q: I'm getting the MongoDB error: `Server selection timeout: No available servers.`
![Q](https://i.imgur.com/X0QsqbJ.png)
* R: You need to **WHITELIST** your IP in order to access your mongodb cluster.
