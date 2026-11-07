/* Loaded after updates.js: the first published update owns the menu date. */
(function(){
 'use strict';
 if(new URLSearchParams(location.search).get('motion')==='lite')document.documentElement.setAttribute('data-motion-lite','');
 var latest=typeof RON_UPDATES!=='undefined'&&RON_UPDATES[0];
 document.querySelectorAll('.nav-date time').forEach(function(time){
  if(!latest)return;
  time.dateTime=latest.date;time.textContent=latest.date.slice(5).replace('-','.');
 });
})();
