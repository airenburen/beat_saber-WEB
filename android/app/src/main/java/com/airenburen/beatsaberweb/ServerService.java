package com.airenburen.beatsaberweb;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import java.io.IOException;

/**
 * 前台服务：保活内嵌 HTTP 服务器。
 * 浏览器打开游戏期间，即使启动器 Activity 退到后台，服务器也要一直活着。
 */
public class ServerService extends Service {

    public static final String ACTION_STOP = "com.airenburen.beatsaberweb.STOP";
    private static final String CHANNEL_ID = "bsw_server";
    private static final int NOTIFICATION_ID = 1;

    /** 当前已启动的服务器端口（0 = 未启动），供 MainActivity 读取 */
    public static volatile int startedPort = 0;

    /** 服务器就绪回调（MainActivity 用于刷新界面状态） */
    public interface OnServerReadyListener {
        void onServerReady(int port);
    }

    public static volatile OnServerReadyListener readyListener;

    private WebServer server;
    private PowerManager.WakeLock wakeLock;

    // 闲置看门狗：网页端每 20s 发一次 /__ping 心跳，浏览器关闭后心跳停止，
    // 超过 5 分钟没有请求就自动停掉服务，避免后台无限常驻耗电
    private static final long IDLE_TIMEOUT_MS = 5 * 60 * 1000;
    private final android.os.Handler idleHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable idleCheck = new Runnable() {
        @Override
        public void run() {
            if (server == null) return;
            long idle = android.os.SystemClock.elapsedRealtime() - WebServer.lastRequestMs;
            if (idle > IDLE_TIMEOUT_MS) {
                stopSelf();
            } else {
                idleHandler.postDelayed(this, 30_000);
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        startForeground(NOTIFICATION_ID, buildNotification());
        startServer();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // 再次点击图标时服务已在运行，只需保证服务器存在
        if (server == null) {
            startServer();
        }
        return START_STICKY;
    }

    private void startServer() {
        if (server != null) return;
        int port = findFreePort();
        try {
            server = new WebServer(this, port);
            server.start(NanoHttpdTimeout, true);
            startedPort = port;
            notifyReady(port);
            // 部分情况下 Quest 会在浏览器运行期间休眠后台进程，用 wakelock 保底
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bsw:server");
            wakeLock.acquire();
            idleHandler.removeCallbacks(idleCheck);
            idleHandler.postDelayed(idleCheck, 30_000);
        } catch (IOException e) {
            server = null;
            startedPort = 0;
        }
    }

    private static final int NanoHttpdTimeout = 5000;

    private void notifyReady(final int port) {
        new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
            OnServerReadyListener l = readyListener;
            if (l != null) l.onServerReady(port);
        });
    }

    private int findFreePort() {
        // 从 8080 开始找空闲端口
        for (int p = 8080; p < 8090; p++) {
            try (java.net.ServerSocket ss = new java.net.ServerSocket(p)) {
                ss.setReuseAddress(true);
                return p;
            } catch (IOException ignored) {
            }
        }
        return 0;
    }

    private Notification buildNotification() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "本地游戏服务器", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            nm.createNotificationChannel(ch);
        }
        // 通知里带一个"关闭"按钮，可以彻底关掉服务器和应用
        Intent stopIntent = new Intent(this, ServerService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                this, 0, stopIntent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        return b
                .setContentTitle("Beat Saber WEB 运行中")
                .setContentText("本地服务器已就绪")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setOngoing(true)
                .addAction(new Notification.Action.Builder(
                        null, "关闭游戏", stopPi).build())
                .build();
    }

    @Override
    public void onDestroy() {
        idleHandler.removeCallbacks(idleCheck);
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        if (server != null) {
            server.stop();
            server = null;
        }
        startedPort = 0;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
