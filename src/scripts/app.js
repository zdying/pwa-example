'use strict';

(function(){
    init();

    function init(){
        registerServiceWorker();

        loadData();
    }

    function registerServiceWorker(){
        if('serviceWorker' in navigator){
            navigator.serviceWorker.register('/pwa-example/service-worker.js', {scope: '/pwa-example/'})
                .then((reg) => {
                    console.log(`Service Worker注册成功, scope: ${reg.scope}`);
                    // console.log(reg);
                    initNotification();
                })
                .catch((err) => {
                    console.error(`Service Worker注册失败, message: ${err.message}`);
                    // console.error(err);
                })
        }
    }

    function loadData(){
        let url = `https://cnodejs.org/api/v1/topics`;

        $.ajax({
            url: url,
            data: {limit: 10},
            success: (json, status, xhr) => {
                if(json && json.success === true){
                    rendList(json.data)
                }else{
                    rendError(json.message);
                }
            },

            error: (xhr, errorType, error) => {
                rendError(error.message || 'network error.');
            }
        });
    }

    function rendList(list){
        let html = [];

        list.forEach((item, index) => {
            let {author, title, create_at, visit_count, content} = item;

            html.push(
                `<li>
                    <div class="title">
                        <img class="icon" src="${author.avatar_url}" />
                        <div class="info">
                            <div class="author">${author.loginname}</div>
                            <div class="time">
                                ${create_at.split('T')[0]}
                            </div>
                        </div>
                        <div class="number">
                            <div class="vote">${visit_count}</div>
                            <div class="vote-tips">支持票数</div>
                        </div>
                    </div>
                    <div class="article">
                        <p>${title}</p>
                        <!-- ${content.replace(/<(\w+)>(.*?)<\/\1>/, '$2')} -->
                    </div>
                </li>`
            );
        });

        $('#list').html(html.join(''))
    }

    function rendError(){
        //TODO ...
    }

    // from: https://developers.google.com/web/updates/2015/03/push-notifications-on-the-open-web
    function initNotification(){
        // Are Notifications supported in the service worker?  
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {  
            console.warn('Notifications aren\'t supported.');  
            return;  
        }

        // Check the current Notification permission.  
        // If its denied, it's a permanent block until the  
        // user changes the permission  
        if (Notification.permission === 'denied') {  
            console.warn('The user has blocked notifications.');  
            return;  
        }

        // Check if push messaging is supported  
        if (!('PushManager' in window)) {  
            console.warn('Push messaging isn\'t supported.');  
            return;  
        }

        // We need the service worker registration to check for a subscription  
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
            // Do we already have a push message subscription?  
            serviceWorkerRegistration.pushManager.getSubscription()  
                .then(function(subscription) {
                    if (!subscription) {
                        // We aren't subscribed to push, so set UI  
                        // to allow the user to enable push  
                        console.log('get subscription failed.');
                        return;  
                    }

                    // Keep your server in sync with the latest subscriptionId
                    // sendSubscriptionToServer(subscription);
                    console.log('发送subscription:', subscription);
                })  
                .catch(function(err) {  
                    console.warn('Error during getSubscription()', err);  
                });  
        });
    }
})();