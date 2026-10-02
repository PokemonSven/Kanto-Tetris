package com.kantotetris.game;
public final class ControllerStateTest {
 static int passed;
 static void check(boolean ok,String name){if(!ok)throw new AssertionError(name);passed++;System.out.println("PASS "+name);}
 public static void main(String[] args){
  int[][] mapping={{96,0},{97,1},{99,2},{100,3},{102,4},{103,5},{104,6},{105,7},{109,8},{108,9},{106,10},{107,11},{19,12},{20,13},{21,14},{22,15},{110,16},{23,0}};
  for(int[] m:mapping){ControllerState p=new ControllerState();check(p.key(m[0],true,0)&&p.button(m[1])==1,"key "+m[0]+" down");p.key(m[0],false,0);check(p.button(m[1])==0,"key "+m[0]+" release");}
  ControllerState p=new ControllerState();check(!p.key(24,true,0),"volume not intercepted");
  p.key(97,true,1);check(p.button(1)==0,"repeat cannot create new hard drop");
  p.key(97,true,0);p.suspend();p.key(97,true,1);check(p.button(1)==0,"pause blocks held button repeats");
  p.key(97,true,0);check(p.button(1)==0,"pause requires release");p.key(97,false,0);p.key(97,true,0);check(p.button(1)==1,"release rearms button");
  p.axis(0,.8f,.15f);check(p.axes[0]==0,"resume requires neutral stick");p.axis(0,0,.15f);p.axis(0,.8f,.15f);check(p.axes[0]==.8f,"neutral stick rearms");p.axis(0,.1f,.15f);check(p.axes[0]==0,"stick drift filtered");
  p.axis(4,0,0);p.axis(4,-1,0);check(p.button(14)==1&&p.button(15)==0,"hat left");p.key(21,true,0);p.axis(4,0,0);check(p.button(14)==1,"hat release preserves digital D-pad");p.key(21,false,0);check(p.button(14)==0,"both D-pad sources released");
  p.axis(5,0,0);p.axis(5,1,0);check(p.button(13)==1,"hat down");p.axis(5,0,0);check(p.button(13)==0,"hat neutral");
  p.axis(7,0,0);p.axis(7,.75f,0);p.key(105,true,0);p.key(105,false,0);check(p.button(7)==.75f,"analog trigger survives digital release");p.axis(7,0,0);check(p.button(7)==0,"analog trigger release");
  p.axis(0,Float.NaN,0);check(p.axes[0]==0,"invalid axis sanitized");p.axis(1,0,0);p.axis(1,9,0);check(p.axes[1]==1,"axis bounded");
  System.out.println("TOTAL "+passed+" PASS");
 }
}
