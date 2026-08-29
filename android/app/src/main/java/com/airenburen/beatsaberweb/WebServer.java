package com.airenburen.beatsaberweb;

import android.content.Context;
import android.content.res.AssetManager;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import fi.iki.elonen.NanoHTTPD;

/**
 * 内嵌 HTTP 服务器：把 assets/www 目录（由 dist/ 同步而来）以 HTTP 方式提供。
 * localhost 在 Chromium 系浏览器（含 Quest Browser）中属于安全上下文，
 * 因此 WebXR / getUserMedia 等需要安全上下文的 API 可用，且无需 HTTPS。
 */
public class WebServer extends NanoHTTPD {

    private static final String WWW_ROOT = "www";

    private final AssetManager assets;

    /** 最近一次收到 HTTP 请求的时间（elapsedRealtime），服务层用于闲置检测 */
    public static volatile long lastRequestMs = android.os.SystemClock.elapsedRealtime();

    public WebServer(Context context, int port) {
        super(port);
        this.assets = context.getAssets();
    }

    @Override
    public Response serve(IHTTPSession session) {
        lastRequestMs = android.os.SystemClock.elapsedRealtime();
        String uri = session.getUri();
        // 心跳：网页每 20s 打一次，证明浏览器还活着（防止服务在后台无限常驻）
        if (uri.equals("/__ping")) {
            Response pong = newFixedResponse(Response.Status.OK, "ok");
            pong.addHeader("Cache-Control", "no-store");
            return pong;
        }
        // 防目录穿越
        if (uri.contains("..")) {
            return newFixedResponse(Response.Status.FORBIDDEN, "Forbidden");
        }
        if (uri.isEmpty() || uri.equals("/")) {
            uri = "/index.html";
        }
        String assetPath = WWW_ROOT + uri;

        InputStream is;
        try {
            is = assets.open(assetPath);
        } catch (IOException e) {
            // SPA 兜底：找不到的路径回落到 index.html（例如带路由前缀的地址）
            try {
                is = assets.open(WWW_ROOT + "/index.html");
                assetPath = WWW_ROOT + "/index.html";
            } catch (IOException e2) {
                return newFixedResponse(Response.Status.NOT_FOUND, "Not Found");
            }
        }

        Response res = newChunkedResponse(Response.Status.OK, mimeOf(assetPath), is);
        res.addHeader("Access-Control-Allow-Origin", "*");
        // 浏览器只在安全上下文对 getUserMedia 放权，这里配合 localhost 即可
        res.addHeader("Permissions-Policy", "camera=(self), xr-spatial-tracking=(self)");
        return res;
    }

    private Response newFixedResponse(Response.Status status, String msg) {
        return newFixedLengthResponse(status, "text/plain", msg);
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".wasm")) return "application/wasm";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".zip")) return "application/zip";
        if (p.endsWith(".task")) return "application/octet-stream";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".obj")) return "text/plain";
        if (p.endsWith(".glb") || p.endsWith(".gltf")) return "model/gltf-binary";
        if (p.endsWith(".map")) return "application/json";
        return "application/octet-stream";
    }
}
