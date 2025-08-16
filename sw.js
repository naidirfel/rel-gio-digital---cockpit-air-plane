// Service Worker para Cockpit Watch PWA
const CACHE_NAME = 'cockpit-watch-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    './manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Todos os arquivos foram cacheados');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Erro durante a instalação:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Ativado com sucesso');
            return self.clients.claim();
        })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna o cache se encontrado
                if (response) {
                    console.log('Service Worker: Servindo do cache:', event.request.url);
                    return response;
                }
                
                // Caso contrário, busca na rede
                console.log('Service Worker: Buscando na rede:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Verifica se a resposta é válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clona a resposta para o cache
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(error => {
                        console.error('Service Worker: Erro na requisição:', error);
                        
                        // Retorna uma resposta offline personalizada se necessário
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Manipulação de mensagens do cliente
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    // Gerenciamento de alarmes
    if (event.data && event.data.type === 'SCHEDULE_ALARM') {
        const { alarmId, time, sound, enabled } = event.data;
        
        if (enabled) {
            scheduledAlarms.set(alarmId, {
                time: time, // tempo em minutos desde meia-noite
                sound: sound,
                date: new Date(),
                triggered: false
            });
            console.log('Service Worker: Alarme agendado para', time, 'minutos');
        } else {
            scheduledAlarms.delete(alarmId);
            console.log('Service Worker: Alarme cancelado');
        }
        
        // Responder ao cliente
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
        }
    }
    
    if (event.data && event.data.type === 'CANCEL_ALARM') {
        const { alarmId } = event.data;
        scheduledAlarms.delete(alarmId);
        console.log('Service Worker: Alarme cancelado:', alarmId);
        
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
        }
    }
});

// Sistema de alarmes em background
let scheduledAlarms = new Map();

// Sincronização em background (para futuras funcionalidades)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Executando sincronização em background');
        event.waitUntil(
            // Aqui você pode adicionar lógica para sincronizar dados
            Promise.resolve()
        );
    }
    
    if (event.tag === 'alarm-check') {
        console.log('Service Worker: Verificando alarmes programados');
        event.waitUntil(checkScheduledAlarms());
    }
});

// Função para verificar alarmes programados
function checkScheduledAlarms() {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return new Promise((resolve) => {
        // Verificar alarmes agendados
        scheduledAlarms.forEach((alarmData, alarmId) => {
            if (alarmData.time === currentTime && !alarmData.triggered) {
                // Marcar como disparado para evitar repetições
                alarmData.triggered = true;
                
                // Disparar notificação
                self.registration.showNotification('🚨 Alarme do Cockpit Watch', {
                    body: `Alarme programado para ${String(Math.floor(alarmData.time / 60)).padStart(2, '0')}:${String(alarmData.time % 60).padStart(2, '0')}`,
                    icon: './icon-192x192.png',
                    badge: './icon-72x72.png',
                    vibrate: [200, 100, 200, 100, 200],
                    tag: 'cockpit-alarm',
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'dismiss',
                            title: 'Dispensar',
                            icon: './icon-72x72.png'
                        },
                        {
                            action: 'snooze',
                            title: 'Soneca (5 min)',
                            icon: './icon-72x72.png'
                        }
                    ],
                    data: {
                        alarmId: alarmId,
                        sound: alarmData.sound || 'beep'
                    }
                });
            }
        });
        
        // Limpar alarmes já disparados do dia anterior
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        scheduledAlarms.forEach((alarmData, alarmId) => {
            if (alarmData.date < yesterday) {
                scheduledAlarms.delete(alarmId);
            }
        });
        
        resolve();
    });
}

// Notificações push (para futuras funcionalidades de alarme)
self.addEventListener('push', event => {
    console.log('Service Worker: Notificação push recebida');
    
    const options = {
        body: event.data ? event.data.text() : 'Alarme do Cockpit Watch!',
        icon: './icon-192x192.png',
        badge: './icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'cockpit-watch-alarm',
        requireInteraction: true,
        actions: [
            {
                action: 'dismiss',
                title: 'Dispensar',
                icon: './icon-72x72.png'
            },
            {
                action: 'snooze',
                title: 'Soneca (5 min)',
                icon: './icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Cockpit Watch', options)
    );
});

// Clique em notificações
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Clique na notificação:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        // Apenas fecha a notificação
        return;
    }
    
    if (event.action === 'snooze') {
        // Implementar lógica de soneca
        console.log('Service Worker: Soneca ativada');
        return;
    }
    
    // Abre o app
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then(clientList => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('./');
                }
            })
    );
});

// Atualização do Service Worker
self.addEventListener('updatefound', () => {
    console.log('Service Worker: Nova versão encontrada');
});

// Log de erros
self.addEventListener('error', event => {
    console.error('Service Worker: Erro:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Promise rejeitada:', event.reason);
});