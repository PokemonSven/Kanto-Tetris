package com.kantotetris.game;

import java.util.Arrays;

/** Android key codes -> W3C standard gamepad order. Kept free of Android runtime calls for JVM tests. */
public final class ControllerState {
    public final boolean[] keys = new boolean[17];
    private final boolean[] blockedKeys = new boolean[17];
    public final float[] axes = new float[6]; // left X/Y, right X/Y, hat X/Y
    public final float[] triggers = new float[2];
    private final boolean[] blockedAxes = new boolean[8];
    public static int buttonForKey(int key) {
        switch(key) {
            case 96: return 0; case 97: return 1; case 99: return 2; case 100: return 3;
            case 102: return 4; case 103: return 5; case 104: return 6; case 105: return 7;
            case 109: return 8; case 108: return 9; case 106: return 10; case 107: return 11;
            case 19: return 12; case 20: return 13; case 21: return 14; case 22: return 15;
            case 23: return 0; case 110: return 16; default: return -1;
        }
    }
    public boolean key(int code, boolean down, int repeat) {
        int b=buttonForKey(code);if(b<0)return false;
        if(!down){keys[b]=false;blockedKeys[b]=false;return true;}
        if(repeat==0&&!blockedKeys[b])keys[b]=true;
        return true;
    }
    public void axis(int index,float value,float deadZone) {
        value=Float.isFinite(value)?Math.max(-1,Math.min(1,value)):0;
        if(Math.abs(value)<=Math.max(.15f,deadZone))value=0;
        if(blockedAxes[index]){if(value==0)blockedAxes[index]=false;else value=0;}
        if(index<6)axes[index]=value;else triggers[index-6]=Math.max(0,value);
    }
    public float button(int i) {
        float key=keys[i]?1:0;
        if(i==6||i==7)return Math.max(key,triggers[i-6]);
        if(i==12)return Math.max(key,axes[5]<-.45?1:0);
        if(i==13)return Math.max(key,axes[5]>.45?1:0);
        if(i==14)return Math.max(key,axes[4]<-.45?1:0);
        if(i==15)return Math.max(key,axes[4]>.45?1:0);
        return key;
    }
    public void suspend() {
        for(int i=0;i<keys.length;i++){blockedKeys[i]|=keys[i];keys[i]=false;}
        // Require a neutral sample after focus loss, including controls held outside this Activity.
        Arrays.fill(blockedAxes,true);Arrays.fill(axes,0);Arrays.fill(triggers,0);
    }
}
