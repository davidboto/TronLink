import { BigNumber } from 'bignumber.js';
import { keccak256 } from 'js-sha3';
import { Buffer } from 'buffer/';
import { ec as EC } from 'elliptic';

import {
    ENCRYPTION_ALGORITHM,
    LOCALSTORAGE_KEY,
    TRON_CONSTANTS_MAINNET,
    TRON_CONSTANTS_TESTNET
} from './constants';

import crypto from 'crypto';
import Sha from 'jssha';
import ByteArray from './ByteArray';
import Logger from './logger';
import validator from 'validator';

const logger = new Logger('Utils');
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const utils = {
    stringToHex(string) {
        return Buffer.from(string).toString('hex');
    },

    hexToString(hex) {
        return Buffer.from(hex, 'hex').toString();
    },

    encrypt(data, password, algorithm = ENCRYPTION_ALGORITHM) {
        const cipher = crypto.createCipher(algorithm, password);

        let crypted = cipher.update(data, 'utf8', 'hex');
        crypted += cipher.final('hex');

        return crypted;
    },

    decrypt(data, password, algorithm = ENCRYPTION_ALGORITHM) {
        const decipher = crypto.createDecipher(algorithm, password);

        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    },

    loadStorage(key = LOCALSTORAGE_KEY) {
        try {
            const data = window.localStorage.getItem(key);

            if (data)
                return JSON.parse(data);

            return false;
        } catch (exception) {
            logger.warn('Failed to load storage');
            logger.error({ exception });
            return false;
        }
    },

    saveStorage(data, key = LOCALSTORAGE_KEY) {
        window.localStorage.setItem(key, JSON.stringify(data));
    },

    convertTransactions(transactions, address) {
        return transactions.map(transaction => {
            const contract = transaction.raw_data.contract[0];
            const ownerAddress = this.hexToBase58(contract.parameter.value.owner_address);
            const toAddress = contract.parameter.value.to_address ? this.hexToBase58(contract.parameter.value.to_address) : false;
            const isMine = address === ownerAddress;

            const { value } = contract.parameter;

            const tx = {
                date: transaction.raw_data.timestamp || false,
                raw: contract,
                txType: contract.type,
                amount: contract.parameter.value.amount,
                txID: transaction.txID,
                ownerAddress,
                toAddress,
                isMine
            };

            if(value.contract_address)
                tx.contractAddress = value.contract_address;

            if(value.name)
                tx.name = value.name;

            if(value.asset_name)
                tx.name = value.asset_name;

            if(tx.date && tx.date > Date.now())
                tx.date = false;

            return tx;
        });
    },

    base64ToHex(string) {
        const bin = atob(string.replace(/[ \r\n]+$/, ''));
        const hex = [];

        for (let i = 0; i < bin.length; i++) {
            let temp = bin.charCodeAt(i).toString(16);

            if (temp.length == 1)
                temp = `0${temp}`;

            hex.push(temp);
        }

        return hex.join('');
    },

    sha256(string) {
        const shaObj = new Sha('SHA-256', 'HEX');
        shaObj.update(string);
        return shaObj.getHash('HEX');
    },

    validateNode({ name, full, solidity, event, mainnet = false }) {
        if(!this.isString(name) || !name.length || name.length > 256)
            return 'Invalid node name provided';

        if(!full.startsWith('https://') && !full.startsWith('http://127.0.0.1'))
            return 'Full node must run through https protocol';

        if(!solidity.startsWith('https://') && !full.startsWith('http://127.0.0.1'))
            return 'Solditity node must run through https protocol';

        if(event && !event.startsWith('https://') && !full.startsWith('http://127.0.0.1'))
            return 'Event server must run through https protocol';

        if(!validator.isURL(full) && !validator.isIP(full))
            return 'Invalid full node provided';

        if(!validator.isURL(solidity) && !validator.isIP(solidity))
            return 'Invalid solidity node provided';

        if(!validator.isURL(event) && !validator.isIP(event))
            return 'Invalid event server provided';

        if(!this.isBoolean(mainnet))
            return 'Invalid network type provided';

        return false;
    },

    base58ToHex(string) {
        const bytes = [0];

        for (let i = 0; i < string.length; i++) {
            const char = string[i];

            if (!ALPHABET.includes(char))
                throw new Error('Non-base58 character');

            for (let j = 0; j < bytes.length; j++)
                bytes[j] *= 58;

            bytes[0] += ALPHABET.indexOf(char);

            let carry = 0;

            for (let j = 0; j < bytes.length; ++j) {
                bytes[j] += carry;
                carry = bytes[j] >> 8;
                bytes[j] &= 0xff;
            }

            while (carry) {
                bytes.push(carry & 0xff);
                carry >>= 8;
            }
        }

        for (let i = 0; string[i] === '1' && i < string.length - 1; i++)
            bytes.push(0);

        return bytes.reverse().slice(0, 21).map(byte => {
            let temp = byte.toString(16);

            if (temp.length == 1)
                temp = `0${temp}`;

            return temp;
        }).join('');
    },

    hexToBase58(string) {
        const primary = this.sha256(string);
        const secondary = this.sha256(primary);

        const buffer = ByteArray.fromHexString(string + secondary.slice(0, 8));
        const digits = [0];

        for (let i = 0; i < buffer.length; i++) {
            for (let j = 0; j < digits.length; j++)
                digits[j] <<= 8;

            digits[0] += buffer[i];

            let carry = 0;

            for (let j = 0; j < digits.length; ++j) {
                digits[j] += carry;
                carry = (digits[j] / 58) | 0;
                digits[j] %= 58;
            }

            while (carry) {
                digits.push(carry % 58);
                carry = (carry / 58) | 0;
            }
        }

        for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++)
            digits.push(0);

        return digits.reverse().map(digit => ALPHABET[digit]).join('');
    },

    isString(string) {
        return Object.prototype.toString.call(string) === '[object String]';
    },

    isNumber(number) {
        return !isNaN(parseFloat(number)) && isFinite(number);
    },

    isBoolean(boolean) {
        return boolean === true || boolean === false || toString.call(boolean) === '[object Boolean]';
    },

    validateDescription(desc) {
        if (desc && !this.isString(desc))
            return false;

        if (desc && desc.length > 240)
            return false;

        if (desc && !desc.length)
            return false;

        return true;
    },

    validateAmount(amount) {
        return this.isNumber(amount) && amount > 0;
    },

    sunToTron: sun => {
        return (new BigNumber(sun)).dividedBy(1000000);
    },

    tronToSun: tron => {
        return (new BigNumber(tron)).multipliedBy(1000000);
    },

    validateAddress(address) {
        if (address.length !== 34)
            return false;

        const prefix = this.base58ToHex(address).substr(0, 2);

        if (prefix === TRON_CONSTANTS_MAINNET.ADD_PRE_FIX_STRING)
            return true;

        if (prefix === TRON_CONSTANTS_TESTNET.ADD_PRE_FIX_STRING)
            return true;

        return false;
    },

    transformAddress(address) {
        if (!this.isString(address))
            return false;

        switch (address.length) {
            case 42: {
                // hex -> base58
                return this.transformAddress(
                    this.hexToBase58(address)
                );
            }
            case 28: {
                // base64 -> base58
                const hex = this.base64ToHex(address);
                const base58 = this.hexToBase58(hex);

                return this.transformAddress(base58);
            }
            case 34: {
                // base58
                const isAddressValid = this.validateAddress(address);

                if (isAddressValid)
                    return address;

                return false;
            }
        }
    },

    publicKeyToAddress(pubKey) {
        const publicKey = (pubKey.length === 65) ? pubKey.slice(1) : pubKey;
        const hash = keccak256(publicKey).toString();
        const address = TRON_CONSTANTS_MAINNET.ADD_PRE_FIX_STRING + hash.substring(24);

        return ByteArray.fromHexString(address);
    },

    privateKeyToPublicKey(privateKey) {
        const ec = new EC('secp256k1');
        const key = ec.keyFromPrivate(privateKey, 'bytes');
        const publicKey = key.getPublic();

        const { x, y } = publicKey;

        let xHex = x.toString('hex');
        let yHex = y.toString('hex');

        while (xHex.length < 64)
            xHex = `0${xHex}`;

        while (yHex.length < 64)
            yHex = `0${yHex}`;

        const publicKeyHex = `04${xHex}${yHex}`;

        return ByteArray.fromHexString(publicKeyHex);
    },

    privateKeyToAddress(privateKey) {
        const privateKeyBytes = ByteArray.fromHexString(privateKey);
        const publicKeyBytes = this.privateKeyToPublicKey(privateKeyBytes);
        const addressBytes = this.publicKeyToAddress(publicKeyBytes);

        return this.hexToBase58(
            ByteArray.toHexString(addressBytes)
        );
    },

    isHex(string) {
        return typeof string === 'string' && !isNaN(parseInt(string, 16));
    },

    injectPromise(func, ...args) {
        return new Promise((resolve, reject) => {
            func(...args, (err, res) => {
                if(err)
                    reject(err);
                else resolve(res);
            });
        });
    },

    isFunction(obj) {
        return typeof obj === 'function';
    },
};

export default utils;
