const crypto = require('crypto');

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(
            this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)
        ).digest('hex');
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock() {
        return new Block(0, "2026-03-01T00:00:00Z", "Genesis Block (Khedut Bandhu)", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newData) {
        const previousBlock = this.getLatestBlock();
        const newBlock = new Block(
            this.chain.length,
            new Date().toISOString(),
            newData,
            previousBlock.hash
        );
        this.chain.push(newBlock);
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) return false;
            if (currentBlock.previousHash !== previousBlock.hash) return false;
        }
        return true;
    }

    // Specialized method for Farm-to-Fork
    getJourneyForProduct(productId) {
        return this.chain.filter(block => block.data.productId === productId);
    }
}

const khedutBlockchain = new Blockchain();

// Example Seed Data for the blockchain
khedutBlockchain.addBlock({ productId: "WHEAT-001", stage: "Seeding", location: "Saurashtra", farmer: "Ansh Patel", date: "2026-03-05" });
khedutBlockchain.addBlock({ productId: "WHEAT-001", stage: "Quality Check", status: "Grade A", inspector: "AgriDept-G1", date: "2026-03-25" });

module.exports = khedutBlockchain;
