"""Build offline, sample-looped assets from the owner's supplied album recordings."""
import sys,json,hashlib,base64,io,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'inspection/audio-tools'))
import numpy as np
import soundfile as sf
from scipy import signal
manifest=json.loads((ROOT/'src/assets/soundtrack.json').read_text(encoding='utf-8'))
analysis={r['number']:r for r in json.loads((ROOT/'inspection/music-loop-analysis.json').read_text())}
extra=json.loads((ROOT/'inspection/polish-downloads.json').read_text())
originals=manifest.get('originals',manifest['tracks'])
originals=[r for r in originals if r['number'] not in [29,31,54]]
for t in extra:
    number=int(t['url'].split('/1-')[1][:2]);file=f'music/frlg-{number:02}.mp3';data=(ROOT/'src/assets'/file).read_bytes()
    originals.append(dict(id=f'frlg-{number}',number=number,name=t['name'],file=file,source=t['url'],download=t['download'],bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
tracks=[];fanfares=[];evidence=[]
out=ROOT/'src/assets/music-loop';out.mkdir(exist_ok=True)
def emit(number,name,pcm,sr,start=None,source=None):
    # 32 kHz stereo retains this GBA recording's range, caps decoded memory.
    rate=32000;g=math.gcd(sr,rate);pcm=signal.resample_poly(pcm,rate//g,sr//g,axis=0)
    start=round(start*rate/sr) if start is not None else None
    if start is not None:
        # Move both endpoints equally onto a low-slope sample; preserve tempo.
        first=start-round(rate*.05)
        slopes=np.max(np.abs(pcm[first:start]-pcm[first-1:start-1]),axis=1)
        shift=int(np.argmin(slopes))-len(slopes);start+=shift;pcm=pcm[:len(pcm)+shift]
        # Match the preceding phase at the wrap, without shortening musical time.
        n=min(round(rate*.025),start);w=np.linspace(0,1,n,dtype=np.float32)[:,None]
        pcm[-n:]=pcm[-n:]*(1-w)+pcm[start-n:start]*w
    blob=io.BytesIO()
    # Bound encoder calls: libsndfile's Windows Vorbis backend uses stack space
    # proportional to the input block, so a whole-song write can overflow it.
    with sf.SoundFile(blob,mode='w',samplerate=rate,channels=2,format='OGG',subtype='VORBIS',compression_level=.55) as audio:
        for offset in range(0,len(pcm),8192):audio.write(pcm[offset:offset+8192])
    data=blob.getvalue();decoded,dsr=sf.read(io.BytesIO(data),dtype='float32',always_2d=True)
    file=f'music/frlg-{number:02}.js';payload=f'window.KantoMusicAsset({number},"{base64.b64encode(data).decode()}");\n'.encode()
    (out/Path(file).name).write_bytes(payload)
    item=dict(id=f'frlg-{number}',number=number,name=name,file=file,bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest(),seconds=len(decoded)/rate,loop=start is not None,loopStart=(start or 0)/rate,loopEnd=len(decoded)/rate)
    if source:item['sourceNumber']=source
    if start is not None:
        rawJump=float(np.max(np.abs(decoded[-1]-decoded[start])))
        # Mirror the runtime's post-decode join repair, eliminating codec-edge
        # padding differences after Vorbis decoding / device-rate resampling.
        n=round(rate*.02);w=np.linspace(0,1,n,dtype=np.float32)[:,None]
        decoded[-n:]=decoded[-n:]*(1-w)+decoded[start-n+1:start+1]*w
        jump=float(np.max(np.abs(decoded[-1]-decoded[start])))
        tailRMS=float(np.sqrt(np.mean(decoded[-rate//4:]**2)));bodyRMS=float(np.sqrt(np.mean(decoded[start:]**2)))
        assert jump<.12 and tailRMS>bodyRMS*.15,(number,jump,tailRMS,bodyRMS)
        evidence.append(dict(number=number,loopStart=item['loopStart'],loopEnd=item['loopEnd'],rawCodecJump=rawJump,boundaryJump=jump,tailRMS=tailRMS,bodyRMS=bodyRMS,analysis=analysis[number]))
    print(number,name,round(item['seconds'],2),'loop' if start else 'one-shot',flush=True)
    return item
for t in sorted(originals,key=lambda t:t['number']):
    n=t['number'];data=(ROOT/'src/assets'/t['file']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==t['sha256']
    pcm,sr=sf.read(io.BytesIO(data),dtype='float32',always_2d=True)
    if n in [29,31,54]:
        # Remove only leading/trailing silence, retaining the complete fanfare.
        active=np.where(np.max(np.abs(pcm),axis=1)>.001)[0]
        pcm=pcm[max(0,active[0]-round(sr*.015)):min(len(pcm),active[-1]+round(sr*.12))]
        fanfares.append(emit(n,t['name'],pcm,sr))
    elif n==73:
        # Credits are a through-composed medley; play the complete ending once.
        tracks.append(emit(n,t['name'],pcm,sr))
    else:
        a=analysis[n];start=a['loopStartFrame'];end=a['loopEndFrame']
        tracks.append(emit(n,t['name'],pcm[:end].copy(),sr,start))
    if n==28:
        # Victory's opening flourish is a short cue; the full theme remains selectable.
        cue=pcm[:round(sr*3.5)].copy();fade=round(sr*.18);cue[-fade:]*=np.linspace(1,0,fade)[:,None]
        fanfares.append(emit(90,'Battle victory',cue,sr,source=28))
manifest.update(tracks=tracks,fanfares=fanfares,originals=originals,processing='32 kHz stereo Vorbis; measured phrase loops, 25 ms phase join; credits play once. Original MP3 sources are retained in the editable project.')
(ROOT/'src/assets/soundtrack.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'inspection/music-loop-verification.json').write_text(json.dumps(evidence,indent=2)+'\n')
