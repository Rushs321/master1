const undici = require('undici');
const lodash = require('lodash');
const { generateRandomIP, randomUserAgent } = require('./utils.js');
const copyHeaders = require('./copyHeaders.js');
const applyCompression = require('./compress.js');
const performBypass = require('./bypass.js');
const handleRedirect = require('./redirect.js');
const checkCompression = require('./shouldCompress.js');

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

    if (!url) {
        const ipAddress = generateRandomIP();
        const ua = randomUserAgent();
        const hdrs = {
            ...lodash.pick(request.headers, ['cookie', 'dnt', 'referer']),
            'x-forwarded-for': ipAddress,
            'user-agent': ua,
            'via': randomVia(),
        };

        Object.entries(hdrs).forEach(([key, value]) => reply.header(key, value));
        
        return reply.send(`bandwidth-hero-proxy`);
    }

    request.params.url = decodeURIComponent(url);
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
