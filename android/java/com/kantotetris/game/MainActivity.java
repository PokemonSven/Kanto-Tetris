package com.kantotetris.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.res.Configuration;
import android.hardware.input.InputManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity implements InputManager.InputDeviceListener {
    static final String ORIGIN="https://appassets.androidplatform.net";
    static final int EXPORT=41,IMPORT=42,NATIVE_IMPORT=43;
    static final int MAX_BACKUP=2*1024*1024;
    WebView web;
    private final Handler ui=new Handler(Looper.getMainLooper());
    private final Map<Integer,ControllerState> pads=new LinkedHashMap<>();
    private InputManager inputs;
    private ValueCallback<Uri[]> fileResult;
    private String pendingExport;
    private boolean ready=false,foreground=false,focused=false;
    private volatile int width=1280,height=960;
    private volatile float density=1;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        immersive();
        web=new WebView(this);web.setBackgroundColor(0xff182632);
        WebSettings s=web.getSettings();
        s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(false);s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false);s.setTextZoom(100);
        s.setUseWideViewPort(true);s.setLoadWithOverviewMode(true);s.setSupportZoom(false);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);web.setFocusableInTouchMode(true);
        web.addJavascriptInterface(new HostBridge(),"KantoHost");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if("https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getHost())&&"/index.html".equals(uri.getPath())){
                    try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(Exception ignored){}
                }
                if("https".equals(uri.getScheme())&&"appassets.androidplatform.net".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/music/")){
                    String range=null;for(Map.Entry<String,String> header:request.getRequestHeaders().entrySet())if("range".equalsIgnoreCase(header.getKey()))range=header.getValue();
                    return OfflineMusic.serve(getAssets(),uri.getPath(),range);
                }
                // Only packaged game assets are served; remote documents never receive the bridge.
                return new WebResourceResponse("text/plain","UTF-8",403,"Offline",null,new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                Uri uri=request.getUrl();
                if(uri.toString().startsWith(ORIGIN+"/index.html#"))return false;
                if("https".equals(uri.getScheme())||"http".equals(uri.getScheme())){
                    pauseGame();
                    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){
                ready=true;updateDisplay();sendPads();
                if(!foreground||!focused)pauseGame();
            }
            @Override public boolean onRenderProcessGone(WebView view,android.webkit.RenderProcessGoneDetail detail){
                ready=false;
                new AlertDialog.Builder(MainActivity.this).setTitle("Game needs to reopen")
                    .setMessage("Android stopped the game renderer. Reopen to continue from the last saved state.")
                    .setPositiveButton("REOPEN",(d,w)->recreate()).setNegativeButton("CLOSE",(d,w)->finish()).show();return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
                if(fileResult!=null)fileResult.onReceiveValue(null);fileResult=callback;pauseGame();
                Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                pick.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});
                try{startActivityForResult(pick,IMPORT);}catch(Exception e){callback.onReceiveValue(null);fileResult=null;backupResult(false,"No file picker is available on this device.");}
                return true;
            }
        });
        web.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->updateDisplay());
        setContentView(web);web.requestFocus();
        inputs=(InputManager)getSystemService(INPUT_SERVICE);inputs.registerInputDeviceListener(this,ui);
        for(int id:InputDevice.getDeviceIds())addPad(id);
        updateDisplay();web.loadUrl(ORIGIN+"/index.html");
    }
    private void immersive(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);}
    private void updateDisplay(){
        if(web!=null&&web.getWidth()>0&&web.getHeight()>0){width=web.getWidth();height=web.getHeight();}
        density=getResources().getDisplayMetrics().density;
        js("window.KantoAndroid&&KantoAndroid.display("+displayJSON()+")");
    }
    private String displayJSON(){return "{\"width\":"+width+",\"height\":"+height+",\"density\":"+density+"}";}
    void js(String code){if(ready&&web!=null)web.evaluateJavascript(code,null);}
    private boolean isPad(InputDevice device){return device!=null&&(device.supportsSource(InputDevice.SOURCE_GAMEPAD)||device.supportsSource(InputDevice.SOURCE_JOYSTICK)||device.supportsSource(InputDevice.SOURCE_DPAD));}
    private void addPad(int id){if(isPad(InputDevice.getDevice(id)))pads.computeIfAbsent(id,k->new ControllerState());}
    @Override public void onInputDeviceAdded(int id){addPad(id);sendPads();}
    @Override public void onInputDeviceChanged(int id){if(pads.containsKey(id)){pads.remove(id);pauseGame();}addPad(id);sendPads();}
    @Override public void onInputDeviceRemoved(int id){if(pads.remove(id)!=null){pauseGame();sendPads();}}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(event.getKeyCode()==KeyEvent.KEYCODE_BACK){if(event.getAction()==KeyEvent.ACTION_UP)onBackPressed();return true;}
        if((isPad(event.getDevice())||event.isFromSource(InputDevice.SOURCE_GAMEPAD)||event.isFromSource(InputDevice.SOURCE_DPAD))&&ControllerState.buttonForKey(event.getKeyCode())>=0){
            if(event.getAction()!=KeyEvent.ACTION_DOWN&&event.getAction()!=KeyEvent.ACTION_UP)return true;
            ControllerState pad=pads.computeIfAbsent(event.getDeviceId(),k->new ControllerState());
            if(pad!=null){pad.key(event.getKeyCode(),event.getAction()==KeyEvent.ACTION_DOWN,event.getRepeatCount());if(foreground&&focused)sendPads();}
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
    private float axis(MotionEvent e,int axis){return e.getAxisValue(axis);}
    private float flat(MotionEvent e,int axis){InputDevice d=e.getDevice();InputDevice.MotionRange r=d==null?null:d.getMotionRange(axis,e.getSource());return r==null?.15f:r.getFlat();}
    @Override public boolean dispatchGenericMotionEvent(MotionEvent e){
        if((isPad(e.getDevice())||e.isFromSource(InputDevice.SOURCE_JOYSTICK))&&e.getActionMasked()==MotionEvent.ACTION_MOVE){
            ControllerState p=pads.computeIfAbsent(e.getDeviceId(),k->new ControllerState());
            int[] a={MotionEvent.AXIS_X,MotionEvent.AXIS_Y,MotionEvent.AXIS_Z,MotionEvent.AXIS_RZ,MotionEvent.AXIS_HAT_X,MotionEvent.AXIS_HAT_Y};
            for(int i=0;i<a.length;i++)p.axis(i,axis(e,a[i]),flat(e,a[i]));
            p.axis(6,Math.max(axis(e,MotionEvent.AXIS_LTRIGGER),axis(e,MotionEvent.AXIS_BRAKE)),flat(e,MotionEvent.AXIS_LTRIGGER));
            p.axis(7,Math.max(axis(e,MotionEvent.AXIS_RTRIGGER),axis(e,MotionEvent.AXIS_GAS)),flat(e,MotionEvent.AXIS_RTRIGGER));
            if(foreground&&focused)sendPads();return true;
        }
        return super.dispatchGenericMotionEvent(e);
    }
    private void sendPads(){
        if(!ready)return;
        if(pads.isEmpty()){js("window.KantoAndroid&&KantoAndroid.pad(null)");return;}
        try{
            JSONObject packet=new JSONObject();JSONArray buttons=new JSONArray(),axes=new JSONArray();
            for(int b=0;b<17;b++){float value=0;for(ControllerState p:pads.values())value=Math.max(value,p.button(b));buttons.put(value);}
            for(int a=0;a<4;a++){float value=0;for(ControllerState p:pads.values())if(Math.abs(p.axes[a])>Math.abs(value))value=p.axes[a];axes.put(value);}
            packet.put("buttons",buttons);packet.put("axes",axes);packet.put("id","Android controller "+pads.keySet());
            js("window.KantoAndroid&&KantoAndroid.pad("+packet+")");
        }catch(Exception ignored){}
    }
    private void pauseGame(){
        js("window.KantoAndroid&&KantoAndroid.lifecycle(false)");
        for(ControllerState p:pads.values())p.suspend();sendPads();
    }
    @Override protected void onPause(){foreground=false;pauseGame();if(web!=null)web.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();foreground=true;immersive();if(web!=null){web.onResume();js("window.KantoAndroid&&KantoAndroid.lifecycle(true)");}}
    @Override public void onWindowFocusChanged(boolean hasFocus){super.onWindowFocusChanged(hasFocus);focused=hasFocus;if(!hasFocus)pauseGame();else{immersive();if(foreground){js("window.KantoAndroid&&KantoAndroid.lifecycle(true)");sendPads();}}}
    @Override public void onConfigurationChanged(Configuration c){super.onConfigurationChanged(c);immersive();updateDisplay();}
    @Override public void onBackPressed(){js("window.KantoAndroid&&KantoAndroid.back()");}
    @Override protected void onDestroy(){if(inputs!=null)inputs.unregisterInputDeviceListener(this);if(fileResult!=null)fileResult.onReceiveValue(null);if(web!=null){web.removeJavascriptInterface("KantoHost");web.destroy();web=null;}super.onDestroy();}
    private void backupResult(boolean ok,String message){js("window.KantoAndroid&&KantoAndroid.exportResult("+ok+","+JSONObject.quote(message)+")");}
    private void importResult(String text,String error){js("window.KantoAndroid&&KantoAndroid.importResult("+(text==null?"null":JSONObject.quote(text))+","+(error==null?"null":JSONObject.quote(error))+")");}
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==IMPORT&&fileResult!=null){fileResult.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileResult=null;}
        if(request==NATIVE_IMPORT){
            if(result!=RESULT_OK||data==null||data.getData()==null){importResult(null,"Import cancelled. Existing saves were kept.");return;}
            Uri uri=data.getData();
            new Thread(()->{
                try(InputStream in=getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()){
                    if(in==null)throw new Exception("Unable to read the selected file.");
                    byte[] buffer=new byte[8192];int count;
                    while((count=in.read(buffer))!=-1){if(out.size()+count>MAX_BACKUP)throw new Exception("Choose a JSON backup no larger than 2 MB.");out.write(buffer,0,count);}
                    String text=new String(out.toByteArray(),StandardCharsets.UTF_8);ui.post(()->importResult(text,null));
                }catch(Exception e){String message=e.getMessage();ui.post(()->importResult(null,message==null?"Unable to read the selected file.":message));}
            },"backup-import").start();
        }
        if(request==EXPORT){
            String json=pendingExport;pendingExport=null;
            if(result!=RESULT_OK||data==null||data.getData()==null){backupResult(true,"Export cancelled. Existing saves were kept.");return;}
            if(json==null){backupResult(false,"Export interrupted. Please export again.");return;}
            Uri uri=data.getData();
            new Thread(()->{
                boolean ok=true;String message="Backup saved to your selected file.";
                try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new Exception();out.write(json.getBytes(StandardCharsets.UTF_8));out.flush();}
                catch(Exception e){ok=false;message="Backup could not be written. Try another folder.";}
                final boolean success=ok;final String status=message;ui.post(()->backupResult(success,status));
            },"backup-export").start();
        }
    }
    final class HostBridge {
        @JavascriptInterface public String display(){return displayJSON();}
        @JavascriptInterface public String faceLayout(){return getPreferences(MODE_PRIVATE).getString("faceLayout","standard");}
        @JavascriptInterface public void setFaceLayout(String value){if("standard".equals(value)||"swapped".equals(value))getPreferences(MODE_PRIVATE).edit().putString("faceLayout",value).apply();}
        @JavascriptInterface public void importBackup(){ui.post(()->{
            pauseGame();Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
            pick.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});
            try{startActivityForResult(pick,NATIVE_IMPORT);}catch(Exception e){importResult(null,"No file picker is available on this device.");}
        });}
        @JavascriptInterface public void exportBackup(String json,String name){
            if(json==null||json.getBytes(StandardCharsets.UTF_8).length>MAX_BACKUP){ui.post(()->backupResult(false,"Backup exceeds the 2 MB limit."));return;}
            ui.post(()->{
                if(pendingExport!=null){backupResult(false,"Finish the open export dialog first.");return;}
                pendingExport=json;pauseGame();
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^A-Za-z0-9._-]","_"));
                try{startActivityForResult(intent,EXPORT);}catch(Exception e){pendingExport=null;backupResult(false,"No file picker is available on this device.");}
            });
        }
        @JavascriptInterface public void exit(){ui.post(()->new AlertDialog.Builder(MainActivity.this).setTitle("Close Kanto Tetris?").setMessage("Your saved runs stay on this device.").setNegativeButton("CANCEL",null).setPositiveButton("CLOSE",(d,w)->finish()).show());}
    }
}
