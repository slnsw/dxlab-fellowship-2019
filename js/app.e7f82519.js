(function(e){function t(t){for(var n,s,r=t[0],c=t[1],l=t[2],d=0,u=[];d<r.length;d++)s=r[d],Object.prototype.hasOwnProperty.call(i,s)&&i[s]&&u.push(i[s][0]),i[s]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);m&&m(t);while(u.length)u.shift()();return o.push.apply(o,l||[]),a()}function a(){for(var e,t=0;t<o.length;t++){for(var a=o[t],n=!0,s=1;s<a.length;s++){var r=a[s];0!==i[r]&&(n=!1)}n&&(o.splice(t--,1),e=c(c.s=a[0]))}return e}var n={},s={app:0},i={app:0},o=[];function r(e){return c.p+"js/"+({"home~three":"home~three",home:"home",three:"three"}[e]||e)+"."+{"home~three":"6be964a6",home:"8f41a996",three:"067cc423"}[e]+".js"}function c(t){if(n[t])return n[t].exports;var a=n[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,c),a.l=!0,a.exports}c.e=function(e){var t=[],a={home:1,three:1};s[e]?t.push(s[e]):0!==s[e]&&a[e]&&t.push(s[e]=new Promise((function(t,a){for(var n="css/"+({"home~three":"home~three",home:"home",three:"three"}[e]||e)+"."+{"home~three":"31d6cfe0",home:"95e1f90c",three:"0fcbde84"}[e]+".css",i=c.p+n,o=document.getElementsByTagName("link"),r=0;r<o.length;r++){var l=o[r],d=l.getAttribute("data-href")||l.getAttribute("href");if("stylesheet"===l.rel&&(d===n||d===i))return t()}var u=document.getElementsByTagName("style");for(r=0;r<u.length;r++){l=u[r],d=l.getAttribute("data-href");if(d===n||d===i)return t()}var m=document.createElement("link");m.rel="stylesheet",m.type="text/css",m.onload=t,m.onerror=function(t){var n=t&&t.target&&t.target.src||i,o=new Error("Loading CSS chunk "+e+" failed.\n("+n+")");o.code="CSS_CHUNK_LOAD_FAILED",o.request=n,delete s[e],m.parentNode.removeChild(m),a(o)},m.href=i;var h=document.getElementsByTagName("head")[0];h.appendChild(m)})).then((function(){s[e]=0})));var n=i[e];if(0!==n)if(n)t.push(n[2]);else{var o=new Promise((function(t,a){n=i[e]=[t,a]}));t.push(n[2]=o);var l,d=document.createElement("script");d.charset="utf-8",d.timeout=120,c.nc&&d.setAttribute("nonce",c.nc),d.src=r(e);var u=new Error;l=function(t){d.onerror=d.onload=null,clearTimeout(m);var a=i[e];if(0!==a){if(a){var n=t&&("load"===t.type?"missing":t.type),s=t&&t.target&&t.target.src;u.message="Loading chunk "+e+" failed.\n("+n+": "+s+")",u.name="ChunkLoadError",u.type=n,u.request=s,a[1](u)}i[e]=void 0}};var m=setTimeout((function(){l({type:"timeout",target:d})}),12e4);d.onerror=d.onload=l,document.head.appendChild(d)}return Promise.all(t)},c.m=e,c.c=n,c.d=function(e,t,a){c.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},c.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},c.t=function(e,t){if(1&t&&(e=c(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(c.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)c.d(a,n,function(t){return e[t]}.bind(null,n));return a},c.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return c.d(t,"a",t),t},c.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},c.p="/dxlab-fellowship-2019/",c.oe=function(e){throw console.error(e),e};var l=window["webpackJsonp"]=window["webpackJsonp"]||[],d=l.push.bind(l);l.push=t,l=l.slice();for(var u=0;u<l.length;u++)t(l[u]);var m=d;o.push([0,"chunk-vendors"]),a()})({0:function(e,t,a){e.exports=a("cd49")},"5c0b":function(e,t,a){"use strict";var n=a("9c0c"),s=a.n(n);s.a},"9c0c":function(e,t,a){},cd49:function(e,t,a){"use strict";a.r(t);var n=a("2b0e"),s=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{attrs:{id:"app"}},[a("router-view"),a("div",{attrs:{id:"dialog-root"}})],1)},i=[],o=(a("5c0b"),a("2877")),r={},c=Object(o["a"])(r,s,i,!1,null,null,null),l=c.exports,d=a("8c4f");n["default"].use(d["a"]);const u=[{path:"/gen/ids",name:"Ids",meta:{title:"Generate ID Lists"},component:()=>Promise.all([a.e("home~three"),a.e("home")]).then(a.bind(null,"d4eb"))},{path:"/test",name:"Test",meta:{title:"Test"},component:()=>Promise.all([a.e("home~three"),a.e("home")]).then(a.bind(null,"78c1"))},{path:"/",name:"Viewer",meta:{title:"Bird’s Eye",metaTags:[{name:"description",content:"Bird’s Eye."},{property:"viewport",content:"width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0"}]},component:()=>Promise.all([a.e("home~three"),a.e("three")]).then(a.bind(null,"e1b1"))}],m=new d["a"]({mode:"history",base:"/dxlab-fellowship-2019/",routes:u});m.beforeEach((e,t,a)=>{const n=e.matched.slice().reverse().find(e=>e.meta&&e.meta.title),s=e.matched.slice().reverse().find(e=>e.meta&&e.meta.metaTags);if(n&&(document.title=n.meta.title),Array.from(document.querySelectorAll("[data-vue-router-controlled]")).map(e=>e.parentNode?e.parentNode.removeChild(e):null),!s)return a();s.meta.metaTags.map(e=>{const t=document.createElement("meta");return Object.keys(e).forEach(a=>{t.setAttribute(a,e[a])}),t.setAttribute("data-vue-router-controlled",""),t}).forEach(e=>document.head.appendChild(e)),a()});var h=m,p=a("9ab4"),f=a("2f62"),g=a("955d"),b=a.n(g),y=a("4d7c"),v=a.n(y),w=a("5a89");function O(){const e=w["d"];e.enabled=!0;const t=new w["F"],a=new w["h"];function n(n,s,i,o){const r=e.get(n);function c(){t.load(n,s,()=>{},o)}function l(t){const a=URL.createObjectURL(t),s=document.createElementNS("http://www.w3.org/1999/xhtml","img");s.onload=()=>{e.add(n,s),URL.revokeObjectURL(a),document.body.removeChild(s),c()},s.src=a,s.style.visibility="hidden",document.body.appendChild(s)}if(r)return r;a.load(n,l,i,o)}return a.setResponseType("blob"),Object.assign({},t,{load:n})}var A=O;const _={archTechDrawings:{id:"m6zK940qx9v7K",name:"architectural drawings",description:"Drawings made for the design and construction of sites, structures, details, fixtures, furnishings, and decorations, as well as other objects designed by an architect or architectural office."},coin:{id:"76pM49Z2jxBzR",name:"coins",description:"Flat discs with an official stamp used as money."},drawings:{id:"GP85pXKPWzzB",name:"drawings",description:""},ephemera:{id:"vz2D0Am8wvrlb",name:"ephemera",description:"Materials, usually printed documents, created for a specific, limited purpose, and generally designed to be discarded after use."},journals:{id:"Z5AB0OkPYjPb9",name:"journals",description:"A personal account of events in an individual’s life or an impartial record of an organization’s events, proceedings, and actions."},manuscripts:{id:"330MWgKgY5adZ",name:"manuscripts",description:"Unpublished documents and records accumulated by agencies and people, usually handwritten however can be transcript, includes documents, books, letters etc."},manuscriptMaps:{id:"Xp1qba0O2k32v",name:"unpublished maps",description:"Hand drawn maps or the original drawing of a map as compiled or constructed from various data, such as ground surveys and photographs."},manuscriptNotatedMusic:{id:"oWWJDK5PO44me",name:"notated music",description:"Graphic representations of musical works such as musical scores. Often the means for communicating to the performer(s) how the musical work is to be realized in sound."},maps:{id:"40XObXd7aA4a",name:"published maps",description:"Published graphic representations of areas of land or sea or another celestial sphere indicating the relative position of artificial and natural features according to a scale."},medals:{id:"X8gBJlg9E1WqK",name:"medals",description:"Pieces of stamped metal awarded for excellence or achievement or issued to commemorate a person or event, often military decorations for conduct during conflict."},negatives:{id:"wKK2B5BO3aEYa",name:"negatives",description:"Photographic images, usually on transparent film or glass, with reversed tones.",esQuery:{type:"should",matchType:"match_phrase_prefix",field:"item_id_callnumber_key",values:["SLIDES","ON"]}},objects:{id:"7MZAw5gxmyyaW",name:"objects",description:"Three dimensional material things that can be seen and touched, includes games, coins, weapons, hair, lockets and other artefacts."},paintings:{id:"0GB866Xe6mz1q",name:"paintings",description:"Pictures formed primarily by the direct application of pigment suspended in a medium, arranged in masses of colour onto a generally two-dimensional surface. The paintings in the Library’s collection are primarily documentary in nature."},photographs:{id:"wKK2B5BO3aEYa",name:"photographs",description:"Pictures made using a camera, in which an image is focused on to light-sensitive material and then made visible and permanent by chemical treatment, or stored digitally.",esQuery:{type:"must_not",matchType:"match_phrase_prefix",field:"item_id_callnumber_key",values:["SLIDES","ON"]}},pictures:{id:"J19GWyDjZ8Ny7",name:"pictures",description:"An image on a surface, may be formed using a variety of techniques, including drawing, painting, printing, photography."},posters:{id:"b10aqZK7gRzJy",name:"posters",description:"Pictorial notices made for posting in a public place to attract attention to events, activities, causes, goods, or services or to be purely decorative."},prints:{id:"vpkdDA18BDOdR",name:"prints",description:"Pictures formed by transfer of a medium from one surface to another, usually ink."},stamps:{id:"BRg6jXK4mz4wG",name:"stamps",description:"Government-authorized hand stamps, adhesive stamps, or meter markings intended as evidence of payment of postage. Also, stamps issued by private mail delivery companies to denote payment of their delivery fees."},video:{id:"NWOD2N4edDPzO",name:"video",description:"Audiovisual materials which are motion pictures, film, movies. Can be on a film, disc or digital physical carrier."}};var j=_;const k=a("bc3a").default;n["default"].use(f["a"]);const P=2e4,x="4GiyqFNOt7ZdMZCubAdC5WVq9zGeaT8P",E="/dxlab-fellowship-2019/",B="https://apiv2.sl.nsw.gov.au/collection/v1/",F="https://dxlab-fellowship-2019.s3.amazonaws.com/",S=k.create({headers:{"x-api-key":x},timeout:6e5}),L=()=>{let e=b()();return Object.entries(j).forEach(([t,a])=>{e=e.orFilter("term","medals"!==t&&"stamps"!==t&&"coin"!==t?"format_id.keyword":"subject_curated_title","medals"!==t&&"stamps"!==t&&"coin"!==t?a.id:t)}),e},D=(e,t)=>Object(p["a"])(void 0,void 0,void 0,(function*(){for(let a=0;a<e.length;a++)yield t(e[a],a,e)})),I=({query:e,esQuery:t})=>e.filter("bool",e=>(t.values.forEach(a=>{e="must_not"===t.type?e.notFilter(t.matchType,t.field,a):e.orFilter(t.matchType,t.field,a)}),e)),T=({key:e,id:t,query:a})=>{const n="medals"!==e&&"stamps"!==e&&"coin"!==e?"format_id.keyword":"subject_curated_title",s="medals"!==e&&"stamps"!==e&&"coin"!==e?t:e;return a.filter("term",n,s)},N=e=>new Promise((t,a)=>{const n=new Image;n.addEventListener("load",()=>t(n)),n.addEventListener("error",a),n.src=e}),C=e=>Object(p["a"])(void 0,void 0,void 0,(function*(){const t=E+"pixels/"+e.key+".png",a=yield N(t),n=document.createElement("canvas");return n.width=a.width,n.height=a.height,n.getContext("2d").drawImage(a,0,0,a.width,a.height),{pixels:n,width:a.width}})),q=e=>{const t=e.width,a=e.height,n=t*a,s=e.getContext("2d").getImageData(0,0,t,a),i=new Float32Array(t*a*3),o=new Float32Array(t*a*3),r=new Float32Array(t*a*3),c=new w["e"];for(let l=0,d=0,u=n;l<u;l++,d+=4){c.setRGB(s.data[d]/255,s.data[d+1]/255,s.data[d+2]/255);const e={h:0,s:0,l:0};c.getHSL(e);const a=l%t,n=Math.floor(l/t),u=0;i[3*l]=a,i[3*l+1]=n,i[3*l+2]=u,o[3*l]=c.r,o[3*l+1]=c.g,o[3*l+2]=c.b,r[3*l]=e.h,r[3*l+1]=e.s,r[3*l+2]=e.l}return{colors:o,positions:i,hsls:r}},z=({hsls:e,width:t})=>{const a=e.length/3,n=[];for(let r=0,c=0;r<a;r++,c+=3)n.push({h:e[c],s:e[c+1],l:e[c+2],i:r});n.sort((e,t)=>t.h-e.h);const s=n.map(e=>e.i),i=new Float32Array(e.length),o=new Float32Array(a);return s.forEach((e,a)=>{const n=a%t,s=Math.floor(a/t),r=0;i[3*e]=n,i[3*e+1]=s,i[3*e+2]=r,o[a]=e}),{huePositions:i,hueIndexes:o}},U=e=>{const t=e.split("\n"),a=t.splice(0,1)[0],n=a.split(" "),s=Number(n[0]),i=Number(n[1]),o=new Float32Array(3*t.length),r=new Float32Array(s*i).fill(-1);return t.forEach((e,t)=>{if(""==e)return;const a=e.split(" "),n=Number(a[0]),i=Number(a[1]);o[3*t]=n,o[3*t+1]=i,o[3*t+2]=0,r[i*s+n]=t}),{tsneIndexes:r,tsnePositions:o}};var M=new f["a"].Store({state:{loaded:!1,confirmedAtlas:!1,fileData:{},showAtlases:!1,sort:"default",stuff:j,tsnePositions:null,tsneIndexes:null,huePositions:null,hueIndexes:null,defaultPositions:null,defaultColors:null,currentBucket:null,itemsTotal:0,loadedAtlas:0,atlases:{}},getters:{totalFromBuckets:e=>Object.values(e.stuff).map(e=>e.count).reduce((e,t)=>e+t,0)},actions:{getCurrentAtlases({dispatch:e,commit:t},{bucket:a,atlasCount:n}){t("setLoadedAtlas",n);for(let s=0;s<n;s++)e("getAtlasForBucketIndex",{bucket:a,index:s})},getAtlasForBucketIndex({commit:e},{bucket:t,index:a}){const n=E+"/atlas/"+t.key+"_"+a+".jpg",s=new A;s.load(n,n=>{e("decreaseLoadedAtlas"),n.encoding=w["J"],n.flipY=!1,e("setAtlasForBucketIndex",{bucket:t,index:a,atlas:n})})},loadFile:({state:e,commit:t},a)=>{t("setFileData",{});const n=a;let s=B+"files/"+a;S.get(s).then(a=>{const s=a.data.file.image.variants["300_300"].url,i=a.data.file.title,o=new Image;o.onload=()=>{const a=Object.assign(Object.assign({},e.fileData),{id:n,image:s,title:i});t("setFileData",a)},o.onerror=()=>{const a="/not_found.svg",s=Object.assign(Object.assign({},e.fileData),{id:n,image:a,title:i});t("setFileData",s)},o.src=s}),s=F+"colors_minimal/"+a+".json",S.get(s).then(a=>{const s=a.data,i=s?s.map(e=>({color:e.h,percent:Number(e.f)})):[],o=s?s.map(e=>e.t.split(":")):[],r=Object.assign(Object.assign({},e.fileData),{id:n,palette:i,colorNames:o});t("setFileData",r)})}},mutations:{setConfirmedAtlas:e=>e.confirmedAtlas=!0,setShowAtlases:(e,t)=>e.showAtlases=t,setSort:(e,t)=>{t||(t="default"),e.sort=t},setLoadedAtlas:(e,t)=>{e.loadedAtlas=t},decreaseLoadedAtlas:e=>{e.loadedAtlas--},setAtlasForBucketIndex:(e,{bucket:t,index:a,atlas:n})=>{const s=Object.assign({},e.atlases);let i;i=s[t.key]?Object.assign({},s[t.key]):[],i[a]=n,s[t.key]=i,e.atlases=s},setFileData:(e,t)=>e.fileData=t,setStuff:(e,t)=>e.stuff=t,setBucket(e,t){return Object(p["a"])(this,void 0,void 0,(function*(){if(!t)return void(e.currentBucket=null);const a=E+"buckets/"+t.key+".txt",n=yield S.get(a),s=n.data,i=Object.assign(Object.assign({},e.stuff[t.id]),t);i.ids=s.split(",");const{pixels:o,width:r}=yield C(i);i.pixels=o;const{colors:c,positions:l,hsls:d}=q(i.pixels);e.defaultColors=c,e.defaultPositions=l;const{huePositions:u,hueIndexes:m}=z({hsls:d,width:r});let h,p;const f=E+"similarities/"+t.key+".txt";try{const e=yield S.get(f),t=U(e.data);h=t.tsneIndexes,p=t.tsnePositions}catch(g){p=l,h=new Float32Array(i.ids.length)}e.tsnePositions=p,e.tsneIndexes=h,e.huePositions=u,e.hueIndexes=m,e.currentBucket=i}))},getIdsForBucket(e,t){return Object(p["a"])(this,void 0,void 0,(function*(){const a=Object({NODE_ENV:"production",VUE_APP_API_BASE_URL:"https://apiv2.sl.nsw.gov.au/collection/v1/",VUE_APP_API_KEY:"4GiyqFNOt7ZdMZCubAdC5WVq9zGeaT8P",VUE_APP_FILES_BASE_URL:"https://collection.sl.nsw.gov.au/digital/file/",VUE_APP_S3_BASE_URL:"https://dxlab-fellowship-2019.s3.amazonaws.com/",BASE_URL:"/dxlab-fellowship-2019/"}).VUE_APP_ELASTIC_BASE_URL+"_search",n=t.key,s=t.id,i=t.count,o=Math.ceil(i/P),r=new Array(o),c={track_total_hits:!0};let l=[];yield D(r,(e,i)=>Object(p["a"])(this,void 0,void 0,(function*(){let e=L().size(P).from(i*P).rawOption("_source","_id");e=T({key:n,id:s,query:e});const o=t.esQuery;o&&(e=I({query:e,esQuery:o}));const r=yield S.post(a,Object.assign(Object.assign({},e.build()),c)),d=r.data.hits;l=l.concat(d.hits.map(e=>e._id))})));const d=Object.assign(Object.assign({},t),{data:[...l]});let u=Object.assign({},e.stuff);u=Object.assign(Object.assign({},u),{[n]:d}),e.stuff=Object.assign({},u)}))},getBuckets(e){return Object(p["a"])(this,void 0,void 0,(function*(){console.log("base",E);const t=E+"counts.csv",a=yield S.get(t),n=yield v()().fromString(a.data),s={};let i=0;n.forEach(e=>{const t=e.bucket;if(!j[t])return;const a=Number(e.count),n=Object.assign(Object.assign({},j[t]),{count:a,key:t}),o=a<10?a:10;n.images=[];for(let s=0;s<o;s++)n.images.push(E+"images/"+t+"/"+s+".jpg");s[t]=n,i+=a}),e.stuff=s,e.itemsTotal=i,e.loaded=!0}))}},modules:{}}),R=a("b71a"),K=a.n(R);n["default"].config.productionTip=!1,n["default"].use(K.a),new n["default"]({router:h,store:M,render:e=>e(l)}).$mount("#app")}});
//# sourceMappingURL=app.e7f82519.js.map