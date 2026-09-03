import { join } from 'node:path';
import { readFileSync, existsSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { supportDir } from '../broker/paths.js';
import { loadCatalog, EMPTY_CATALOG, rankCatalog, catalogFromEnvironment, fetchRemoteCatalog, validateCatalog, type LocalFeedback, type YouTubeShortsCatalog } from './catalog.js';
import type { FeedStatus, FeedVideo } from './types.js';
export class CatalogProvider {
  private readonly envCatalog = process.env.NODE_ENV !== 'production' ? catalogFromEnvironment(process.env.FOCUSREELS_YOUTUBE_TEST_IDS) : null;
  private readonly fileCatalog = process.env.NODE_ENV !== 'production' && process.env.FOCUSREELS_YOUTUBE_TEST_CATALOG_PATH ? (()=>{const p=process.env.FOCUSREELS_YOUTUBE_TEST_CATALOG_PATH!;if(!p.startsWith('/')||p.includes('..'))throw new Error('FOCUSREELS_YOUTUBE_TEST_CATALOG_PATH must be an explicit absolute path');if(process.env.FOCUSREELS_YOUTUBE_TEST_IDS)throw new Error('Set either FOCUSREELS_YOUTUBE_TEST_IDS or FOCUSREELS_YOUTUBE_TEST_CATALOG_PATH, not both');let value:any;try{value=JSON.parse(readFileSync(p,'utf8'))}catch{throw new Error(`Cannot read development catalog: ${p}`)}const valid=validateCatalog(value);if(!valid)throw new Error(`Invalid development catalog: ${p}`);return valid})() : null;
  private readonly bundledFallback: YouTubeShortsCatalog = (()=>{try{return validateCatalog(JSON.parse(readFileSync(join(__dirname,'../config/youtube-catalog.fixture.json'),'utf8'))) ?? EMPTY_CATALOG;}catch{return EMPTY_CATALOG;}})();
  private readonly cacheFile = join(supportDir(),'youtube-catalog.json');
  private source: 'environment'|'development-file'|'cache'|'remote'|'fixture' = this.envCatalog ? 'environment' : this.fileCatalog ? 'development-file' : existsSync(this.cacheFile) ? 'cache' : 'fixture';
  private catalog: YouTubeShortsCatalog = this.envCatalog ?? this.fileCatalog ?? loadCatalog({ fallback: this.bundledFallback, cacheFile: this.cacheFile });
  private readonly seen=new Set<string>(); private readonly broken=new Set<string>(); private history:FeedVideo[]=[]; private cursor=-1; private feedback:LocalFeedback[]=[]; private ordered:FeedVideo[]|null=null;
  private invalidate(){this.ordered=null}
  constructor(){try{mkdirSync(supportDir(),{recursive:true});const p=join(supportDir(),'youtube-feedback.json');if(existsSync(p))this.feedback=JSON.parse(readFileSync(p,'utf8'));}catch{/* corrupt feedback ignored */}}
  async refreshRemote(url?:string){ if(this.envCatalog||!url)return false; const etagPath=join(supportDir(),'youtube-catalog.etag'); let etag:string|undefined; try{etag=readFileSync(etagPath,'utf8').trim()||undefined}catch{} const result=await fetchRemoteCatalog(url,4000,etag); if(result.notModified)return true; const next=result.catalog; if(!next)return false; this.catalog=next; this.source='remote'; this.invalidate(); try{const p=join(supportDir(),'youtube-catalog.json');const t=p+'.tmp';writeFileSync(t,JSON.stringify(next));renameSync(t,p);if(result.etag)writeFileSync(etagPath,result.etag)}catch{} return true; }
  // rankCatalog draws a fresh random tiebreak on every call, but peek() stages the
  // next clip in the hidden player and next() has to return that same clip for the
  // swap to work. So the order is materialised once and only redrawn when an input
  // to it changes.
  private items():FeedVideo[]{
    if(this.ordered)return this.ordered;
    const ranked = process.env.NODE_ENV !== 'production' && process.env.FOCUSREELS_E2E && this.envCatalog
      ? this.catalog.videos.filter(v => v.enabled && !this.seen.has(v.videoId) && !this.broken.has(v.videoId) && !this.feedback.find(f => f.videoId === v.videoId)?.hidden)
      : (()=>{
          // An ambient feed must never run dry: once every clip has been shown,
          // start a new lap rather than handing the player a null. Watched clips
          // carry an impressions penalty, so the second lap is not the first one
          // replayed in order.
          let list=rankCatalog(this.catalog.videos,this.feedback,this.seen);
          if(!list.length&&this.catalog.videos.length){this.seen.clear();list=rankCatalog(this.catalog.videos,this.feedback,this.seen)}
          return list;
        })();
    this.ordered = ranked.map(v=>({id:v.videoId,title:'',channelId:'',channelTitle:'',thumbnailUrl:'',durationSeconds:0,source:'search',category:v.category}));
    return this.ordered;
  }
  async next(){if(this.cursor<this.history.length-1){this.cursor++;return this.history[this.cursor]??null;}const v=this.items()[0]??null;if(v){this.seen.add(v.id);this.invalidate();this.history.push(v);this.cursor=this.history.length-1;}return v;}
  previous(){if(this.cursor<=0)return null;this.cursor--;return this.history[this.cursor]??null;}
  peek(){return this.items()[0]??null;}
  refresh(){this.seen.clear();this.broken.clear();this.invalidate();this.history=[];this.cursor=-1;return this.status;}
  markBroken(videoId:string, error:string){ this.broken.add(videoId); this.invalidate(); if (process.env.FOCUSREELS_DEBUG_FEED) console.log('[feed] unavailable', { videoId, error }); }
  get status():FeedStatus{return{demoMode:false,reason:this.catalog.videos.length?'':'Add test YouTube Shorts IDs to run the catalog demo.',queued:this.items().length,provider:this.catalog.videos.length?'youtube-catalog':'empty',catalogSource:this.catalog.videos.length?this.source:null,totalVideos:this.catalog.videos.length,playableVideos:this.items().length};}
  setFeedback(f:LocalFeedback){const old=this.feedback.find(x=>x.videoId===f.videoId);const merged={...old,...f,impressions:(old?.impressions??0)+(f.impressions??0),completedViews:(old?.completedViews??0)+(f.completedViews??0),quickSkips:(old?.quickSkips??0)+(f.quickSkips??0)};this.feedback=[...this.feedback.filter(x=>x.videoId!==f.videoId),merged];this.invalidate();try{const p=join(supportDir(),'youtube-feedback.json');const tmp=p+'.tmp';writeFileSync(tmp,JSON.stringify(this.feedback));renameSync(tmp,p);}catch{/* best effort */}}
}
