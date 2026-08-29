package com.airenburen.beatsaberweb;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

/**
 * 启动器 Activity：
 * 1. 启动前台服务（内嵌 HTTP 服务器，把 assets/www 跑在 http://localhost:PORT）
 * 2. 唤起 Meta Quest Browser 打开该地址，游戏在浏览器里以 WebXR 全速运行
 *
 * 这样 APK 本身不需要 WebView（Android WebView 不支持 WebXR），
 * 借用 Quest 浏览器的 WebXR 引擎，同时实现完全离线游玩。
 */
public class MainActivity extends Activity {

    private static final String QUEST_BROWSER_PACKAGE = "com.oculus.browser";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 13+ 通知权限（前台服务通知需要）
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 1);
        }

        // 启动前台服务（服务器），它起来后会把端口写进 ServerService.startedPort
        Intent service = new Intent(this, ServerService.class);
        startForegroundService(service);

        int port = ServerService.startedPort;
        if (port == 0) {
            // 服务是异步启动的，等下一次点击再打开浏览器；先给用户一个提示
            Toast.makeText(this, "本地服务器启动中，请再点一次图标打开游戏", Toast.LENGTH_LONG).show();
            moveTaskToBack(true);
            return;
        }

        openBrowser(port);
        // 启动器本身不占前台，退到后台（服务器由前台服务保活）
        moveTaskToBack(true);
    }

    private void openBrowser(int port) {
        String url = "http://localhost:" + port + "/";
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        // 优先用 Meta Quest Browser（内置 WebXR 支持）
        view.setPackage(QUEST_BROWSER_PACKAGE);
        try {
            startActivity(view);
            return;
        } catch (Exception e) {
            // 找不到 Quest Browser，退回系统默认浏览器
        }
        try {
            Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(fallback);
        } catch (Exception e) {
            Toast.makeText(this, "未找到可用浏览器", Toast.LENGTH_LONG).show();
        }
    }
}
