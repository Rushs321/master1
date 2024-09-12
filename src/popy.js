const undici = require('undici');
const lodash = require('lodash');
const { generateRandomIP, randomUserAgent } = require('./hide.js');
const copyHeaders = require('./cHs.js');
const applyCompression = require('./compute.js');
const performBypass = require('./bby.js');
const handleRedirect = require('./rdd.js');
const checkCompression = require('./scompute.js');

const viaHeaders = [
    '1.1 example-proxy-service.com (ExampleProxy/1.0)',
    '1.0 another-proxy.net (Proxy/2.0)',
    '1.1 different-proxy-system.org (DifferentProxy/3.1)',
    '1.1 some-proxy.com (GenericProxy/4.0)',
];

function randomVia() {
    const index = Math.floor(Math.random() * viaHeaders.length);
    return viaHeaders[index];
}

async function processRequest(request, reply) {
    let url = request.query.url;
    if (Array.isArray(url)) url = url.join('&url=');

    if (!url) {
        return reply.send(`hi-app`);
    }
    url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://');

    request.params.url = url;
    request.params.webp = !request.query.jpeg;
    request.params.grayscale = request.query.bw !== '0';
    request.params.quality = parseInt(request.query.l, 10) || 40;

    const randomIP = generateRandomIP();
    const userAgent = randomUserAgent();

    try {
        const response = await undici.request(request.params.url, {
            headers: {
                ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
                'x-forwarded-for': randomIP,
                'user-agent': userAgent,
                'via': randomVia(),
            },
            maxRedirections: 5,
        });

        if (response.statusCode >= 400) {
            return handleRedirect(request, reply);
        }

        // Handle redirects
        if (response.statusCode >= 300 && response.headers.location) {
            return handleRedirect(request, reply);
        }

        copyHeaders(response, reply);
        reply.header('content-encoding', 'identity');
        request.params.originType = response.headers['content-type'] || '';
        request.params.originSize = parseInt(response.headers['content-length'], 10) || 0;

        const input = { body: response.body }; // Wrap the stream in an object

        if (checkCompression(request)) {
            return applyCompression(request, reply, input);
        } else {
            return performBypass(request, reply, response.body);
        }
    } catch (err) {
        return handleRedirect(request, reply);
    }
}

module.exports = processRequest;
