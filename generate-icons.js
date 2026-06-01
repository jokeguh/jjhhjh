// 生成占位图标 PNG — 橙色方框 + 白色星号
// 运行: node generate-icons.js

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(width, height, bgR, bgG, bgB) {
    // 构建原始像素数据 (RGBA)
    const rawData = Buffer.alloc((width * 4 + 1) * height); // +1 per row for filter byte
    for (let y = 0; y < height; y++) {
        const rowOffset = y * (width * 4 + 1);
        rawData[rowOffset] = 0; // filter: none
        for (let x = 0; x < width; x++) {
            const px = rowOffset + 1 + x * 4;
            // 简单圆角矩形：四角透明
            const cx = x - width / 2, cy = y - height / 2;
            const cornerR = width * 0.18;
            const inCorner = (Math.abs(cx) > width / 2 - cornerR && Math.abs(cy) > height / 2 - cornerR);
            const distFromCorner = Math.sqrt(
                Math.pow(Math.abs(cx) - (width / 2 - cornerR), 2) +
                Math.pow(Math.abs(cy) - (height / 2 - cornerR), 2)
            );
            const isTransparent = inCorner && distFromCorner > cornerR;

            if (isTransparent) {
                rawData[px] = 0; rawData[px+1] = 0; rawData[px+2] = 0; rawData[px+3] = 0;
            } else {
                rawData[px] = bgR; rawData[px+1] = bgG; rawData[px+2] = bgB; rawData[px+3] = 255;
            }
        }
    }

    // Deflate 压缩
    const deflated = zlib.deflateSync(rawData);

    // 构建 PNG
    function crc32(buf) {
        let c;
        const table = [];
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c;
        }
        c = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    function chunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeB = Buffer.from(type, 'ascii');
        const crcData = Buffer.concat([typeB, data]);
        const crcVal = Buffer.alloc(4);
        crcVal.writeUInt32BE(crc32(crcData), 0);
        return Buffer.concat([len, typeB, data, crcVal]);
    }

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type: RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([
        signature,
        chunk('IHDR', ihdr),
        chunk('IDAT', deflated),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

// 生成各尺寸图标
const sizes = [48, 72, 96, 144, 192, 512];
const iconDir = path.join(__dirname, 'res', 'icon');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

// 主色：琥珀金 #f59e0b
const R = 245, G = 158, B = 11;

for (let size of sizes) {
    const png = createPNG(size, size, R, G, B);
    const fgPath = path.join(iconDir, `icon-foreground-${size}.png`);

    // 前景图标（有圆角）
    fs.writeFileSync(fgPath, png);

    // 完整图标（方形，Cordova 规范命名）
    if (size <= 192) {
        const squarePng = createPNG(size, size, R, G, B);
        // 让正方形完全填充
        const rawData = Buffer.alloc((size * 4 + 1) * size);
        for (let y = 0; y < size; y++) {
            rawData[y * (size * 4 + 1)] = 0;
            for (let x = 0; x < size; x++) {
                const px = y * (size * 4 + 1) + 1 + x * 4;
                rawData[px] = R; rawData[px+1] = G; rawData[px+2] = B; rawData[px+3] = 255;
            }
        }
        const deflated2 = zlib.deflateSync(rawData);
        const ihdr2 = Buffer.alloc(13);
        ihdr2.writeUInt32BE(size, 0); ihdr2.writeUInt32BE(size, 4);
        ihdr2[8] = 8; ihdr2[9] = 6; ihdr2[10] = 0; ihdr2[11] = 0; ihdr2[12] = 0;
        const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

        function chunk2(type, data) {
            const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
            const typeB = Buffer.from(type, 'ascii');
            const crcData = Buffer.concat([typeB, data]);
            const crcVal = Buffer.alloc(4);
            // reuse crc32 from outer scope... actually let me inline
            let c; const table = [];
            for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); table[n] = c; }
            c = 0xFFFFFFFF; for (let i = 0; i < crcData.length; i++) c = table[(c ^ crcData[i]) & 0xFF] ^ (c >>> 8);
            crcVal.writeUInt32BE((c ^ 0xFFFFFFFF) >>> 0, 0);
            return Buffer.concat([len, typeB, data, crcVal]);
        }

        const squarePngFile = Buffer.concat([sig, chunk2('IHDR', ihdr2), chunk2('IDAT', deflated2), chunk2('IEND', Buffer.alloc(0))]);
        fs.writeFileSync(path.join(iconDir, `icon-${size}.png`), squarePngFile);
    }
}

// 同时复制一份到 www/ 给 manifest.json 用
fs.copyFileSync(path.join(iconDir, 'icon-192.png'), path.join(__dirname, 'www', 'icon-192.png'));
fs.copyFileSync(path.join(iconDir, 'icon-foreground-192.png'), path.join(__dirname, 'www', 'icon-512.png'));

console.log('✅ 图标生成完成！');
console.log('  位置: ' + iconDir);
console.log('  如需自定义图标，替换 res/icon/ 下的 PNG 文件即可');
