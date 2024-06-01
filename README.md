# reverse-proxy

## Description

This project is a proxy server with a web interface for configuration. It allows you to add, remove, and activate proxies through a simple web interface.


## Project Structure

Here is the structure of the project:
```plaintext
    .gitignore
    index.js
    log.js
    package.json
    proxy-web/
        index.html
        login.html
        script.js
        styles.css
    README.md
```


## Main Files
    - index.js: This is the main server file. It handles incoming requests and manages the proxy configuration.
    - log.js: This file contains the logging functionality for the server.
    - proxy-web/: This directory contains the web interface for the proxy server.
## Web Interface
The web interface is located in the [proxy-web/](https://github.com/micuit-cuit/reverse-proxy/tree/main/proxy-web) directory. It includes the following files:

    - index.html: The main page of the web interface.
    - login.html: The login page for the web interface.
    - script.js: The JavaScript file that handles the functionality of the web interface.
    - styles.css: The CSS file that styles the web interface.

## How to Use
To use this project, you need to run the [index.js](https://github.com/micuit-cuit/reverse-proxy/tree/main/index.js) file. This will start the server on a default port (80). You can then access the web interface by navigating to `http://localhost:80/proxy/login` in your browser. The default token is `admin`.
for change the token, you need to generate a md5 hash and replace it in the config.json file created during the first run of the server.

## Author
- [micuit-cuit](https://github.com/micuit-cuit)
