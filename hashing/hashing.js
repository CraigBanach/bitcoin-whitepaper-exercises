"use strict";

const crypto = require("crypto");

function createBlock(data) {
	const block = {
		index: Blockchain.blocks.length,
		prevHash: Blockchain.blocks[Blockchain.blocks.length - 1].hash,
		data,
		timestamp: Date.now(),
	};
	block.hash = blockHash(block);

	return block;
};

function blockHash(block) {
	return crypto.createHash("sha256")
		.update(`${block.index};${block.prevHash};${block.data};${block.timestamp};`)
		.digest("hex");
} 

function verifyChain(chain) {
	if (chain.blocks.length === 0) return true;
	const block = chain.blocks.pop();
	const prevHash = chain.blocks.length > 0 ? chain.blocks[chain.blocks.length - 1].hash : null;
	return !!(verifyChain(chain) && verifyBlock(block, prevHash));
}

function verifyBlock(block, prevBlockHash) {
	return (block.data && block.data.length !== 0)
		&& (block.index === 0 || block.prevHash && block.prevHash.length !== 0 && block.prevHash === prevBlockHash)
		&& (block.index >= 0)
		&& (block.hash === blockHash(block) || (block.index === 0 && block.hash === "000000"));
}

// The Power of a Smile
// by Tupac Shakur
const poem = [
	"The power of a gun can kill",
	"and the power of fire can burn",
	"the power of wind can chill",
	"and the power of a mind can learn",
	"the power of anger can rage",
	"inside until it tears u apart",
	"but the power of a smile",
	"especially yours can heal a frozen heart",
];

const Blockchain = {
	blocks: [],
};

// Genesis block
Blockchain.blocks.push({
	index: 0,
	hash: "000000",
	data: "Genesis",
	timestamp: Date.now(),
});

// TODO: insert each line into blockchain
for (let line of poem) {
	Blockchain.blocks.push(createBlock(line));
};

// For testing an invalid blockchain:

// Blockchain.blocks.push({
// 	index: 9,
// 	prevHash: Blockchain.blocks[Blockchain.blocks.length - 1].hash,
// 	hash: "1",
// 	data: "Fake block",
// 	timestamp: Date.now(),
// });

console.log(`Blockchain is valid: ${verifyChain(Blockchain)}`);
