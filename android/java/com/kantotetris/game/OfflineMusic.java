package com.kantotetris.game;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/** Only exact packaged music assets are reachable through the trusted origin. */
final class OfflineMusic {
 static WebResourceResponse serve(AssetManager assets,String path,String range){
  if(path.matches("/music/frlg-[0-9]{2}\\.js")){
   try{return new WebResourceResponse("application/javascript","UTF-8",assets.open(path.substring(1)));}
   catch(IOException missing){return empty(404,"Not Found",null);}
  }
  if(!path.matches("/music/frlg-[0-9]{2}\\.mp3"))return empty(403,"Forbidden",null);
  try{
   AssetFileDescriptor file=assets.openFd(path.substring(1));long size=file.getLength(),start=0,end=size-1;
   Map<String,String> headers=new LinkedHashMap<>();headers.put("Accept-Ranges","bytes");headers.put("Cache-Control","private, max-age=31536000");
   if(range!=null){
    try{
     if(!range.matches("bytes=[0-9]*-[0-9]*"))throw new IllegalArgumentException();
     String[] parts=range.substring(6).split("-",-1);
     if(parts[0].isEmpty()){long suffix=Long.parseLong(parts[1]);if(suffix<=0)throw new IllegalArgumentException();start=Math.max(0,size-suffix);}
     else{start=Long.parseLong(parts[0]);if(!parts[1].isEmpty())end=Math.min(end,Long.parseLong(parts[1]));}
     if(start>=size||start>end)throw new IllegalArgumentException();
    }catch(Exception invalid){file.close();headers.put("Content-Range","bytes */"+size);return empty(416,"Range Not Satisfiable",headers);}
    headers.put("Content-Range","bytes "+start+"-"+end+"/"+size);
   }
   // Android's Chromium stream loader skips the requested start offset itself,
   // but reads until EOF. Bound only the END here or WebView 83 seeks twice.
   // It also emits Content-Length, so adding that header would duplicate it.
   final long limit=end+1;InputStream input=file.createInputStream();
   InputStream bounded=new FilterInputStream(input){
    long left=limit;
    @Override public int available()throws IOException{return (int)Math.min(Integer.MAX_VALUE,left);}
    @Override public int read()throws IOException{if(left<=0)return -1;int b=in.read();if(b>=0)left--;return b;}
    @Override public int read(byte[] b,int off,int len)throws IOException{if(len==0)return 0;if(left<=0)return -1;int n=in.read(b,off,(int)Math.min(left,len));if(n>0)left-=n;return n;}
    @Override public long skip(long n)throws IOException{long skipped=in.skip(Math.min(left,n));left-=skipped;return skipped;}
   };
   return new WebResourceResponse("audio/mpeg",null,range==null?200:206,range==null?"OK":"Partial Content",headers,bounded);
  }catch(IOException missing){return empty(404,"Not Found",null);}
 }
 private static WebResourceResponse empty(int status,String reason,Map<String,String> headers){return new WebResourceResponse("text/plain","UTF-8",status,reason,headers,new ByteArrayInputStream(new byte[0]));}
}
