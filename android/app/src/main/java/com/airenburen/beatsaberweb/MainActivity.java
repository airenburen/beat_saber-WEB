package com.airenburen.beatsaberweb;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

/**
 * 启动器 Activity：
 * 1. 启动前台服务（内嵌 HTTP 服务器，把 assets/www 跑在 http://localhost:PORT）
 * 2. 界面实时显示启动进度，就绪后提示"服务开启成功"并自动唤起 Quest 浏览器
 *
 * APK 本身不用 WebView（Android WebView 不支持 WebXR），
 * 借用 Quest 浏览器的 WebXR 引擎，实现完全离线游玩。
 */
public class MainActivity extends Activity implements ServerService.OnServerReadyListener {

    private static final String QUEST_BROWSER_PACKAGE = "com.oculus.browser";
    private static final long OPEN_DELAY_MS = 900; // 留出时间让用户看到成功提示

    private TextView statusText;
    private Button openBtn;
    private boolean launched = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        buildUi();

        // Android 13+ 通知权限（前台服务通知需要）
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 1);
        }

        setStatus("正在启动本地服务器…");
        startForegroundService(new Intent(this, ServerService.class));
        // 服务若已就绪（二次点击图标），立即进入打开流程；否则等回调
        ServerService.readyListener = this;
        if (ServerService.startedPort != 0) {
            onServerReady(ServerService.startedPort);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // singleTask：应用已在前台/后台时再次点图标走这里
        launched = false;
        openBtn.setVisibility(View.GONE);
        setStatus("正在启动本地服务器…");
        ServerService.readyListener = this;
        if (ServerService.startedPort != 0) {
            onServerReady(ServerService.startedPort);
        }
    }

    @Override
    public void onServerReady(int port) {
        setStatus("服务开启成功！即将打开浏览器…");
        statusText.postDelayed(() -> launchBrowser(port), OPEN_DELAY_MS);
    }

    /** 全部用原生组件构建：标题 + 进度圈 + 状态文字 + 兜底按钮 */
    private void buildUi() {
        float d = getResources().getDisplayMetrics().density;
        int pad = (int) (36 * d);
        int gap = (int) (22 * d);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(0xFF0B0F1A);
        root.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText("Beat Saber WEB");
        title.setTextSize(28);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(0xFF3D9BFF);
        title.setGravity(Gravity.CENTER);

        ProgressBar spinner = new ProgressBar(this);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        sp.topMargin = gap;
        sp.bottomMargin = gap;
        spinner.setLayoutParams(sp);

        statusText = new TextView(this);
        statusText.setTextSize(15);
        statusText.setTextColor(0xFFB9C4E0);
        statusText.setGravity(Gravity.CENTER);

        openBtn = new Button(this);
        openBtn.setText("打开浏览器");
        openBtn.setVisibility(View.GONE);
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bp.topMargin = gap;
        openBtn.setLayoutParams(bp);
        openBtn.setOnClickListener(v -> {
            int port = ServerService.startedPort;
            if (port != 0) launchBrowser(port);
            else setStatus("服务器尚未就绪，请稍候…");
        });

        root.addView(title);
        root.addView(spinner);
        root.addView(statusText);
        root.addView(openBtn);
        setContentView(root);
    }

    private void launchBrowser(int port) {
        if (launched) return;
        launched = true;
        String url = "http://localhost:" + port + "/";

        // 优先用 Meta Quest Browser（内置 WebXR 支持）
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        view.setPackage(QUEST_BROWSER_PACKAGE);
        try {
            startActivity(view);
            return;
        } catch (Exception ignored) {
        }
        // 找不到 Quest Browser，退回系统默认浏览器
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception e) {
            launched = false;
            setStatus("未找到可用浏览器，请安装后重试");
            openBtn.setVisibility(View.VISIBLE);
        }
    }

    private void setStatus(final String s) {
        runOnUiThread(() -> statusText.setText(s));
    }

    @Override
    protected void onDestroy() {
        if (ServerService.readyListener == this) {
            ServerService.readyListener = null;
        }
        super.onDestroy();
    }
}
