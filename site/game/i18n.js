/* Live, non-destructive display translation. Game state and IDs remain unchanged. */
(() => {
 'use strict';
 const key='fulam-language';
 let language='zh-Hant';
 try { language=localStorage.getItem(key)==='en'?'en':'zh-Hant'; } catch {}
 const pairs={
 'Standard':'標準','Challenge':'挑戰',
  'FuLam One Slice':'富臨一刀','FuLam One Slice home':'富臨一刀主頁','← FuLam home':'← 返回富臨主頁',
  'Beta · The Money Journey · FuLam':'測試版 · 富臨錢進號','FINANCE MEETS ARCADE':'理財 × 遊戲',
  'Everyday choices. Lifelong skills.':'每天的選擇，一生受用的能力。','About the game':'關於遊戲',
  'For general financial education only; not investment advice. Investments can rise or fall in value and you may lose your capital. Past performance does not guarantee future returns.':'本遊戲只作一般理財教育用途，並非投資建議。投資價格可升可跌，可能損失本金；過往表現不保證未來回報。',
  'THE MONEY CHOICE CHALLENGE':'理財選擇挑戰','One topic.':'選定主題，','Keep ':'持續','slicing.':'切錢袋。',
  'A continuous stream of money choices.':'理財選項源源不絕。','Read the question. Find your rhythm.':'看清題目，找到節奏。','How long can you keep a combo?':'你能保持連擊多久？',
  'Game difficulty':'遊戲難度','Easy':'簡單','Medium':'中等','Hard':'困難','A gentle warm-up':'輕鬆熱身','Find your rhythm':'找到節奏','Test your reflexes':'挑戰反應',
  'Play mode':'遊戲模式','Endless practice':'無限練習','No time limit · finish when you want':'不限時間 · 隨時結束','20-correct sprint':'20 個正確答案競速','Beat your time · +3s per wrong slice':'挑戰最快時間 · 錯切加 3 秒',
  'Choose a topic':'選擇主題','How to play ↗':'遊戲玩法 ↗','No rounds or waiting':'持續拋袋，毋須等候','Phone or desktop':'手機及電腦','Open to everyone':'毋須登入',
  'Stocks':'股票','Pick your topic ↗':'選擇主題 ↗','✦ GOOD CHOICE +100':'✦ 正確選擇 +100','YOUR NEXT MOVE':'你的下一步',
  'PICK YOUR TOPIC':'選擇主題','One topic. Non-stop choices.':'一個主題，選項不停。','Each entrance has its own question and answer pool. Read once, then keep slicing.':'每個入口都有獨立題目及選項池；看清題目後持續切袋。',
  'Game features':'遊戲特色','Separate topic entrances':'獨立主題入口','Tools · Investing · Insurance · Loans · Scams':'理財工具 · 投資 · 保險 · 借貸 · 騙局',
  'Different money choices':'個理財選項','Shuffled answers, timing and flight paths.':'隨機答案、出現時間及飛行軌跡。','Keep your rhythm':'保持節奏','Practice freely or chase a sprint best.':'自由練習，或挑戰最佳時間。',
  'Unfinished sprint':'未完成的競速','wrong slices':'次錯切','wrong slice':'次錯切','includes':'包括','Includes':'包括','seconds of wrong-slice penalties':'秒錯切罰時','Sprint complete. Final time':'競速完成，最終時間','Run complete. Total score':'遊戲完成，總分','ROUND':'回合','The Money Journey':'富臨錢進號',
  'answers':'個選項','correct choices':'個正確選項','On this device:':'本機紀錄：','no completed sprint yet':'尚未完成競速','Play this topic':'開始此主題',
  'continuous play':'持續遊戲','SCORE':'分數','NO TIME LIMIT':'不限時間','CORRECT':'正確','correct':'正確','wrong':'錯誤','missed':'漏切','COMBO':'連擊',
  'Money bag slicing arena':'錢袋遊戲區','SLICE THE RIGHT CHOICES':'切開正確選項','Read the question above.':'閱讀上方題目。','Slice correct choices and let wrong ones fall.':'切開正確選項，讓錯誤選項落下。',
  'different answers':'個不同選項','20 correct slices to finish. Wrong cuts add 3 seconds.':'切中 20 個正確選項便完成；錯切加 3 秒。','No time limit. Finish whenever you want.':'不限時間，隨時結束。','Ready to slice':'準備開始',
  'Wrong slice +3s · Missed correct bag breaks combo':'錯切加 3 秒 · 漏切正確選項會中斷連擊','Correct +100 · Wrong −150 · Combo bonus':'正確 +100 · 錯誤 −150 · 連擊加分',
  'Finish & review':'結束及檢視','Bags keep coming · Same topic throughout · Keyboard: Tab to a bag, Enter or Space to slice':'錢袋持續出現 · 題目不變 · 鍵盤：Tab 選擇錢袋，再按 Enter 或空白鍵切開',
  'Game paused':'遊戲已暫停','Your bags and clock are paused. Continue when you are ready.':'錢袋和計時已暫停，準備好便可繼續。','Resume':'繼續','Game menu':'遊戲選單',
  'Return to the game menu?':'返回遊戲選單？','This run will end. Unfinished sprints do not replace your best time.':'本局將會結束；未完成的競速不會覆蓋最佳時間。','Keep playing':'繼續遊戲',
  'There is no countdown on the ready screen. Take your time to read.':'準備畫面不設倒數，可慢慢閱讀。','Pause game':'暫停遊戲','Mute sound':'關閉音效','Enable sound':'開啟音效','Toggle fullscreen':'切換全螢幕',
  'Good choice!':'選得好！','Wrong choice':'選錯了','seconds':'秒','Correct slice':'切對了','Wrong slice':'切錯了','Slice: ':'切開：',
  '20-CORRECT SPRINT COMPLETE':'20 題競速完成','SPRINT ENDED EARLY':'提早結束競速','PRACTICE COMPLETE':'練習完成','Your next target: a faster run.':'下一個目標：更快完成。','That was your rhythm.':'完成這次練習。',
  'final time':'最終時間','points':'分','Raw time':'實際時間','penalties':'罰時','Time played':'遊玩時間','Best':'最佳','combo':'連擊','New best!':'刷新紀錄！',
  'This browser could not save your best time.':'此瀏覽器未能儲存最佳時間。','Complete 20 correct slices to record a sprint best on this device.':'完成 20 個正確切割，便會在本裝置記錄最佳時間。',
  'Correct bags sliced':'切中的正確選項','Wrong bags avoided':'避開的錯誤選項','Wrong bags sliced':'切錯的選項','Correct bags missed':'漏切的正確選項','ONE THING TO KEEP':'記住一點',
  'POINTS · BEST':'分 · 最佳','Play this topic again':'再玩這個主題','Choose another topic':'選擇另一主題','Review choices':'檢視選項','Copy results ↗':'複製成績 ↗',
  'Every run reshuffles the answer pool and flight paths. Best times stay on this device, separately for each topic and difficulty.':'每次重新隨機排列答案和軌跡；各主題及難度的最佳時間只儲存在本裝置。','A closer look at your choices.':'看看你的選擇。',
  'No wrong slices or missed correct bags in this run. Try another topic or difficulty.':'這次沒有切錯或漏切正確選項，可以試試其他主題或難度。','Official learning resources ↗':'官方學習資源 ↗','Results copied!':'已複製成績！','Your results':'你的成績','Done':'完成',
  'Every slice is a choice.':'每一刀都是一個選擇。','FuLam One Slice is The Money Journey’s finance arcade. Choose a topic and slice its correct money bags in a continuous stream.':'富臨一刀是富臨錢進號的理財遊戲。選擇主題，持續切開正確的錢袋。',
  'Practice has no time limit. The sprint finishes after':'練習不限時間。競速模式切中','correct slices, with':'個正確選項便完成；每次錯切加','seconds added for each wrong slice. Repeated bags count as new chances to answer.':'秒。同一選項再次出現時可再次作答。',
  'No account is needed. Completed sprint bests stay on this device, separately for each topic and difficulty. There is no online leaderboard in this game.':'毋須登入。競速最佳紀錄按主題和難度儲存在本裝置；目前沒有線上排行榜。',
  'Optional explanations and official resources are available after you finish. Your score reflects gameplay, not overall financial ability.':'結束後可選擇查看解說和官方資源；遊戲得分不代表整體理財能力。','Open-source credits and licences ↗':'開源項目及授權 ↗','Got it':'知道了',
  'Read. Choose. Slice.':'閱讀、選擇、切開。','Pick a topic.':'選擇主題。','Its question stays visible throughout your run.':'遊戲期間題目會一直顯示。','Swipe through correct bags.':'劃過正確的錢袋。','Hold your mouse button or use your finger. Let wrong choices fall.':'按住滑鼠或用手指劃動，讓錯誤選項落下。','Keep going.':'繼續挑戰。','Bags arrive continuously in a shuffled order, with varied timing and flight paths.':'錢袋以隨機次序、時間及軌跡持續出現。','Choose your finish.':'選擇結束方式。','Practice lasts until you finish. Sprint ends at':'練習可自行結束。競速切中','correct cuts; every wrong cut adds':'個正確選項後結束；每次錯切加','Correct +100':'正確 +100','Wrong −150':'錯誤 −150','Combo bonus':'連擊加分',
  'Keyboard: Tab to an active bag, then press Enter or Space. A missed correct bag breaks your combo. Review explanations after your run, whenever you want.':'鍵盤：用 Tab 選擇可切的錢袋，再按 Enter 或空白鍵。漏切正確選項會中斷連擊；完成後可查看解說。',
  'Fullscreen is unavailable in this browser. You can keep playing here.':'此瀏覽器無法開啟全螢幕，但仍可繼續遊戲。','Could not open fullscreen. You can keep playing here.':'未能開啟全螢幕，但仍可繼續遊戲。','Please enable JavaScript to play.':'請啟用 JavaScript 開始遊戲。'
 };
 if(Array.isArray(window.QUESTIONS_ZH))window.QUESTIONS.forEach((en,i)=>{
  const zh=window.QUESTIONS_ZH[i];
  for(const field of ['chapter','eyebrow','question','context','takeaway','action','menuDescription'])if(en[field]&&zh[field])pairs[en[field]]=zh[field];
  pairs[en.chapter.toUpperCase()]=zh.chapter;
  en.options.forEach((option,j)=>{pairs[option.text]=zh.options[j].text;pairs[option.why]=zh.options[j].why;});
  (en.sources||[]).forEach((source,j)=>{if(zh.sources?.[j]?.title)pairs[source.title]=zh.sources[j].title;});
 });
 const replacements=Object.entries(pairs).sort((a,b)=>b[0].length-a[0].length);
 const savedText=new WeakMap(),savedAttrs=new WeakMap();
 function translated(original){
  if(language==='en'||!original.trim())return original;
  if(pairs[original.trim()])return original.replace(original.trim(),pairs[original.trim()]);
  let result=original;
  for(const [en,zh] of replacements)if(result.includes(en))result=result.split(en).join(zh);
  return result;
 }
 function visit(node){
  if(node.nodeType===3){
   const parent=node.parentElement;if(!parent||parent.closest('script,style,svg,.language-switch'))return;
   const current=node.nodeValue,previous=savedText.get(node),original=previous&&current===previous.last?previous.original:current;
   const last=translated(original);savedText.set(node,{original,last});if(current!==last)node.nodeValue=last;return;
  }
  if(node.nodeType!==1||node.matches('script,style,svg,.language-switch'))return;
  let entries=savedAttrs.get(node)||{};
  for(const attr of ['aria-label','title','placeholder'])if(node.hasAttribute(attr)){
   const current=node.getAttribute(attr),previous=entries[attr],original=previous&&current===previous.last?previous.original:current,last=translated(original);
   entries[attr]={original,last};if(last!==current)node.setAttribute(attr,last);
  }
  savedAttrs.set(node,entries);
  node.childNodes.forEach(visit);
 }
 window.FuLamSliceLanguage={translate:translated,getLanguage:()=>language};
 function updateButtons(){
  document.documentElement.lang=language==='en'?'en':'zh-Hant';
  document.title=language==='en'?'FuLam One Slice | Money Bag Challenge':'富臨一刀｜錢袋理財挑戰';
  document.querySelectorAll('.language-switch').forEach(button=>{const text=language==='en'?'繁體中文':'English',label=language==='en'?'切換至繁體中文':'Switch to English';if(button.textContent!==text)button.textContent=text;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);});
 }
 function setLanguage(next){
  language=next==='en'?'en':'zh-Hant';try{localStorage.setItem(key,language)}catch{}
  visit(document.body);updateButtons();document.dispatchEvent(new Event('fulam-language'));
 }
 document.addEventListener('click',event=>{if(event.target.closest('.language-switch'))setLanguage(language==='en'?'zh-Hant':'en')});
 window.addEventListener('storage',event=>{if(event.key===key){language=event.newValue==='en'?'en':'zh-Hant';visit(document.body);updateButtons()}});
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData')visit(record.target);
   else if(record.type==='attributes')visit(record.target);
   else record.addedNodes.forEach(visit);
  }
  updateButtons();
 });
 visit(document.body);updateButtons();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
})();
