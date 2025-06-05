const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

const _ALPHABET = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

app.use(cors());
app.use(express.json());

// ======= Utilities =======
const isPrime = (n) => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    const sqrt = Math.floor(Math.sqrt(n));
    for (let i = 3; i <= sqrt; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
};

const gcd = (a, b) => {
    while (b !== 0) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
};

const pqGen = () => {
    const min = 10000;
    const max = 100000;
    while (true) {
        const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
        if (candidate % 4 === 3 && isPrime(candidate)) return candidate;
    }
};

const genCoprime = (m) => {
    const min = 2;
    const max = m - 1;
    while (true) {
        const candidate = Math.floor(Math.random() * (max - min + 1)) + min;
        if (gcd(candidate, m) === 1) return candidate;
    }
};

const dGen = (fn, e) => {
    let q, a, b, r, t1, t2, t;
    if (e > fn) {
        a = e;
        b = fn;
    } else {
        a = fn;
        b = e;
    }

    t1 = 0;
    t2 = 1;

    console.log(`dGen - q: ${q}, a: ${a}, b: ${b}, r: ${r}, t1: ${t1}, t2: ${t2}, t: ${t},`);

    while (b !== 0) {
        q = Math.floor(a / b);
        r = a % b;
        t = t1 - (t2 * q);

        a = b;
        b = r;
        t1 = t2;
        t2 = t;

        console.log(`dGen - q: ${q}, a: ${a}, b: ${b}, r: ${r}, t1: ${t1}, t2: ${t2}, t: ${t},`);
    }

    return t1;
}

const getWordNums = (word) => {
    const nums = [];

    for (let i = 0; i < word.length; i++) {
        nums.push(_ALPHABET.indexOf(word[i]));
    }

    return nums;
}

const modPow = (base, exponent, modulus) => {
    base = BigInt(base);
    exponent = BigInt(exponent);
    modulus = BigInt(modulus);

    if (modulus === 1n) return 0n;

    let result = 1n;
    base = base % modulus;

    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }

        exponent = exponent / 2n;
        base = (base * base) % modulus;
    }

    return Number(result);
};

// ===== API: Public Key Generate =====
app.post('/api/generate/public-key', (req, res) => {
    let { p, q } = req.body;

    if (!p || !q) {
        p = pqGen();
        q = pqGen();
    }

    const n = p * q;
    const fn = (p - 1) * (q - 1);
    const e = genCoprime(fn);

    // console.log(p, q, e, n, fn);
    console.log(`Public: p: ${p}, q: ${q}, e: ${e}, n: ${n}, fn: ${fn}`);

    res.json({ p: p, q: q, e: e, n: n, fn: fn });
});

// ===== API: Private Key Generate =====
app.post('/api/generate/private-key', (req, res) => {
    const { p, q, fn, e } = req.body;
    const n = p * q;
    let d = dGen(fn, e);
    d = d < 0 ? d + fn : d;

    // console.log(p, q, e, n, fn, d);
    console.log(`Public: p: ${p}, q: ${q}, e: ${e}, n: ${n}, fn: ${fn}, d: ${d}`);

    res.json({ d: d, n: n });
});

// ===== API: RSA Encrypt =====
app.post('/api/encrypt/rsa', (req, res) => {
    console.log('Rsa Encrypt Called');
    console.log(req.body);
    let { message, e, d, n } = req.body;
    message = message.toUpperCase();

    const m = getWordNums(message);
    console.log(m);
    const c = [];

    for (let i = 0; i < m.length; i++) {
        const buf = modPow(m[i], e, n);
        console.log(`m ** e % n: ${m[i]} ** ${e} % ${n} = ${buf}`);
        c.push(buf);
    }

    console.log(`C: ${c}`);

    res.json({ result: c, n: n, d: d });
});

// ===== API: RSA Decrypt =====
app.post('/api/decrypt/rsa', (req, res) => {
    console.log('Rsa Decrypt Called');
    let { message, n, d } = req.body;

    if (typeof message === 'string') {
        message = message.split(',');
        console.log(message);
    }

    console.log(req.body);
    const m = [];

    for (let i = 0; i < message.length; i++) {
        const buf = modPow(message[i], d, n);
        m.push(_ALPHABET[buf]);
    }

    res.json({ result: m });
});

app.listen(PORT, () => {
    console.log(`Express-сервер на http://localhost:${PORT}`);
});