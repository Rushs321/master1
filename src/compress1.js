"use strict";
const sharp = require('sharp');
const redirect = require('./redirect.js');

// Define the sharpStream function
const sharpStream = () => sharp({ animated: false, unlimited: true });

 async function compressImg(request, reply, input) {
    const format = request.params.webp ? 'webp' : 'jpeg';

    try {
        // Create the Sharp instance with the specified options
        const sharpInstance = sharpStream()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: request.params.webp, // Optimize scans only for WebP
                chromaSubsampling: request.params.webp ? '4:4:4' : '4:2:0', // Con
            });

        // Pipe the input stream into the Sharp instance and convert it to a buffer
        const { data, info } = await input.body
            .pipe(sharpInstance)
            .toBuffer({ resolveWithObject: true });

        // Send the processed image as the response
        reply
            .header('content-type', 'image/' + format)
            .header('content-length', info.size)
            .header('x-original-size', request.params.originSize)
            .header('x-bytes-saved', request.params.originSize - info.size)
            .code(200)
            .send(data);
    } catch (error) {
        console.error('Error during image compression:', error.message);
        return redirect(request, reply);
    }
module.exports = compressImg;
