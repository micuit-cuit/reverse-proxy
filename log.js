//require('../utils/log.js').install(__dirname, __filename.replace(__dirname, ''));


class Log {
    constructor({ showDate = true, showColor = true ,infoColor = 'green', errorColor = 'red', warningColor = 'yellow'} = {}) {
        this.showDate = showDate;
        this.showColor = showColor;
        this.infoColor = infoColor;
        this.errorColor = errorColor;
        this.warningColor = warningColor;
    }
    l(message) {
        this.logs(message);
    }
    help() {
        let showDate = this.showDate;
        this.showDate = false;
        this.logs('Liste des commandes :', 'info');
        this.logs('    l(message) : Affiche un message', 'info');
        this.logs('    info(message) : Affiche un message en vert', 'info');
        this.logs('    error(message) : Affiche un message en rouge', 'info');
        this.logs('    warning(message) : Affiche un message en jaune', 'info');
        this.logs('    color(message, color) : Affiche un message en couleur', 'info');
        this.logs('        Liste des couleurs :', 'info');
        this.logs('            red : Rouge', 'info');
        this.logs('            green : Vert', 'info');
        this.logs('            yellow : Jaune', 'info');
        this.logs('            blue : Bleu', 'info');
        this.logs('            magenta : Magenta', 'info');
        this.logs('            cyan : Cyan', 'info');
        this.logs('            white : Blanc', 'info');
        this.showDate = showDate
    }
    info(message) {
        this.logs(message, 'info');
    }
    error(message) {
        this.logs(message, 'error');
    }
    warning(message) {
        this.logs(message, 'warning');
    }
    color(message, color) {
        this.logs(message, 'color', color);
    }
    logs(message, type = 'info', color = 'white') {
        if (this.showColor) {
            switch (type) {
                case 'info':
                    message = colorise(message, this.infoColor);
                    break;
                case 'error':
                    message = colorise(message, this.errorColor);
                    break;
                case 'warning':
                    message = colorise(message, this.warningColor);
                    break;
                case 'color':
                    message = colorise(message, color);
            }
        }
        if (this.showDate) {
            //met la date en violet
            message = `\x1b[1;35m[${new Date().toLocaleString()}]\x1b[0m: ` + message;
        }
        console.log(message+'\x1b[0m');
    }
}
function start(
    {app, port=3000, f} = {}
        ) {
    app.listen(port, () => {
        //recuperre toute les adresse ip du serveur
        const os = require('os');
        let ifaces = os.networkInterfaces();
        let ips = [];
        Object.keys(ifaces).forEach(function (ifname) {
            let alias = 0;
            ifaces[ifname].forEach(function (iface) {

                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                if (alias >= 1) {
                    ips.push(iface.address);
                } else {
                    ips.push(iface.address);
                }
                ++alias;
            });
        });
        ips.push('localhost');
        //affiche en vert les adresse ip du serveur + le port {fleche qui descend et tourne a droite en caractere speciaux: \\u21B3}↳
        console.log(`\x1b[1;31mServer lancé sur les adresses suivantes :\n${ips.map(ip => `    \x1b[1;36m↳\x1b[1;33mhttp://\x1b[1;32m${ip}\x1b[1;34m:${port}`).join('\n')} \x1b[1;33m\nPour l'arreter : Ctrl + C \x1b[0m\n`);
        if (f) {
            f();
        }
    });
}
install = function (path, fileProject = 'index.js') {
    //copie le fichier log.js dans le dossier du projet
    //modifie le fichier du projet pour utiliser le fichier log.js
    //il se trouve initialement dans le dossier Document/dev/utils/log.js
    const fs = require('fs');
    const filePath = '/home/micuit-cuit/Documents/dev/utils/log.js';
    //copie le fichier log.js dans le dossier du projet
    fs.copyFile(filePath, path+"/log.js", (err) => {
        if (err) throw err;
        console.log('log.js was copied to destination');
    });
    //modifie le fichier du projet pour utiliser le fichier log.js
    fs.readFile(path + '/' + fileProject, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        //ajoute const {start,Log,install} = require('../utils/log.js'); au debut du fichier
        let result = "const {start,Log,install} = require('./log.js');\n" + data;
        fs.writeFile(path + '/' + fileProject, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}
function colorise(message, color) {
    switch (color) {
        case 'red':
            message = `\x1b[1;31m${message}\x1b[0m`;
            break;
        case 'green':
            message = `\x1b[1;32m${message}\x1b[0m`;
            break;
        case 'yellow':
            message = `\x1b[1;33m${message}\x1b[0m`;
            break;
        case 'blue':
            message = `\x1b[1;34m${message}\x1b[0m`;
            break;
        case 'magenta':
            message = `\x1b[1;35m${message}\x1b[0m`;
            break;
        case 'cyan':
            message = `\x1b[1;36m${message}\x1b[0m`;
            break;
        case 'white':
            message = `\x1b[1;37m${message}\x1b[0m`;
            break;
    }
    return message;
}
module.exports = {
    start,
    Log,
    install
}