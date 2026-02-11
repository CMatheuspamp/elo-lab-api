// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Os mesmos dados do ficheiro anterior
firebase.initializeApp({
    apiKey: "AIzaSyCG8u2HizyUS6usJ6fScw3CM8ZErAh1hHk",
    authDomain: "elolab-ad6a0.firebaseapp.com",
    projectId: "elolab-ad6a0",
    storageBucket: "elolab-ad6a0.firebasestorage.app",
    messagingSenderId: "1098483361740",
    appId: "1:1098483361740:web:be3b6029ed3955add8df69"
});

const messaging = firebase.messaging();

// Lógica que roda em background quando recebe uma notificação
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Recebeu notificação em background ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png' // Coloque o nome da sua logo se tiver
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});