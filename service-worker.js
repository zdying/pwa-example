/**
 * 这个缓存的名称要注意，要有唯一的前缀，否则删除的时候
 * 可能把同域名下其他项目的cache删除
 */
var CONTENT_CACHE_VERSION = 'content_v1.0.5';

importScripts('/pwa-example/src/scripts/log.js');

/**
 * service worker正在安装的时候，创建缓存
 */
this.addEventListener('install', (eve) => {
    log.info(`oninstall event: CONTENT_CACHE_VERSION=${CONTENT_CACHE_VERSION}`);

    //确保Service Worker 不会在 waitUntil() 里面的代码执行完毕之前安装完成
    eve.waitUntil(
        // 创建一个叫CONTENT_CACHE_VERSION 的新的缓存
        caches.open(CONTENT_CACHE_VERSION)
        .then((cache) => {
            return cache.addAll(
                // 想缓存的资源的列表
                [
                    '/pwa-example/index.html',
                    '/pwa-example/source/cnodejs.svg',

                    '/pwa-example/src/scripts/app.js',
                    '/pwa-example/src/styles/style.css',
                    '/pwa-example/src/lib/zepto.min.js'
                ]
            )
        })
        .catch((err) => {

        })
    )
});

/**
 * service worker激活的时候，删除旧版本的缓存
 */
this.addEventListener('activate', (eve) => {
    log.info(`onactivate event:`, eve);

    // 当前需要保留的缓存
    let whiteList = [CONTENT_CACHE_VERSION];

    let deleteOtherCachePromise = caches.keys().then((cacheNames) => {
        log.info('当前缓存：' + cacheNames);

        return Promise.all(cacheNames.map((cacheName) => {
            if(whiteList.indexOf(cacheName) === -1){
                log.info('删除缓存: '+ cacheName);
                return caches.delete(cacheName);
            }
        }));
    });
    // 删除其他版本的cache
    eve.waitUntil(deleteOtherCachePromise);
});

this.addEventListener('push', function(eve){
    log.info(`onpush event:`, eve);
    var title = 'Yay a message.';  
    var body = 'We have received a push message.';  
    var icon = '/pwa-example/source/icon/homescreen192.png';  
    var tag = 'simple-push-demo-notification-tag';

    eve.waitUntil(  
        self.registration.showNotification(title, {  
            body: body,
            icon: icon,
            tag: tag
        })  
    );  
});

this.addEventListener('sync', function(eve){
    log.info(`onsync event:`, eve);
});

/**
 * fetch的时候打印access日志
 */
this.addEventListener('fetch', (eve) => {
    let req = eve.request;

    log.access(req.method, req.url);
});

/**
 * 处理网络请求，有两种策略：
 *    1. 缓存优先：优先查看缓存中是否有请求的资源，如果有则使用缓存的资源，没有再去请求服务器
 *    2. 网络优先：优先去请求服务器上的资源，然后缓存以便offline的时候使用
 */
this.addEventListener('fetch', (eve) => {
    let req = eve.request;
    let url = req.url;

    if(url.indexOf('/api/') !== -1){
        // 如果是数据接口，采用`网络优先`策略
        eve.respondWith(
            fetch(req).then((res) => {
                console.log('fetch api result:', res);
                if(!res || res.status >= 400/* || res.type !== 'basic'*/) {
                    log.error("[fetch handler] etch error: " + (res && res.status))
                    return res;
                }

                return caches.open(CONTENT_CACHE_VERSION).then((cache) => {
                    log.info(`添加API缓存: ${url}`);
                    cache.put(req, res.clone())
                    return res
                });
            }).catch((err) => {
                log.warn('API 请求失败, 返回缓存的结果');
                return caches.match(req);
            })
        )
    }else{
        // 其他资源，采用`缓存优先`策略
        eve.respondWith(
            // 缓存的资源
            caches.match(req)
            .then((res) => {
                if(res){
                    log.info(`已经返回缓存的资源, url: ${res.url}`);
                    return res;
                }else{
                    log.warn(`资源没有被缓存, url: ${url}, 请求并缓存`);
                    return fetch(req).then((res) => {
                        if(!res || res.status >= 400/* || res.type !== 'basic'*/) {
                            log.error("[fetch handler] etch error: " + (res && res.status))
                            return res;
                        }

                        //TODO 这里需要看什么样的资源需要缓存
                        return caches.open(CONTENT_CACHE_VERSION).then((cache) => {
                            log.info(`添加缓存: ${req.url}`);
                            cache.put(req, res.clone())
                            return res
                        });
                        // return res
                    })/*.catch((err) => {
                        console.log('资源请求失败，返回默认的图片');
                        return caches.match('/pwa/source/default.png')
                    })*/
                }
            })
        )
    }
});