import { getAddress, isAddress } from '@ethersproject/address';
import fs from 'fs';
import path from 'path';
import { request, gql } from 'graphql-request';
import slugify from 'slugify';
import _ from 'lodash';
import { createPublicClient, http } from 'viem';
import { mainnet, bsc, polygonZkEvm, zkSync, arbitrum, base } from 'viem/chains';

const LISTS = {
    "pancakeswap-aptos": {
        name: "PancakeSwap Aptos",
        keywords: ["pancakeswap", "aptos"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
        schema: "aptos",
        test: {
            skipLogo: true,
            aptos: true,
        },
    },
    "pancakeswap-zksync-default": {
        name: "PancakeSwap Zksync Default",
        keywords: ["pancakeswap", "default", "zksync"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-linea-default": {
        name: "PancakeSwap Linea Default",
        keywords: ["pancakeswap", "default", "linea"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-base-default": {
        name: "PancakeSwap Base Default",
        keywords: ["pancakeswap", "default", "base"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-polygon-zkevm-default": {
        name: "PancakeSwap Zkevm Default",
        keywords: ["pancakeswap", "default", "polygon", "zkevm"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-arbitrum-default": {
        name: "PancakeSwap Arbitrum Default",
        keywords: ["pancakeswap", "default", "arbitrum"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-eth-default": {
        name: "PancakeSwap Ethereum Default",
        keywords: ["pancakeswap", "default", "ethereum"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-eth-mm": {
        name: "PancakeSwap Ethereum MM",
        keywords: ["pancakeswap", "mm", "ethereum"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-bnb-mm": {
        name: "PancakeSwap BNB Chain MM",
        keywords: ["pancakeswap", "mm", "bnb"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-default": {
        name: "PancakeSwap Default",
        keywords: ["pancakeswap", "default"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-extended": {
        name: "PancakeSwap Extended",
        keywords: ["pancakeswap", "extended"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    "pancakeswap-top-100": {
        name: "PancakeSwap Top 100",
        keywords: ["pancakeswap", "top 100"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    "pancakeswap-top-15": {
        name: "PancakeSwap Top 15",
        keywords: ["pancakeswap", "top 15"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    coingecko: {
        name: "CoinGecko",
        keywords: ["defi"],
        logoURI: "https://tokens.pancakeswap.finance/images/projects/coingecko.png",
        sort: true,
        test: {
            skipLogo: true,
            aptos: false,
        },
    },
    cmc: {
        name: "CoinMarketCap",
        keywords: ["defi"],
        logoURI: "https://ipfs.io/ipfs/QmQAGtNJ2rSGpnP6dh6PPKNSmZL8RTZXmgFwgTdy5Nz5mx",
        sort: true,
        test: {
            skipLogo: true,
            aptos: false,
        },
    },
    "pancakeswap-mini": {
        name: "PancakeSwap Mini",
        keywords: ["pancakeswap", "binance", "mini program", "mini"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    "pancakeswap-mini-extended": {
        name: "PancakeSwap Mini Ext",
        keywords: ["pancakeswap", "binance", "mini program", "mini", "extended"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    "pancakeswap-onramp": {
        name: "PancakeSwap Onramp",
        keywords: ["pancakeswap", "onramp"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: true,
    },
    "pancakeswap-opbnb-default": {
        name: "PancakeSwap opBNB Default",
        keywords: ["pancakeswap", "default", "opbnb"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
    "pancakeswap-scroll-default": {
        name: "PancakeSwap Scroll Default",
        keywords: ["pancakeswap", "default", "scroll"],
        logoURI: "https://pancakeswap.finance/logo.png",
        sort: false,
    },
};

var VersionBump;
(function (VersionBump) {
    VersionBump["major"] = "major";
    VersionBump["minor"] = "minor";
    VersionBump["patch"] = "patch";
})(VersionBump = VersionBump || (VersionBump = {}));
const getNextVersion = (currentVersion, versionBump) => {
    const { major, minor, patch } = currentVersion;
    switch (versionBump) {
        case VersionBump.major:
            return { major: major + 1, minor, patch };
        case VersionBump.minor:
            return { major, minor: minor + 1, patch };
        case VersionBump.patch:
        default:
            return { major, minor, patch: patch + 1 };
    }
};
const buildList = async (listName, versionBump) => {
    const { name, keywords, logoURI, sort } = LISTS[listName];
    const { version: currentVersion } = await Bun.file(`lists/${listName}.json`).json();
    const version = getNextVersion(currentVersion, versionBump);
    const list = await Bun.file(`src/tokens/${listName}.json`).json();
    return {
        name,
        timestamp: new Date().toISOString(),
        version,
        logoURI,
        keywords: keywords,
        // @ts-ignore
        schema: "schema" in LISTS[listName] ? LISTS[listName].schema : undefined,
        // sort them by symbol for easy readability (not applied to default list)
        tokens: sort
            ? list.sort((t1, t2) => {
                if (t1.chainId === t2.chainId) {
                    // CAKE first in extended list
                    if ((t1.symbol === "CAKE") !== (t2.symbol === "CAKE")) {
                        return t1.symbol === "CAKE" ? -1 : 1;
                    }
                    return t1.symbol.toLowerCase() < t2.symbol.toLowerCase() ? -1 : 1;
                }
                return t1.chainId < t2.chainId ? -1 : 1;
            })
            : list,
    };
};
const saveList = async (tokenList, listName) => {
    const tokenListFile = Bun.file(new URL(`../lists/${listName}.json`, import.meta.url).pathname);
    const stringifiedList = JSON.stringify(tokenList, null, 2);
    await Bun.write(tokenListFile, stringifiedList);
    console.info("Token list saved to ", tokenListFile);
};

const checksumAddresses = async (listName) => {
    let badChecksumCount = 0;
    if (listName === "pancakeswap-aptos") {
        console.info("Ignore Aptos address checksum");
        return;
    }
    const file = Bun.file(`src/tokens/${listName}.json`);
    const listToChecksum = await file.json();
    const updatedList = listToChecksum.reduce((tokenList, token) => {
        const checksummedAddress = getAddress(token.address);
        if (checksummedAddress !== token.address) {
            badChecksumCount += 1;
            const updatedToken = { ...token, address: checksummedAddress };
            return [...tokenList, updatedToken];
        }
        return [...tokenList, token];
    }, []);
    if (badChecksumCount > 0) {
        console.info(`Found and fixed ${badChecksumCount} non-checksummed addreses`);
        const file = Bun.file(`src/tokens/${listName}.json`);
        console.info("Saving updated list");
        const stringifiedList = JSON.stringify(updatedList, null, 2);
        await Bun.write(file, stringifiedList);
        console.info("Checksumming done!");
    }
    else {
        console.info("All addresses are already checksummed");
    }
};

const compareLists = async (listName) => {
    const src = await Bun.file(`src/tokens/${listName}.json`).json();
    const actual = await Bun.file(`lists/${listName}.json`).json();
    // const { name, src, actual } = listPair;
    if (src.length !== actual.tokens.length) {
        throw Error(`List ${listName} seems to be not properly regenerated. Soure file has ${src.length} tokens but actual list has ${actual.tokens.length}. Did you forget to run yarn makelist?`);
    }
    src.sort((t1, t2) => (t1.address < t2.address ? -1 : 1));
    actual.tokens.sort((t1, t2) => (t1.address < t2.address ? -1 : 1));
    src.forEach((srcToken, index) => {
        if (JSON.stringify(srcToken) !== JSON.stringify(actual.tokens[index])) {
            throw Error(`List ${listName} seems to be not properly regenerated. Tokens from src/tokens directory don't match up with the final list. Did you forget to run yarn makelist?`);
        }
    });
};
/**
 * Check in CI that author properly updated token list
 * i.e. not just changed token list in src/tokens but also regenerated lists with yarn makelist command.
 * Github Action runs only on change in src/tokens directory.
 */
const ciCheck = async () => {
    for (const listName in LISTS) {
        await compareLists(listName);
    }
};

const pathToImages = path.join(path.resolve(), "lists", "images");
const logoFiles = fs.readdirSync(pathToImages);
// Default token list for exchange + manual exclusion of broken BEP-20 token(s)
const blacklist = [
    // List of default tokens to exclude
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
    "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    "0x55d398326f99059fF775485246999027B3197955",
    "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
    "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    "0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51",
    "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
    "0x8f0528ce5ef7b51152a59745befdd91d97091d2f",
    "0x7083609fce4d1d8dc0c979aab8c869ea2c873402",
    "0x4e6415a5727ea08aae4580057187923aec331227",
    "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    "0x844fa82f1e54824655470970f7004dd90546bb28",
    // List of broken tokens
    "0x4269e4090ff9dfc99d8846eb0d42e67f01c3ac8b",
    "0xe2e7329499e8ddb1f2b04ee4b35a8d7f6881e4ea",
];
/**
 * Return today / 1 month ago ISO-8601 DateTime.
 *
 * @returns string[]
 */
const getDateRange = () => {
    const today = new Date();
    const todayISO = today.toISOString();
    today.setMonth(today.getMonth() - 1);
    const monthAgoISO = today.toISOString();
    return [todayISO, monthAgoISO];
};
/**
 * Fetch Top100 Tokens traded on PancakeSwap v2, ordered by trading volume,
 * for the past 30 days, filtered to remove default / broken tokens.
 *
 * @returns BitqueryEntity[]]
 */
const getTokens$1 = async () => {
    try {
        const [today, monthAgo] = getDateRange();
        const { ethereum } = await request("https://graphql.bitquery.io/", gql `
        query ($from: ISO8601DateTime, $till: ISO8601DateTime, $blacklist: [String!]) {
          ethereum(network: bsc) {
            dexTrades(
              options: { desc: "Total_USD", limit: 100 }
              exchangeName: { is: "Pancake v2" }
              baseCurrency: { notIn: $blacklist }
              date: { since: $from, till: $till }
            ) {
              Total_USD: tradeAmount(calculate: sum, in: USD)
              baseCurrency {
                address
                name
                symbol
                decimals
              }
            }
          }
        }
      `, {
            from: monthAgo,
            till: today,
            blacklist,
        });
        return ethereum.dexTrades;
    }
    catch (error) {
        return error;
    }
};
/**
 * Returns the URI of a token logo
 * Note: If present in extended list, use main logo, else fallback to TrustWallet
 *
 * @returns string
 */
const getTokenLogo = (address) => {
    // Note: fs.existsSync can't be used here because its not case sensetive
    if (logoFiles.includes(`${address}.png`)) {
        return `https://tokens.pancakeswap.finance/images/${address}.png`;
    }
    return `https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/${address}/logo.png`;
};
/**
 * Main function.
 * Fetch tokems, build list, save list.
 */
const main = async () => {
    try {
        const tokens = await getTokens$1();
        const sanitizedTokens = tokens.reduce((list, item) => {
            const checksummedAddress = getAddress(item.baseCurrency.address);
            const updatedToken = {
                name: slugify(item.baseCurrency.name, {
                    replacement: " ",
                    remove: /[^\w\s.]/g,
                }),
                symbol: slugify(item.baseCurrency.symbol, {
                    replacement: "-",
                    remove: /[^\w\s.]/g,
                }).toUpperCase(),
                address: checksummedAddress,
                chainId: 56,
                decimals: item.baseCurrency.decimals,
                logoURI: getTokenLogo(checksummedAddress),
            };
            return [...list, updatedToken];
        }, []);
        const tokenListPath = `${path.resolve()}/src/tokens/pancakeswap-top-100.json`;
        console.info("Saving updated list to ", tokenListPath);
        const stringifiedList = JSON.stringify(sanitizedTokens, null, 2);
        fs.writeFileSync(tokenListPath, stringifiedList);
    }
    catch (error) {
        console.error(`Error when fetching Top100 Tokens by volume for the past 30 days, error: ${error.message}`);
    }
};

const erc20ABI = [
    {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [
            {
                name: "",
                type: "string",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                name: "_spender",
                type: "address",
            },
            {
                name: "_value",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                name: "_from",
                type: "address",
            },
            {
                name: "_to",
                type: "address",
            },
            {
                name: "_value",
                type: "uint256",
            },
        ],
        name: "transferFrom",
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
            {
                name: "",
                type: "uint8",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "_owner",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                name: "balance",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [
            {
                name: "",
                type: "string",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        constant: false,
        inputs: [
            {
                name: "_to",
                type: "address",
            },
            {
                name: "_value",
                type: "uint256",
            },
        ],
        name: "transfer",
        outputs: [
            {
                name: "",
                type: "bool",
            },
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        constant: true,
        inputs: [
            {
                name: "_owner",
                type: "address",
            },
            {
                name: "_spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                name: "",
                type: "uint256",
            },
        ],
        payable: false,
        stateMutability: "view",
        type: "function",
    },
    {
        payable: true,
        stateMutability: "payable",
        type: "fallback",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                name: "spender",
                type: "address",
            },
            {
                indexed: false,
                name: "value",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                name: "value",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
];

const linea = {
    id: 59144,
    name: "Linea Mainnet",
    network: "linea-mainnet",
    nativeCurrency: { name: "Linea Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
        infura: {
            http: ["https://linea-mainnet.infura.io/v3"],
            webSocket: ["wss://linea-mainnet.infura.io/ws/v3"],
        },
        default: {
            http: ["https://rpc.linea.build"],
            webSocket: ["wss://rpc.linea.build"],
        },
        public: {
            http: ["https://rpc.linea.build"],
            webSocket: ["wss://rpc.linea.build"],
        },
    },
    blockExplorers: {
        default: {
            name: "Etherscan",
            url: "https://lineascan.build",
        },
        etherscan: {
            name: "Etherscan",
            url: "https://lineascan.build",
        },
        blockscout: {
            name: "Blockscout",
            url: "https://explorer.linea.build",
        },
    },
    contracts: {
        multicall3: {
            address: "0xcA11bde05977b3631167028862bE2a173976CA11",
            blockCreated: 42,
        },
    },
    testnet: false,
};
const opbnb = {
    id: 204,
    name: "opBNB Mainnet",
    network: "opbnb",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://opbnb-mainnet-rpc.bnbchain.org"],
        },
        public: {
            http: ["https://opbnb-mainnet-rpc.bnbchain.org"],
        },
    },
    blockExplorers: {
        default: {
            name: "opBNBScan",
            url: "https://opbnbscan.com",
        },
    },
    contracts: {
        multicall3: {
            address: "0xcA11bde05977b3631167028862bE2a173976CA11",
            blockCreated: 512881,
        },
    },
};
const scroll = {
    id: 534352,
    name: "Scroll Mainnet",
    network: "scroll",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
        default: {
            http: ["https://rpc.scroll.io"],
        },
        public: {
            http: ["https://rpc.scroll.io"],
        },
    },
    blockExplorers: {
        default: {
            name: "scrollScan",
            url: "https://scrollscan.com",
        },
    },
    contracts: {
        multicall3: {
            address: "0xcA11bde05977b3631167028862bE2a173976CA11",
            blockCreated: 14,
        },
    },
};
const publicClients = {
    [mainnet.id]: createPublicClient({
        chain: mainnet,
        transport: http("https://ethereum.publicnode.com"),
    }),
    [bsc.id]: createPublicClient({
        chain: bsc,
        transport: http("https://nodes.pancakeswap.info"),
    }),
    [polygonZkEvm.id]: createPublicClient({
        chain: polygonZkEvm,
        transport: http(),
    }),
    [zkSync.id]: createPublicClient({
        chain: zkSync,
        transport: http(),
    }),
    [arbitrum.id]: createPublicClient({
        chain: arbitrum,
        transport: http(),
    }),
    [linea.id]: createPublicClient({
        chain: linea,
        transport: http(),
    }),
    [base.id]: createPublicClient({
        chain: base,
        transport: http(),
    }),
    [opbnb.id]: createPublicClient({
        chain: opbnb,
        transport: http(),
    }),
    [scroll.id]: createPublicClient({
        chain: scroll,
        transport: http(),
    }),
};

const getTokens = async (listName) => {
    const urls = {
        coingecko: "https://tokens.coingecko.com/binance-smart-chain/all.json",
        cmc: "https://s3.coinmarketcap.com/generated/dex/tokens/bsc-tokens-all.json",
    };
    const data = await fetch(urls[listName]);
    return (await data.json()).tokens;
};
const COINGEKKO_BAD_TOKENS = [
    "0x92a0d359c87b8f3fe383aa0a42c19d1a2afe6be0",
    "0xB1A1D06d42A43a8FCfDC7FDcd744f7eF03e8ad1a", // HKDAO
].map((a) => a.toLowerCase());
const CMC_BAD_TOKENS = [
    "0x6B8C76b277Eb34A22e24d603ef0448D9ad1c5a7d",
    "0x58b8e295fc5b705bcbb48c5978b2b389332e0414",
    "0x6636F7B89f64202208f608DEFFa71293EEF7b466",
    "0xb8e3399d81b76362b76453799c95fee868c728ea",
    "0x92CfbEC26C206C90aeE3b7C66A9AE673754FaB7e",
    "0xdD53Ba070c0A177fb923984c3720eD07B1247078",
    "0xcFA52F180538032402E0A2E702a4Da6fD1817fF5",
    "0x199e5A83509F35CD5Eb38a2D28B56A7Cd658E337",
    "0xBb6CD639724417A20a7db0F45C1fb2fE532f490A",
    "0xCb73918ac58D0c90d71c7992637c61094c15305b",
    "0xebd49b26169e1b52c04cfd19fcf289405df55f80",
    "0xB1A1D06d42A43a8FCfDC7FDcd744f7eF03e8ad1a", // HKDAO
].map((a) => a.toLowerCase());
const badTokens = {
    coingecko: COINGEKKO_BAD_TOKENS,
    cmc: CMC_BAD_TOKENS,
};
// TODO: ideally we should also check on chain name, but if project wants to modify it for whatever reason
// we should respect that somehow too... I think good solution would be to have a separate map for "modified" names.
// Cause on chain everything is different and causes confusion
// For now names are just used as is here
const fetchThirdPartyList = async (listName) => {
    try {
        const rawTokens = await getTokens(listName);
        const tokens = rawTokens
            .filter(({ address }) => !badTokens[listName].includes(address.toLowerCase()))
            .filter((t) => t.chainId === 56); // only bsc for now
        const badDecimals = [];
        const badAddresses = [];
        const badSymbol = [];
        const badName = [];
        const duplicates = [];
        const invalidNameOrSymbol = [];
        const chunkSize = 200;
        const chunkArray = tokens.length >= chunkSize ? _.chunk(tokens, chunkSize) : [tokens];
        console.info("Total chunks: ", chunkArray.length);
        const realTokensDecimals = new Map();
        const realTokenSymbol = new Map();
        let currentChunk = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const chunk of chunkArray) {
            console.info(`Processing chunk ${++currentChunk} / ${chunkArray.length}`);
            const mapAddress = chunk.filter((token) => isAddress(token.address));
            badAddresses.push(...chunk.filter((token) => !isAddress(token.address)).map(({ address }) => address));
            // console.info(
            //   "Debug problematic addresses",
            //   mapAddress.map(({ address }) => address)
            // );
            // eslint-disable-next-line no-await-in-loop
            const tokenInfoResponse = await publicClients[56].multicall({
                allowFailure: true,
                contracts: mapAddress.flatMap(({ address }) => [
                    {
                        abi: erc20ABI,
                        address: address,
                        functionName: "symbol",
                    },
                    {
                        abi: erc20ABI,
                        address: address,
                        functionName: "name",
                    },
                    {
                        abi: erc20ABI,
                        address: address,
                        functionName: "decimals",
                    },
                ]),
            });
            mapAddress.forEach(({ address, name, symbol, decimals }, i) => {
                if (tokenInfoResponse[i * 3].status === "failure" ||
                    tokenInfoResponse[i * 3 + 1].status === "failure" ||
                    tokenInfoResponse[i * 3 + 2].status === "failure" ||
                    tokenInfoResponse[i * 3] === null ||
                    tokenInfoResponse[i * 3 + 1] === null ||
                    tokenInfoResponse[i * 3 + 2] === null) {
                    badAddresses.push(address);
                    return;
                }
                const realSymbol = tokenInfoResponse[i * 3].result;
                const realName = tokenInfoResponse[i * 3 + 1].result;
                const realDecimals = tokenInfoResponse[i * 3 + 2].result;
                if (!decimals || decimals !== realDecimals) {
                    badDecimals.push({ decimals, realDecimals, address });
                }
                if (!name || name !== realName) {
                    badName.push({ name, realName, address });
                }
                if (!symbol || symbol !== realSymbol) {
                    badSymbol.push({ name, realSymbol, address });
                }
                realTokenSymbol.set(address, realSymbol);
                realTokensDecimals.set(address, realDecimals);
            });
        }
        const sanitizedTokens = tokens
            .filter((token, index, array) => {
            const isNotDuplicate = array.findIndex((t) => t.address === token.address || t.name === token.name) === index;
            if (!isNotDuplicate)
                duplicates.push(token);
            const hasValidSymbol = /^[a-zA-Z0-9+\-%/$]+$/.test(realTokenSymbol.get(token.address));
            const symbolIsOk = realTokenSymbol.get(token.address)?.length > 0 &&
                realTokenSymbol.get(token.address)?.length <= 20 &&
                hasValidSymbol;
            const nameIsOk = token.name.length > 0 && token.name.length <= 40;
            if (!symbolIsOk || !nameIsOk)
                invalidNameOrSymbol.push(token.address);
            return (isNotDuplicate && symbolIsOk && nameIsOk && isAddress(token.address) && !badAddresses.includes(token.address));
        })
            .map((token) => {
            const checksummedAddress = getAddress(token.address);
            return {
                name: token.name,
                symbol: realTokenSymbol.get(token.address),
                address: checksummedAddress,
                chainId: token.chainId,
                decimals: realTokensDecimals.get(token.address),
                logoURI: token.logoURI,
            };
        });
        console.info(`About to save ${sanitizedTokens.length} tokens (original list has ${rawTokens.length})`);
        console.info(`Dropped: ${rawTokens.length - sanitizedTokens.length}`);
        console.info(`Bad decimals found: ${badDecimals.length}.`);
        console.info(`Bad names found: ${badName.length}.`);
        console.info(`Bad symbols found: ${badSymbol.length}.`);
        console.info(`Bad addresses found: ${badAddresses.length}`);
        console.info(`Duplicates found: ${duplicates.length}`);
        console.info(`Invalid name or symbosl: ${invalidNameOrSymbol.length}`);
        const tokenListPath = `${path.resolve()}/src/tokens/${listName}.json`;
        const tokenListFile = Bun.file(`/src/tokens/${listName}.json`);
        console.info("Saving updated list to ", tokenListFile);
        const stringifiedList = JSON.stringify(sanitizedTokens, null, 2);
        await Bun.write(tokenListPath, stringifiedList);
    }
    catch (error) {
        console.error(`Error when fetching ${listName} list, error: ${error.message}`, error);
    }
};

const buildIndex = async (lists) => {
    const html = await Bun.file(`src/index.html`).text();
    const newContent = html.replace('`<!--LISTS-->`', JSON.stringify(lists));
    await Bun.write('lists/index.html', newContent);
};

const command = process.argv[2];
const listName = process.argv[3];
const versionBump = process.argv[4];
function checkListName() {
    if (LISTS[listName] === undefined) {
        throw new Error(`Unknown list: ${listName}. Please check src/constants.ts`);
    }
}
switch (command) {
    case "checksum":
        checkListName();
        await checksumAddresses(listName);
        break;
    case "generate":
        checkListName();
        await saveList(await buildList(listName, versionBump), listName);
        break;
    case "makelist":
        checkListName();
        await checksumAddresses(listName);
        await saveList(await buildList(listName, versionBump), listName);
        const proc = Bun.spawn({
            cmd: ["bun", "test", "-t", `${listName}`],
        });
        await proc.exited;
        if (proc.exitCode !== 0) {
            throw new Error(`Failed to generate list ${listName}`);
        }
        break;
    case "makeindex":
        await buildIndex(LISTS);
        break;
    case "fetch":
        checkListName();
        if (listName === "pcs-top-100") {
            await main();
        }
        await fetchThirdPartyList(listName);
        break;
    case "ci-check":
        await ciCheck();
        break;
    default:
        console.info("Unknown command");
        break;
}
