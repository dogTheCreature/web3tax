const Decimal = require("decimal");
const yaml = require("js-yaml");
const fs = require("fs");
const { setTimeout } = require('timers/promises');

const config = yaml.load(fs.readFileSync("config.yaml"));
const API_KEY = config.apiKey;
const ADDRESS = config.address;
const STETH_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

const api = require("etherscan-api").init(API_KEY);

function wei2eth(input) {
    const wei = typeof input === "string" ? Decimal(input) : input;

    return wei.div("1000000000000000000");
}

function erc20ValueToReadable(erc20) {
    return Decimal(erc20.value).div(Decimal("1" + "0".repeat(Number(erc20.tokenDecimal) - 1)));
}

async function main() {
    
    // トランザクション一覧
    const transactions = await api.account.txlist(ADDRESS);
    // console.debug(transactions.result);

    for (const tx of transactions.result) {
        console.log("%s, Timestamp: %s, value: %s",
            tx.from.toLowerCase() == ADDRESS.toLowerCase() ? "<OUT>" : "<IN> ",
            new Date(Number(tx.timeStamp) * 1000).toString(),
            wei2eth(tx.value)
        );
        // console.log(tx.timeStamp);
    }

    // ERC20関連
    const erc20Txs = await api.account.tokentx(ADDRESS);
    const tokenDict = {};
    // console.debug(erc20Txs.result);

    for (const tx of erc20Txs.result) {
        console.log("%s, Token: %s, Timestamp: %s, value: %s",
            tx.from.toLowerCase() == ADDRESS.toLowerCase() ? "<OUT>" : "<IN> ",
            tx.tokenName,
            new Date(Number(tx.timeStamp) * 1000).toString(),
            erc20ValueToReadable(tx)
        );
        if (!tokenDict[tx.tokenName]) {
            tokenDict[tx.tokenName] = tx;
        }
        // console.log(tx);
    }
    
    // 残高表示
    const balance = await api.account.balance(ADDRESS);
    console.log("Balance: %s", wei2eth(balance.result));

    for (key in tokenDict) {
        const token = tokenDict[key];
        const stEthBalance = await api.account.tokenbalance(ADDRESS, "", token.contractAddress);
        console.log("%s; %d", token.tokenSymbol, Decimal(stEthBalance.result).div(Decimal("1" + "0".repeat(Number(token.tokenDecimal)))));
        await setTimeout(500);
    }
}

main();