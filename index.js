require("dotenv").config();
const fs = require("fs");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const readline = require("readline");

const API_ID = parseInt(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const PHONE_NUMBERS = process.env.TELEGRAM_PHONE_NUMBERS.split(",");
const TOKEN_PATH = ".";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function saveToken(phoneNumber, token) {
  const sessionPath = `${TOKEN_PATH}/tokens.json`;
  let tokens = {};
  if (fs.existsSync(sessionPath)) {
    const fileContent = fs.readFileSync(sessionPath);
    tokens = JSON.parse(fileContent);
  }
  tokens[phoneNumber] = token;
  fs.writeFileSync(sessionPath, JSON.stringify(tokens, null, 2));
  console.log(`Token saved to ${sessionPath}`);
}

async function getToken(phoneNumber) {
  const stringSession = new StringSession("");

  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: () => phoneNumber,
    password: async () =>
      new Promise((resolve) =>
        rl.question(
          "Please enter your password (If you haven't set one, just press enter): ",
          resolve
        )
      ),
    phoneCode: async () =>
      new Promise((resolve) =>
        rl.question("Please enter the code you received: ", resolve)
      ),
    onError: (err) => console.log(err),
  });
  console.log("You should now be connected.");
  const token = client.session.save();
  saveToken(phoneNumber, token);
}

function main() {
  if (!API_ID || !API_HASH) {
    console.error("Please set the API_ID and API_HASH env variables.");
    process.exit(1);
  }
  if (!PHONE_NUMBERS.length) {
    console.error("Please set the TELEGRAM_PHONE_NUMBERS env variable.");
    process.exit(1);
  }
  if (TOKEN_PATH !== "." && TOKEN_PATH !== "./" && TOKEN_PATH && !fs.existsSync(TOKEN_PATH)) {
    fs.mkdirSync(TOKEN_PATH);
  }
  PHONE_NUMBERS.forEach((phoneNumber) => {
    getToken(phoneNumber);
  });
  console.log("You can now close this window.");
}

main();