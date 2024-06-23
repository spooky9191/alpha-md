const { alpha, isAdmin, parseJid, isPrivate, errorHandler } = require("../lib");

alpha(
  {
    pattern: "delttt",
    fromMe: isPrivate,
    desc: "Delete TicTacToe running game.",
    type: "game",
    dontAddCommandList: true,
  },
  async (message, match, m) => {
    try {
      let isadmin = await isAdmin(message.jid, message.user, message.client);

      if (!isadmin) {
        return message.reply(
          "This command is only for Group Admin and my owner."
        );
      }

      this.game = this.game ? this.game : {};

      if (
        Object.values(this.game).find((room) =>
          room.id.startsWith("tictactoe")
        )
      ) {
        delete this.game;
        return message.reply(`_Successfully Deleted running TicTacToe game._`);
      } else {
        return message.reply(`No TicTacToe game🎮 is running.`);
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    pattern: "ttt",
    fromMe: false,
    desc: "Play TicTacToe",
    type: "game",
  },
  async (message, match, m) => {
    try {
      let TicTacToe = require("../lib/tictactoe");
      this.game = this.game ? this.game : {};

      if (  
        Object.values(this.game).find(
          (room) =>
            room.id.startsWith("tictactoe") &&
            [room.game.playerX, room.game.playerO].includes(m.sender)
        )
      )
        return message.reply("_You're already in a game_");

      let room = Object.values(this.game).find(
        (room) =>
          room.state === "WAITING" && (match ? room.name === match : true)
      );

      if (room) {
        room.o = message.jid;
        room.game.playerO = message.participant || message.mention[0];
        room.state = "PLAYING";

        let arr = room.game.render().map((v) => {
          return {
            X: "❌",
            O: "⭕",
            1: "1️⃣",
            2: "2️⃣",
            3: "3️⃣",
            4: "4️⃣",
            5: "5️⃣",
            6: "6️⃣",
            7: "7️⃣",
            8: "8️⃣",
            9: "9️⃣",
          }[v];
        });

        let str = `*_TicTacToe_*

${arr.slice(0, 3).join("")}
${arr.slice(3, 6).join("")}
${arr.slice(6).join("")}

Current turn: @${room.game.currentTurn.split("@")[0]}
`;
        let mentions = [room.game.playerX, room.game.playerO];
        await message.client.sendMessage(message.jid, { text: str, mentions });
      } else {
        room = {
          id: "tictactoe-" + +new Date(),
          x: message.jid,
          o: "",
          game: new TicTacToe(m.sender, "x"),
          state: "WAITING",
        };
        if (match) room.name = match;
        message.reply("_Waiting for a partner_ ");
        this.game[room.id] = room;
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

alpha(
  {
    on: "text",
    fromMe: false,
    pattern: false,
    dontAddCommandList: true,
  },
  async (message, match, m) => {
    try {
      this.game = this.game ? this.game : {};

      let room = Object.values(this.game).find(
        (room) =>
          room.id &&
          room.game &&
          room.state &&
          room.id.startsWith("tictactoe") &&
          [room.game.playerX, room.game.playerO].includes(m.sender) &&
          room.state === "PLAYING"
      );

      if (room) {
        let isSurrender = false;

        if (/^surr?ender$/i.test(message.text)) {
          isSurrender = true;
        } else if (!/^[1-9]$/.test(message.text)) {
          return; // If not a valid move or surrender command, return
        }

        if (isSurrender) {
          let surrenderingPlayer = m.sender === room.game.playerX ? room.game.playerX : room.game.playerO;
          delete this.game[room.id]; 

          let str = `@${surrenderingPlayer.split("@")[0]} surrendered.`;
let mentions = [surrenderingPlayer];
await message.client.sendMessage(message.jid, { text: str, mentions });
          return;
        }
        let ok;
        let isWin = false;
        let isTie = false;

        if (m.sender !== room.game.currentTurn) {
          return true; // Not the player's turn
        }

        if (
          1 >
          (ok = room.game.turn(
            m.sender === room.game.playerO,
            parseInt(match) - 1
          ))
        ) {
          message.reply({
            "-3": "The game is over",
            "-2": "Invalid",
            "-1": "_Invalid Position_",
            0: "_Invalid Position_",
          }[ok]);
          return true;
        }

        if (m.sender === room.game.winner) {
          isWin = true;
        } else if (room.game.board === 511) {
          isTie = true;
        }

        let arr = room.game.render().map((v) => {
          return {
            X: "❌",
            O: "⭕",
            1: "1️⃣",
            2: "2️⃣",
            3: "3️⃣",
            4: "4️⃣",
            5: "5️⃣",
            6: "6️⃣",
            7: "7️⃣",
            8: "8️⃣",
            9: "9️⃣",
          }[v];
        });

        let mentions = [room.game.playerX, room.game.playerO];

        if (isWin || isTie) {
          delete this.game[room.id];
        }

        let winner = room.game.winner;
        let str = `Room ID: ${room.id}

${arr.slice(0, 3).join("")}
${arr.slice(3, 6).join("")}
${arr.slice(6).join("")}

${
  isWin
    ? `@${winner.split("@")[0]} Won !`
    : isTie
    ? `Tie`
    : `Current Turn ${["❌", "⭕"][1 * room.game._currentTurn]} @${
        room.game.currentTurn.split("@")[0]
      }`
}
❌: @${room.game.playerX.split("@")[0]}
⭕: @${room.game.playerO.split("@")[0]}`;

        await message.client.sendMessage(message.jid, { text: str, mentions });
      }
    } catch (error) {
      errorHandler(message, error);
    }
  }
);

