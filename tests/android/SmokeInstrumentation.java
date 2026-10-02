package com.kantotetris.game;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.json.JSONObject;
import org.json.JSONArray;

/** Isolated QA package. No test hooks or runner are included in the release APK. */
public class SmokeInstrumentation extends Instrumentation {
 MainActivity activity;JSONArray results=new JSONArray();String mode="all";
 @Override public void onCreate(Bundle args){super.onCreate(args);if(args!=null)mode=args.getString("mode","all");start();}
 String eval(String code)throws Exception{
  CountDownLatch done=new CountDownLatch(1);String[] result={null};
  runOnMainSync(()->activity.web.evaluateJavascript(code,v->{result[0]=v;done.countDown();}));
  if(!done.await(15,TimeUnit.SECONDS))throw new Exception("JavaScript timed out");return result[0];
 }
 JSONObject state()throws Exception{return new JSONObject(eval("nativeQA.state()"));}
 void check(boolean ok,String name)throws Exception{JSONObject row=new JSONObject();row.put("name",name);row.put("result",ok?"PASS":"FAIL");results.put(row);if(!ok)throw new Exception(name+": "+state());}
 void key(int code,boolean down,int repeats)throws Exception{
  runOnMainSync(()->activity.dispatchKeyEvent(new KeyEvent(SystemClock.uptimeMillis(),SystemClock.uptimeMillis(),down?KeyEvent.ACTION_DOWN:KeyEvent.ACTION_UP,code,repeats,0,-1,0,0,InputDevice.SOURCE_GAMEPAD)));
  eval("0");
 }
 void tap(int code)throws Exception{key(code,true,0);key(code,false,0);}
 void awaitJS(String expression)throws Exception{for(int i=0;i<60;i++){if("true".equals(eval(expression)))return;SystemClock.sleep(100);}throw new Exception("Timed out: "+expression);}
 void fileChecks()throws Exception{
  key(96,false,0);eval("nativeQA.backupOpen('backupExport')");
  File file=new File(activity.getFilesDir(),"roundtrip.json");
  ActivityResult chosen=new ActivityResult(android.app.Activity.RESULT_OK,new Intent().setData(Uri.fromFile(file)));
  IntentFilter exportFilter=new IntentFilter(Intent.ACTION_CREATE_DOCUMENT);exportFilter.addCategory(Intent.CATEGORY_OPENABLE);exportFilter.addDataType("application/json");
  ActivityMonitor export=addMonitor(exportFilter,chosen,true);
  key(96,false,0);tap(96);awaitJS("document.getElementById('backupMessage').textContent.includes('Backup saved to')");
  check(export.getHits()==1&&file.length()>0,"Controller export opens native picker and writes JSON");removeMonitor(export);
  JSONObject backup=new JSONObject(new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8));check(backup.has("data")&&backup.getInt("version")==2,"Native export contains versioned backup");
  eval("KantoAndroid.lifecycle(true);nativeQA.backupOpen('backupChoose')");String stored=eval("nativeQA.backupState()");
  IntentFilter importFilter=new IntentFilter(Intent.ACTION_OPEN_DOCUMENT);importFilter.addCategory(Intent.CATEGORY_OPENABLE);importFilter.addDataType("*/*");
  ActivityMonitor picker=addMonitor(importFilter,chosen,true);
  key(96,false,0);tap(96);awaitJS("!document.getElementById('backupApply').hidden");
  check(picker.getHits()==1&&eval("nativeQA.backupState()").equals(stored),"Controller import reads native file and previews without changing save content");removeMonitor(picker);
  Files.write(file.toPath(),"not json".getBytes(StandardCharsets.UTF_8));
  eval("KantoAndroid.lifecycle(true);nativeQA.backupOpen('backupChoose')");picker=addMonitor(importFilter,chosen,true);
  key(96,false,0);tap(96);awaitJS("document.getElementById('backupMessage').textContent.includes('NOT IMPORTED')");
  check("true".equals(eval("document.getElementById('backupApply').hidden"))&&eval("nativeQA.backupState()").equals(stored),"Invalid native import is rejected without changing save content");removeMonitor(picker);
 }
 void shot(String name)throws Exception{Bitmap bitmap=getUiAutomation().takeScreenshot();if(bitmap!=null){try(FileOutputStream out=new FileOutputStream(new File(activity.getFilesDir(),name))){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}}}
 @Override public void onStart(){
  Bundle output=new Bundle();
  try{
   activity=(MainActivity)startActivitySync(new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
   boolean loaded=false;for(int i=0;i<100;i++){if("true".equals(eval("!!window.nativeQA"))){loaded=true;break;}SystemClock.sleep(200);}
   check(loaded,"Game JavaScript initializes in Android WebView");
   if(mode.equals("audio-native")){
    eval("nativeQASuites.audio(false)");
    eval("document.getElementById('qaGary').click()");awaitJS("nativeAudioState().position>0.1");
    runOnMainSync(()->callActivityOnPause(activity));awaitJS("nativeAudioState().paused");
    double before=Double.parseDouble(eval("nativeAudioState().position"));SystemClock.sleep(300);
    double after=Double.parseDouble(eval("nativeAudioState().position"));check(Math.abs(after-before)<.05,"Native Activity pause stops music at its position ("+before+" → "+after+")");
    runOnMainSync(()->callActivityOnResume(activity));awaitJS("!nativeAudioState().paused && nativeAudioState().position>"+(before+.05));
    check(true,"Native Activity resume continues the track");
    key(96,false,0);eval("nativeAudioFocus()");
    int oldTrack=Integer.parseInt(eval("Number(document.getElementById('trackBtn').textContent.match(/\\d+/)[0])"));
    tap(96);int newTrack=Integer.parseInt(eval("Number(document.getElementById('trackBtn').textContent.match(/\\d+/)[0])"));
    check(newTrack==oldTrack%38+1,"Native controller A advances exactly one soundtrack track");
    shot("soundtrack-native.png");check(state().getJSONArray("errors").length()==0,"Native soundtrack flow has no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.equals("title-native")){
    eval("nativeQASuites.title();");awaitJS("document.getElementById('qaResults').textContent.includes('passed')");
    String report=eval("document.getElementById('qaResults').textContent");output.putString("report",report);
    check("true".equals(eval("JSON.parse(document.getElementById('qaResults').textContent).failed===0")),"Native title layout suite passes");
    eval("document.getElementById('qaGary').click()");SystemClock.sleep(600);shot("title-fresh.png");
    eval("document.getElementById('qaReward').click()");SystemClock.sleep(600);shot("title-saved.png");
    key(96,false,0);for(int i=0;i<12;i++){tap(20);check("true".equals(eval("(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return e.closest('#titleScreen')&&r.top>=0&&r.bottom<=innerHeight})()")),"Native D-pad keeps title action visible at step "+i);}
    eval("document.getElementById('titleAdventureNewBtn').focus()");tap(96);check("adventureSlotsModal".equals(state().optString("root")),"Native A opens Adventure slots");tap(97);check("titleScreen".equals(state().optString("root")),"Native B returns to new title");
    check(state().getJSONArray("errors").length()==0,"Title has no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.equals("handheld-native")){
    eval("nativeQASuites.handheld(false);document.getElementById('qaGary').click()");SystemClock.sleep(250);shot("handheld-game.png");
    eval("document.getElementById('qaReward').click()");SystemClock.sleep(250);shot("handheld-menu.png");
    eval("document.getElementById('mainOptions').click()");SystemClock.sleep(250);shot("handheld-options.png");
    eval("document.getElementById('qaFinale').click()");SystemClock.sleep(250);shot("handheld-oak.png");
    eval("document.getElementById('qaBattle').click()");SystemClock.sleep(250);shot("handheld-battle.png");
    eval("document.getElementById('qaFly').click()");SystemClock.sleep(250);shot("handheld-fly.png");
    key(96,false,0);tap(20);tap(20);tap(20);check("true".equals(eval("(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return e.closest('#flyModal')&&r.top>=0&&r.bottom<=innerHeight})()")),"Native D-pad keeps large Fly selection visible");
    tap(97);check(!"flyModal".equals(state().optString("root")),"Native B closes enlarged Fly map");
    eval("document.getElementById('qaReward').click()");for(int i=0;i<28;i++){tap(20);check("true".equals(eval("(()=>{const r=document.activeElement.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()")),"Native menu focus visible after D-pad step "+i);}
    eval("document.getElementById('qaGary').click()");awaitJS("!document.getElementById('studioIntro').classList.contains('show')&&!document.getElementById('mainMenuModal').classList.contains('show')");SystemClock.sleep(600);shot("handheld-game.png");
    check(state().getJSONArray("errors").length()==0,"Handheld previews have no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.equals("grid-native")){
    eval("nativeQASuites.grid()");awaitJS("document.getElementById('qaResults').textContent.includes('passed')");
    check("true".equals(eval("JSON.parse(document.getElementById('qaResults').textContent).failed===0")),"Grid pixel and geometry suite passes");
    eval("document.getElementById('qaGary').click()");SystemClock.sleep(250);shot("grid-empty.png");
    output.putString("metrics",eval("(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();return {ratio:Number(c.dataset.pixelRatio),dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],visual:{scale:visualViewport.scale,width:visualViewport.width,height:visualViewport.height},rect:{x:r.x,y:r.y,width:r.width,height:r.height},canvas:[c.width,c.height]}})()"));
    eval("document.getElementById('qaReward').click()");SystemClock.sleep(250);shot("grid-blocks.png");
    check(state().getJSONArray("errors").length()==0,"Grid preview has no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.equals("map-native")){
    awaitJS("nativeQA.mapState().mapReady");eval("nativeQA.mapOpen();nativeQA.mapFocus('ROUTE 9')");
    check("ROUTE 9".equals(new JSONObject(eval("nativeQA.mapState()")).optString("hover")),"Native focus highlights Route 9");
    tap(20);check(!"ROUTE 9".equals(new JSONObject(eval("nativeQA.mapState()")).optString("hover")),"Native D-pad moves map selection");
    eval("nativeQA.mapFocus('ROUTE 9')");tap(96);check("ROUTE 9".equals(new JSONObject(eval("nativeQA.mapState()")).optString("route")),"Native A flies to the selected destination");
    eval("nativeQA.mapOpen()");JSONObject p=new JSONObject(eval("nativeQA.mapPoint('ROUTE 12')"));
    float tx=(float)(p.getDouble("x")*activity.web.getWidth()/p.getDouble("w")),ty=(float)(p.getDouble("y")*activity.web.getHeight()/p.getDouble("h"));
    runOnMainSync(()->{long now=SystemClock.uptimeMillis();MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,tx,ty,0),up=MotionEvent.obtain(now,now+80,MotionEvent.ACTION_UP,tx,ty,0);activity.web.dispatchTouchEvent(down);activity.web.dispatchTouchEvent(up);down.recycle();up.recycle();});
    awaitJS("nativeQA.mapState().route==='ROUTE 12'");check(true,"Native touch selects Route 12 at the fitted map position");
    eval("nativeQA.mapOpen()");tap(97);check(!"flyModal".equals(state().optString("root")),"Native B closes Fly");
    eval("nativeQA.mapOpen()");SystemClock.sleep(200);shot("map-native.png");check(state().getJSONArray("errors").length()==0,"Map native input has no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.startsWith("suite-")){
    String suite=mode.substring(6);if(!suite.matches("audit|title|handheld|audio|grid|map|tower|slots|speed|keepsakes|rocket|oak|nova|milestones|expansion|practice|tetris|campaign|brock|controls|pause|ui|backups|features"))throw new Exception("Unknown suite");
    eval("nativeQASuites."+suite+"()");String report="";boolean complete=false;
    for(int i=0;i<(suite.equals("campaign")?1200:(suite.equals("audio")||suite.equals("audit"))?600:120);i++){report=eval("document.getElementById('qaResults').textContent");if(report!=null&&report.contains("passed")&&report.contains("tests")){complete=true;break;}SystemClock.sleep(250);}
    if(!complete)throw new Exception("Suite did not complete: "+report);
    output.putString("suite",suite);output.putString("report",report);output.putString("result",report.contains("FAIL")?"FAIL":"PASS");finish(android.app.Activity.RESULT_OK,output);return;
   }
   eval("nativeQA.setup()");
   if(mode.startsWith("preview-")){
    String preview=mode.substring(8);if(!preview.matches("map|maptown|minimap|scrapbook|nickname|rocket|next|legendary|trial|planner|catch|gary|reward|finale|battle|dex|pc|detail|tutorial|practice|comfort"))throw new Exception("Unknown preview");
    String previewResult=eval("(function(){try{nativeQA.preview('"+preview+"');return {ok:true,state:nativeQA.state()}}catch(e){return {ok:false,error:e.message}}})()");
    JSONObject previewState=new JSONObject(previewResult);output.putString("preview",previewResult);check(previewState.getBoolean("ok"),"Preview setup completes");
    if(!preview.equals("battle")&&!preview.equals("next")&&!preview.equals("minimap")){String expected=(preview.equals("map")||preview.equals("maptown"))?"flyModal":preview.equals("scrapbook")?"badgePanel":preview.equals("nickname")?"nicknameModal":preview.equals("rocket")?"rocketSceneModal":preview.equals("legendary")?"legendaryMenu":preview.equals("planner")?"collectionPlanner":preview.equals("catch")?"legendaryCatch":preview.equals("trial")?"gamePanel":preview.equals("gary")?"gymIntroModal":preview.equals("reward")?"rogueRewardModal":preview.equals("finale")?"championFinale":preview.equals("practice")?"practiceModal":preview.equals("comfort")?"optionsPanel":preview.equals("pc")?"billsPcModal":preview.equals("detail")?"dexDetailModal":preview.equals("dex")?"dexPanel":"oakBattleLesson";check(preview.equals("trial")||expected.equals(state().optString("root")),"Expected preview screen is visible");check("true".equals(eval("(()=>{const r=document.getElementById('"+expected+"').getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.left>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1})()")),"Preview root fits the actual viewport");}
    SystemClock.sleep(600);shot("preview-"+preview+".png");check(state().getJSONArray("errors").length()==0,"Preview has no JavaScript errors");output.putString("result","PASS");output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);return;
   }
   if(mode.equals("files"))fileChecks();
   if(mode.equals("all")){
    // Establish a neutral native device before checking press edges.
    key(96,false,0);int x=state().getInt("x");tap(21);check(state().getInt("x")==x-1,"Android D-pad moves left");tap(22);check(state().getInt("x")==x,"Android D-pad moves right");
    String matrix=state().getJSONArray("matrix").toString();tap(96);check(!state().getJSONArray("matrix").toString().equals(matrix),"Android A rotates clockwise");tap(99);check(state().getJSONArray("matrix").toString().equals(matrix),"Android X rotates counterclockwise");
    tap(103);tap(102);check(state().getJSONArray("matrix").toString().equals(matrix),"Android R1/L1 rotations invert");
    key(20,true,0);check(state().getBoolean("downHeld"),"Android down holds soft drop");key(20,false,0);check(!state().getBoolean("downHeld"),"Android down release stops soft drop");
    key(104,true,0);check(state().getBoolean("holdUsed")&&state().getString("hold").equals("T"),"Android L2 holds the current piece");
    String held=state().getString("hold");key(104,true,1);check(state().getString("hold").equals(held),"Android repeated L2 is ignored");
    tap(97);key(104,true,2);check(!state().getBoolean("holdUsed")&&state().getString("hold").equals(held),"Held native L2 cannot swap across a piece lock");
    key(104,false,0);tap(104);check(state().getBoolean("holdUsed"),"Android L2 works again after release and piece lock");
    key(97,true,0);int score=state().getInt("score");key(97,true,1);key(97,true,2);check(state().getInt("score")==score,"Android repeated hard drop is ignored");key(97,false,0);
    tap(108);check(state().getBoolean("paused"),"Android Start pauses");tap(96);check(!state().getBoolean("paused"),"Android A resumes");
    tap(109);check(state().getString("root").equals("fieldMenuModal"),"Android Select opens Inventory");tap(97);check(state().getBoolean("paused"),"Android B returns safely");tap(96);
    runOnMainSync(()->callActivityOnPause(activity));eval("0");runOnMainSync(()->callActivityOnResume(activity));eval("0");check(state().getBoolean("paused")&&!state().getBoolean("downHeld"),"Activity pause/resume requires explicit resume");
    eval("KantoAndroid.lifecycle(true)");tap(96);check(!state().getBoolean("paused"),"Controller works after lifecycle resume");
    check("true".equals(eval("nativeQA.saved()")),"Android local save succeeds");JSONObject roundtrip=new JSONObject(eval("nativeQA.roundtrip()"));check(roundtrip.getInt("bytes")>0,"Portable backup validates inside Android");
    eval("nativeQA.controllerTest()");tap(105);check(state().getString("root").equals("androidControllerTest"),"Controller test captures R2 without leaving screen");tap(108);check(!state().getString("root").equals("androidControllerTest"),"Controller test exits with Start");
    eval("nativeQA.setup();nativeQA.practiceOpen()");tap(22);check("0".equals(new JSONObject(eval("nativeQA.practiceState()")).getString("boss")),"Native D-pad chooses a rematch");
    tap(20);tap(22);check("1".equals(new JSONObject(eval("nativeQA.practiceState()")).getString("level")),"Native D-pad adjusts Practice speed");
    tap(20);tap(20);tap(96);check(new JSONObject(eval("nativeQA.practiceState()")).getBoolean("active"),"Native A starts Practice from setup");
    tap(104);check(new JSONObject(eval("nativeQA.practiceState()")).getBoolean("hold"),"Native L2 works in Practice");
    eval("nativeQA.practiceFinish()");tap(97);check(!new JSONObject(eval("nativeQA.practiceState()")).getBoolean("active"),"Native B leaves results and restores the campaign");
    eval("nativeQA.expansionGary()");tap(96);check(new JSONObject(eval("nativeQA.expansionState()")).getInt("boss")==13,"Native A enters Gary rival encounter");tap(96);check(!state().getBoolean("paused"),"Native A starts Gary battle");
    tap(108);check(state().getBoolean("paused"),"Native Start pauses Gary battle");
    eval("nativeQA.expansionReward()");tap(22);tap(96);JSONObject rewardState=new JSONObject(eval("nativeQA.expansionState()"));check(rewardState.getInt("choices")==1&&rewardState.getString("kind").equals("pokemon"),"Native D-pad and A choose one Rogue reward");
    eval("nativeQA.plannerOpen()");tap(96);check(new JSONObject(eval("nativeQA.milestoneState()")).getInt("pin")==25,"Native A pins wanted species");tap(97);check(!"collectionPlanner".equals(state().optString("root")),"Native B returns from planner");
    eval("nativeQA.trialOpen()");tap(96);check("controlsConfirm".equals(state().optString("root")),"Native A opens trial confirmation");eval("nativeQA.trialConfirm()");tap(96);check(new JSONObject(eval("nativeQA.milestoneState()")).getBoolean("active")&&!state().getBoolean("paused"),"Native A starts legendary trial");
    tap(108);check(state().getBoolean("paused"),"Native Start pauses legendary trial");eval("nativeQA.trialCatch()");tap(96);check(new JSONObject(eval("nativeQA.milestoneState()")).getBoolean("caught"),"Native A claims deliberate legendary catch");
    eval("nativeQA.setup();nativeQA.comfortFocus()");tap(21);check(new JSONObject(eval("nativeQA.practiceState()")).getInt("music")==95,"Native D-pad adjusts comfort volume");
    eval("nativeQA.comfortToggleFocus()");tap(96);check(new JSONObject(eval("nativeQA.practiceState()")).getBoolean("reduced"),"Native A toggles reduced motion");
   }
   if(mode.equals("all")){
    eval("nativeQA.keepsakeOpen()");tap(96);check("dexDetailModal".equals(state().optString("root")),"Native A previews scrapbook partner");
    eval("nativeQA.keepsakeNameFocus()");tap(96);check("nicknameModal".equals(state().optString("root")),"Native A opens nickname keypad");
    tap(20);tap(96);check("K".equals(new JSONObject(eval("nativeQA.keepsakeState()")).getString("draft")),"Native D-pad moves a keypad row and A types");
    tap(97);check("dexDetailModal".equals(state().optString("root"))&&"".equals(new JSONObject(eval("nativeQA.keepsakeState()")).getString("name")),"Native B cancels nickname without saving");
    eval("nativeQA.keepsakeNameFocus()");tap(96);tap(96);eval("nativeQA.keepsakeSaveFocus()");tap(96);check("A".equals(new JSONObject(eval("nativeQA.keepsakeState()")).getString("name")),"Native A saves nickname");
    tap(97);check("badgePanel".equals(state().optString("root")),"Native B returns to scrapbook");
    eval("nativeQA.rocketOpen()");tap(96);check("rocketSceneModal".equals(state().optString("root")),"Native A opens town Rocket story");
    tap(96);check(new JSONObject(eval("nativeQA.rocketState()")).getInt("page")==1,"Native A advances Rocket dialogue");
    tap(97);check("townModal".equals(state().optString("root")),"Native B returns from Rocket dialogue to town");
    eval("nativeQA.rocketOpen()");tap(96);eval("nativeQA.rocketFocus()");tap(96);check(new JSONObject(eval("nativeQA.rocketState()")).getInt("page")==3,"Native A skips to battle choices");
    tap(20);tap(96);JSONObject rocketState=new JSONObject(eval("nativeQA.rocketState()"));check(rocketState.getInt("boss")==16&&rocketState.getString("plan").equals("bold"),"Native D-pad and A choose bold Rocket approach");
    tap(96);check(!state().getBoolean("paused"),"Native A starts Rocket battle");tap(108);check(state().getBoolean("paused"),"Native Start pauses Rocket battle");
    eval("nativeQA.setup();nativeQA.oakOpen()");tap(96);check("name".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Native A advances Oak dialogue");
    tap(96);check("favorite".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Native A chooses trainer name");
    tap(22);tap(96);check("outing".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Native D-pad and A answer randomized favorite");
    tap(96);tap(20);tap(96);check("exp".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Native controls choose difficulty");
    tap(96);eval("nativeQA.oakFocus('step','tutorial')");tap(96);eval("nativeQA.oakFocus('step','starterTalk')");tap(96);tap(96);
    check("choose".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Native controls reach starter selection");
    eval("nativeQA.frame(30000);KantoAndroid.lifecycle(false);nativeQA.frame(120000);KantoAndroid.lifecycle(true);nativeQA.frame(1);nativeQA.frame(29999)");
    check(!new JSONObject(eval("nativeQA.oakState()")).getBoolean("gift"),"Android lifecycle excludes background Pikachu wait");
    eval("nativeQA.frame(1)");check("shock".equals(new JSONObject(eval("nativeQA.oakState()")).optString("step")),"Android starter event triggers at 60 visible seconds");
    tap(96);eval("nativeQA.oakFocus('starter','25')");tap(96);check(new JSONObject(eval("nativeQA.oakState()")).getBoolean("origin"),"Native A selects special Pikachu");
   }
   if(mode.equals("all")){
    eval("nativeQA.slotsOpen()");tap(96);check("adventureSlotsModal".equals(state().optString("root")),"Native A opens three Adventure profiles");
    check(new JSONObject(eval("nativeQA.slotsState()")).getInt("count")==3,"Native profile screen contains all three slots");
    String firstFocus=state().optString("focus");tap(22);check(!firstFocus.equals(state().optString("focus")),"Native D-pad moves between profile actions");
    eval("nativeQA.slotsFocus('adventureNew2')");tap(96);check(new JSONObject(eval("nativeQA.slotsState()")).getInt("pending")==2&&"oakIntroModal".equals(state().optString("root")),"Native A opens Oak in the empty second slot");
    tap(97);check("adventureSlotsModal".equals(state().optString("root")),"Native B cancels the draft back to save slots");
    eval("nativeQA.slotsFocus('adventureContinue1')");tap(96);check(new JSONObject(eval("nativeQA.slotsState()")).getInt("active")==1&&!"adventureSlotsModal".equals(state().optString("root")),"Native A continues the original Adventure");
   }
   if(mode.equals("all")||mode.equals("tower-native")){
    eval("nativeQA.towerOpen()");tap(96);check("fieldMenuModal".equals(state().optString("root")),"Native A opens Tower preparation Inventory");
    tap(97);check("towerModal".equals(state().optString("root")),"Native B returns to Tower preparation");
    eval("nativeQA.towerFocus('towerPC')");tap(96);check("billsPcModal".equals(state().optString("root")),"Native A opens Tower preparation PC");tap(97);
    eval("nativeQA.towerFocus('towerBegin')");tap(96);check("gymIntroModal".equals(state().optString("root")),"Native A enters Tower battle introduction");tap(96);check(!state().getBoolean("paused"),"Native A starts Tower battle");
    int towerX=state().getInt("x");tap(21);check(state().getInt("x")==towerX-1,"Native D-pad moves during Tower battle");tap(104);check(state().getBoolean("holdUsed"),"Native L2 works during Tower battle");
    tap(108);String towerClock=eval("nativeQA.towerClock()");eval("nativeQA.frame(60000)");check(state().getBoolean("paused")&&towerClock.equals(eval("nativeQA.towerClock()")),"Tower pause freezes combat and hazard clocks");
    runOnMainSync(()->callActivityOnPause(activity));runOnMainSync(()->callActivityOnResume(activity));eval("KantoAndroid.lifecycle(true);nativeQA.frame(1)");check(state().getBoolean("paused"),"Tower requires explicit resume after Android backgrounding");
   }
   eval("nativeQA.setup();nativeQA.hide()");SystemClock.sleep(600);JSONObject layout=new JSONObject(eval("nativeQA.layout()"));
   boolean fits=!layout.getBoolean("cardOverflow");for(int i=0;i<layout.getJSONArray("results").length();i++)fits&=layout.getJSONArray("results").getJSONObject(i).getBoolean("fits");
   check(fits,"All play components fit Android viewport "+layout.getJSONArray("viewport"));output.putString("layout",layout.toString());shot("game-"+mode+".png");
   check(state().getJSONArray("errors").length()==0,"No Android JavaScript errors");output.putString("result","PASS");
  }catch(Throwable error){output.putString("result","FAIL");output.putString("error",error.toString());try{output.putString("state",state().toString());shot("failure.png");}catch(Exception ignored){}}
  output.putString("tests",results.toString());finish(android.app.Activity.RESULT_OK,output);
 }
}
