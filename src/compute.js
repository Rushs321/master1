"use strict";
const sharp = require('sharp');
const redirect = require('./redirect.js');
async function compressImg(request, reply, input) {
    const format = request.params.webp ? 'webp' : 'jpeg'

    try {
        const sharpInstance = sharp()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true,
                smartSubsample: false
            });

        // Pipe the input stream into the Sharp instance and convert it to a buffer
        const { data, info } = await input.body
            .pipe(sharpInstance)
            .toBuffer({ resolveWithObject: true });

        reply
            .header('content-type', 'image/' + format)
            .header('content-length', info.size)
            .header('x-original-size', request.params.originSize)
            .header('x-bytes-saved', request.params.originSize - info.size)
            .code(200)
            .send(data);
    } catch (error) {
        return redirect(request, reply);
    }
}

module.exports = compressImg;
