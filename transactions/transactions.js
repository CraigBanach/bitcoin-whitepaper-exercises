"use strict";

var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
var openpgp = require("openpgp");

const KEYS_DIR = path.join(__dirname,"keys");
const PRIV_KEY_TEXT = fs.readFileSync(path.join(KEYS_DIR,"priv.pgp.key"),"utf8");
const PUB_KEY_TEXT = fs.readFileSync(path.join(KEYS_DIR,"pub.pgp.key"),"utf8");

// The Power of a Smile
// by Tupac Shakur
var poem = [
	"The power of a gun can kill",
	"and the power of fire can burn",
	"the power of wind can chill",
	"and the power of a mind can learn",
	"the power of anger can rage",
	"inside until it tears u apart",
	"but the power of a smile",
	"especially yours can heal a frozen heart",
];

var Blockchain = {
	blocks: [],
};

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: "000000",
	data: "",
	timestamp: Date.now(),
});

addPoem()
.then(checkPoem)
.catch(console.log);


// **********************************

async function addPoem() {
	var transactions = [];

	// TODO: add poem lines as authorized transactions
	for (let line of poem) {
		transactions.push(authorizeTransaction(createTransaction(line)));
	}

	var bl = createBlock(transactions);

	Blockchain.blocks.push(bl);

	return Blockchain;
}

async function checkPoem(chain) {
	const validChain = await verifyChain(chain);
	console.log(`The blockchain provided is ${validChain ? 'valid' : 'invalid'}`);
}

function createBlock(data) {
	var bl = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length-1].hash,
		data,
		timestamp: Date.now(),
	};

	bl.hash = blockHash(bl);

	return bl;
}

function createTransaction(data) {
	const transaction = {
		data
	};
	transaction.hash = transactionHash(transaction);
	return transaction;
}

function transactionHash(tr) {
	return crypto.createHash("sha256").update(
		`${JSON.stringify(tr.data)}`
	).digest("hex");
}

async function authorizeTransaction(tran) {
	tran.pubKey = PUB_KEY_TEXT;
	tran.signature = await createSignature(tran.hash, PRIV_KEY_TEXT);
	return tran;
}

async function createSignature(text,privKey) {
	var privKeyObj = openpgp.key.readArmored(privKey).keys[0];

	var options = {
		data: text,
		privateKeys: [privKeyObj],
	};

	return (await openpgp.sign(options)).data;
}

async function verifySignature(signature,pubKey) {
	try {
		let pubKeyObj = openpgp.key.readArmored(pubKey).keys[0];

		let options = {
			message: openpgp.cleartext.readArmored(signature),
			publicKeys: pubKeyObj,
		};

		return (await openpgp.verify(options)).signatures[0].valid;
	}
	catch (err) {}

	return false;
}

function blockHash(bl) {
	return crypto.createHash("sha256").update(
		`${bl.index};${bl.prevHash};${JSON.stringify(bl.data)};${bl.timestamp}`
	).digest("hex");
}

async function verifyBlock(bl) {
	if (bl.data == null) return false;
	if (bl.index === 0) {
		if (bl.hash !== "000000") return false;
	}
	else {
		if (!bl.prevHash) return false;
		if (!(
			typeof bl.index === "number" &&
			Number.isInteger(bl.index) &&
			bl.index > 0
		)) {
			return false;
		}
		if (bl.hash !== blockHash(bl)) return false;
		if (!Array.isArray(bl.data)) return false;

		for (const tran of bl.data) {
			if (!verifyTransaction(tran)) return false;
		}
	}

	return true;
}

async function verifyTransaction(tran) {
	return tran.hash === transactionHash(tran)
		&& tran.pubKey 
		&& tran.signature
		&& await verifySignature(tran.signature, tran.pubKey);
}

async function verifyChain(chain) {
	var prevHash;
	for (let bl of chain.blocks) {
		if (prevHash && bl.prevHash !== prevHash) return false;
		if (!(await verifyBlock(bl))) return false;
		prevHash = bl.hash;
	}

	return true;
}
