"""Find repeated passages in the supplied recordings; write reviewable evidence."""
import sys, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'inspection/audio-tools'))
import numpy as np
import soundfile as sf
from scipy import signal

def analyze(file):
    short=int(file.stem.split('-')[1]) in [28,53,68]
    pcm,sr=sf.read(file,dtype='float32',always_2d=True)
    mono=signal.resample_poly(pcm.mean(axis=1),1,4)
    rate=sr/4
    # Harmonic/transient fingerprints tolerate MP3/reverb and oscillator drift.
    hop=256
    _,times,z=signal.stft(mono,rate,nperseg=1024,noverlap=1024-hop,boundary=None)
    spec=np.abs(z)
    groups=np.unique(np.geomspace(2,480,33).astype(int))
    features=np.array([np.log1p(1000*spec[a:b].mean(axis=0)) for a,b in zip(groups[:-1],groups[1:])])
    features-=features.mean(axis=1,keepdims=True)
    features/=features.std(axis=1,keepdims=True)+.1
    # Compare long passages, not just repeated percussion or single bars.
    duration=len(pcm)/sr; first=int(3*rate/hop); end=int((duration-7)*rate/hop)
    lags=np.arange(int(7*rate/hop),int(min(duration-15,160)*rate/hop))
    scores=[];starts=[]
    for lag in lags:
        count=min(end-lag-first,int((3 if short else min(duration*.25,24))*rate/hop))
        if count<int((2 if short else 5)*rate/hop):scores.append(-1);starts.append(first);continue
        a=features[:,:end-lag];b=features[:,lag:end]
        def window(v):
            c=np.r_[0,np.cumsum(v)];return c[count:]-c[:-count]
        c=window(np.sum(a*b,axis=0))/np.sqrt(window(np.sum(a*a,axis=0))*window(np.sum(b*b,axis=0))+1e-9)
        limit=min(len(c),int(min(duration*.4,45)*rate/hop))
        where=first+int(np.argmax(c[first:limit]));scores.append(float(c[where]));starts.append(where)
    scores=np.array(scores);peaks,_=signal.find_peaks(scores,distance=int(1*rate/hop))
    best=sorted(peaks,key=lambda i:scores[i],reverse=True)[:5]
    candidates=[{'seconds':round(float(lags[i]*hop/rate),5),'score':round(float(scores[i]),4),'start':round(float(starts[i]*hop/rate),4)} for i in best]
    period=candidates[0]['seconds'] if candidates else duration/2
    # Refine period at full sample precision using several seconds of PCM.
    anchor=int((candidates[0]['start'] if candidates else 4)*sr);span=int(min(6,period*.55)*sr);coarse=int(period*sr);radius=int(.08*sr)
    a=pcm[anchor:anchor+span].mean(axis=1)
    begin=anchor+coarse-radius;b=pcm[begin:anchor+coarse+span+radius].mean(axis=1)
    corr=signal.correlate(b,a,mode='valid',method='fft')
    sums=signal.convolve(b*b,np.ones(len(a),dtype=np.float32),mode='valid',method='fft')
    corr/=np.sqrt(np.maximum(1e-9,sums*np.sum(a*a)))
    offset=int(np.argmax(corr));lag=coarse-radius+offset
    start=anchor;stop=start+lag
    rms=lambda x:float(np.sqrt(np.mean(x*x)))
    return {'number':int(file.stem.split('-')[1]),'sampleRate':sr,'duration':duration,'candidates':candidates,'periodFrames':lag,'waveCorrelation':round(float(corr[offset]),4),'loopStartFrame':start,'loopEndFrame':stop,'startRMS':rms(pcm[start:start+sr]),'endRMS':rms(pcm[stop-sr:stop])}

rows=[]
for file in sorted((ROOT/'src/assets/music').glob('frlg-*.mp3')):
    if int(file.stem.split('-')[1]) in [29,31,54]:continue
    row=analyze(file);rows.append(row)
    print(row['number'],round(row['periodFrames']/row['sampleRate'],3),row['candidates'][:2],flush=True)
(ROOT/'inspection/music-loop-analysis.json').write_text(json.dumps(rows,indent=2))
