#!/usr/bin/env node
const express = require('express');
const CryptoJS = require('crypto-js');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Log, start } = require('./log.js');
const os = require('os');


const log = new Log();
const fs = require('fs');
const app = express();
const defaultConfig = {
    "port": 80,
    "proxies": [
        {
            "hostname": "exemple.localhost",
            "target": "http://localhost:3000",
            "status": "active",
            changeOrigin: true
        }
    ],//le token est hardcodé
    "token": CryptoJS.SHA256("admin").toString(),
    "accessApi": "localhost",//all , ip or localhost
    "apiIp": "0.0.0.0",
    "pageWeb": ["index.html", "styles.css", "script.js","bg.png"],
    "maxTentativePerIp": 5
};
var config = {};
var proxyMiddleware = {};
var autorisedIpWebServer = []
var tentativeIpWebServer = {}
if (fs.existsSync('./config.json')) {
    try {
        config = JSON.parse(fs.readFileSync('./config.json'));
        //applique un auto test sur le fichier de config
        if(!config.port || !config.proxies || !config.token || !config.accessApi || !config.apiIp || !config.pageWeb || !config.maxTentativePerIp){
            log.error('config.json is not valid');
            fs.writeFileSync('./config.json.backup', fs.readFileSync('./config.json'));
            fs.writeFileSync('./config.json', JSON.stringify(defaultConfig));
            log.error('config.json.backup created, config.json recreated');
            config = require('./config.json');
        }
    }catch(e){
        log.error('config.json is not a valid json');
        fs.writeFileSync('./config.json.backup', fs.readFileSync('./config.json'));
        fs.writeFileSync('./config.json', JSON.stringify(defaultConfig));
        log.error('config.json.backup created, config.json recreated');
        config = require('./config.json');
    }
}else{
    log.error('config.json not found');
    fs.writeFileSync('./config.json', JSON.stringify(defaultConfig));
    log.error('config.json created');
    config = require('./config.json');
}

function loadProxies(){
    proxyMiddleware = {};
    log.warning('loading proxies, '+config.proxies.length+' proxies found');
    let i = 0;
    for (const proxy of config.proxies) {
        if(proxy.status == 'inactive'){
            i++
            log.info('proxy '+proxy.hostname+' is inactive '+i*100/config.proxies.length+'%');
            continue;
        }
        proxyMiddleware[proxy.hostname] = createProxyMiddleware({
            target: proxy.target,
            changeOrigin: proxy.changeOrigin?proxy.changeOrigin:true,
            logger: console,
        });
        i++
        log.info('proxy '+proxy.hostname+' loaded, target: '+proxy.target+' '+i*100/config.proxies.length+'%');
    }
    log.info('proxies loaded');
}
app.use((req, res, next) => {
    log.l(
        `\x1b[32m[${new Date().toISOString()}]\x1b[0m \x1b[33m${req.method}\x1b[0m \x1b[34m${req.url}\x1b[0m \x1b[35m${req.headers['user-agent']}\x1b[0m \x1b[36m${req.headers['x-forwarded-for']}\x1b[0m  \x1b[31mIP: ${req.ip} reel-IP:${req.headers['x-real-ip']}\x1b[0m \x1b[32m${req.headers['host']}\x1b[0m`
    );
    log.l(JSON.stringify(tentativeIpWebServer));
    log.l(JSON.stringify(autorisedIpWebServer));
    next();
});

app.get('/api/proxy/:action', (req, res, next) => {
    //verifie si l'api est accessible par cette ip
    if(config.accessApi == 'ip' && req.ip != config.apiIp){
        return next();
    }else if(config.accessApi == 'localhost' && !(req.ip.startsWith('::ffff') ||!(req.ip.startsWith('::1') || req.ip.startsWith('127.') || req.ip.startsWith('192.168.') || req.ip.startsWith('10.'))) ){
        return next();
    }
    if(CryptoJS.SHA256(req.headers['x-token']).toString() != config.token){
        next();
        return;
    }

    if (req.params.action == 'reload') {
        loadProxies();
        res.send({ "status": "reloaded" });
    }else if(req.params.action == 'list'){
        res.send(JSON.stringify({
            "loaded": Object.keys(proxyMiddleware),
            "all": config.proxies
        }));
    }else if(req.params.action == 'add'){
        if(req.query.hostname && req.query.target){
            //dectecte les conflits
            let conflict = config.proxies.find(proxy => proxy.hostname == req.query.hostname);
            if(conflict){
                res.send({ "status": "error", "message": "hostname already exists" });
                return;
            }
            config.proxies.push({
                hostname: req.query.hostname,
                target: req.query.target,
                status: req.query.status?req.query.status:'active',
            });
            fs.writeFileSync('./config.json', JSON.stringify(config));
            res.send({ "status": "added" , "hostname": req.query.hostname, "target": req.query.target})
            if( req.query.reload == 'true'){
                loadProxies();
            }
        }else{
            res.send({ "status": "error", "message": "hostname and target are required" });
        }
    } else if(req.params.action == 'remove'){
        if(req.query.hostname || req.query.index){
            if(req.query.hostname){
                let index = config.proxies.findIndex(proxy => proxy.hostname == req.query.hostname);
                config.proxies.splice(index, 1);
            }else if(req.query.index){
                config.proxies.splice(req.query.index, 1);
            }
            fs.writeFileSync('./config.json', JSON.stringify(config));
            res.send({ "status": "removed" });
            if( req.query.reload == 'true'){
                loadProxies();
            }
        }else{
            res.send({ "status": "error", "message": "hostname or index is required" });
        }
    } else if(req.params.action == 'activate'){
        if(req.query.hostname || req.query.index){
            if(req.query.hostname){
                let index = config.proxies.findIndex(proxy => proxy.hostname == req.query.hostname);
                config.proxies[index].status = 'active';
            }else if(req.query.index){
                config.proxies[req.query.index].status = 'active';
            }
            fs.writeFileSync('./config.json', JSON.stringify(config));
            res.send({ "status": "activated" });
            if( req.query.reload == 'true'){
                loadProxies();
            }
        }else{
            res.send({ "status": "error", "message": "hostname or index is required" });
        }
    }else if(req.params.action == 'deactivate'){
        if(req.query.hostname || req.query.index){
            if(req.query.hostname){
                let index = config.proxies.findIndex(proxy => proxy.hostname == req.query.hostname);
                config.proxies[index].status = 'inactive';
            }else if(req.query.index){
                config.proxies[req.query.index].status = 'inactive';
            }
            fs.writeFileSync('./config.json', JSON.stringify(config));
            res.send({ "status": "deactivated" });
            if( req.query.reload == 'true'){
                loadProxies();
            }
        }else{
            res.send({ "status": "error", "message": "hostname or index is required" });
        }
    }
            
});
app.get('/proxy/api/login/:token', (req, res, next) => {
    tentativeIpWebServer[req.ip] = tentativeIpWebServer[req.ip]?tentativeIpWebServer[req.ip]+1:1;
    if(tentativeIpWebServer[req.ip] > config.maxTentativePerIp){
        return next();
    }
    if(config.token == CryptoJS.SHA256(req.params.token).toString()){
        res.send({ "status": "connected" });
        tentativeIpWebServer[req.ip] = 0;
        if (autorisedIpWebServer.indexOf(req.ip) == -1){
            autorisedIpWebServer.push(req.ip);
            setTimeout(() => {
                autorisedIpWebServer.splice(autorisedIpWebServer.indexOf(req.ip), 1);
            }, 1000 * 60 * 60);//1h
        }
    }else{
        res.send({ "status": "error" });
    }
})
app.get('/proxy/login', (req, res, next) => {
    if(config.accessApi == 'ip' && req.ip != config.apiIp){
        return next();
    }else if(config.accessApi == 'localhost' && !(req.ip.startsWith('::ffff') || !(req.ip.startsWith('::1')|| req.ip.startsWith('127.') || req.ip.startsWith('192.168.') || req.ip.startsWith('10.')))){
        return next();
    }
    res.sendFile(__dirname + '/proxy-web/login.html');
});
app.get('/proxy/:resource', (req, res, next) => {
    console.log(req.ip,autorisedIpWebServer.indexOf(req.ip));
    if(autorisedIpWebServer.indexOf(req.ip) == -1){
        return next();
    }
    if(config.pageWeb.indexOf(req.params.resource) == -1){
        next();
        return
    }
    res.sendFile(__dirname + '/proxy-web/'+req.params.resource);
});

function getLocalNetworkInfo() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return {
                    address: iface.address,
                    netmask: iface.netmask
                };
            }
        }
    }
    throw new Error('No external IPv4 network interface found.');
}

function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isSameNetwork(ip, localInfo) {
    const ipInt = ipToInt(ip);
    const localIpInt = ipToInt(localInfo.address);
    const netmaskInt = ipToInt(localInfo.netmask);

    return (ipInt & netmaskInt) === (localIpInt & netmaskInt);
}

function isLocalIP(ip) {
    const localInfo = getLocalNetworkInfo();
    return isSameNetwork(ip, localInfo);
}



// Middleware pour rediriger selon le nom d'hôte
app.use((req, res, next) => {
    let host = req.headers.host.split(':')[0];
    log.l('host: '+host);
    if (proxyMiddleware[host]) {
        proxyMiddleware[host](req, res, next)
    }else{
        res.status(404).send('Aucun proxy inverse configuré pour cet hôte');
    }
});

// Démarrer le serveur
const PORT = config.port;
start({ app, port: PORT, f: loadProxies });



