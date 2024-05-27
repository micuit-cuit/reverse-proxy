const token = localStorage.getItem('token');
console.log(token, localStorage);
let proxiesList = [];
function reloadList() {
    let content = document.getElementById('content');
    content.innerHTML = '<h1 id="add" onclick="addProxy()">AJOUTER</h1>';
    fetch('/api/proxies/list', {
        method: "GET",
        headers: {
            "x-token": token
        }
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Error');
            }
        })
        .then(proxies => {
            proxiesList = proxies.all;
            let editProxies = false;
            proxies.all.forEach(proxy => {
                const div = document.createElement('div');
                div.classList.add('proxy');
                //test si le proxy est dans la liste des proxy actif
                if (proxies.loaded.includes(proxy.hostname)) {
                    if (proxy.status === 'active') {
                        div.classList.add('active');
                    }else{
                        div.classList.add('edit');
                        editProxies = true;
                    }
                }else{
                    if (proxy.status === 'active') {
                        div.classList.add('edit');
                        editProxies = true;
                    }else{
                        div.classList.add('inactive');
                    }
                }
                proxy.id = proxies.all.indexOf(proxy);
                div.id = "proxy-"+proxy.id;
                div.innerHTML = `
                    <div class="proxy-info">
                        <h2>${proxy.hostname}</h2>
                        <p>${proxy.target} - ${proxy.status}</p>
                    </div>
                    <div class="proxy-actions">
                        <div onclick="deleteProxy('${proxy.id}')">🗑</div>
                            <label class="switch">
                                <input type="checkbox" ${proxy.status === 'active' ? 'checked' : ''} onclick="toggleProxy('${proxy.id}')">
                                <span class="slider round"></span>
                            </label>
                    </div>
                `;
                content.appendChild(div);

            });
            if (editProxies) {
                const applyButton = document.createElement('div');
                applyButton.id = 'apply';
                applyButton.innerText = '✅';
                applyButton.onclick = function(){
                    fetch('/api/proxies/reload', {
                        method: "GET",
                        headers: {
                            "x-token": token
                        }
                    })
                        .then(res => res.json())
                        .then(body => {
                            if (body.status === 'reloaded') {
                                reloadList();
                            } else {
                                console.error(body);
                            }
                        })
                }
                content.appendChild(applyButton);
            }
        })
};

function addProxy() {
    const hostname = prompt('Hostname');
    const target = prompt('Target');
    if (!hostname || !target) {
        return;
    }
    fetch('/api/proxies/add?hostname=' + hostname + '&target=' + target+'&status=inactive&reload=true', {
        method: "GET",
        headers: {
            "x-token": token
        }
    })
        .then(response => {
            if (response.ok) {
                reloadList();
            } else {
                throw new Error('Error');
            }
        })
}
function deleteProxy(id) {
    fetch('/api/proxies/remove?index=' + id+'&reload=false', {
        method: "GET",
        headers: {
            "x-token": token
        }
    })
        .then(res => res.json())
        .then(body => {
            if (body.status === 'removed') {
                reloadList();            
            } else {
                console.error(body);
            }
        })
}
function toggleProxy(id) {
    fetch('/api/proxies/'+(proxiesList[id].status === 'active' ? 'deactivate' : 'activate')+'?index=' + id+'&reload=false', {
        method: "GET",
        headers: {
            "x-token": token
        }
    })
        .then(res => res.json())
        .then(body => {
            if (body.status === 'deactivated' || body.status === 'activated') {
                reloadList();
            } else {
                console.error(body);
            }
        })
    
}


reloadList();