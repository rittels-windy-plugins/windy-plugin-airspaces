
const globalCss = `<style id='stylesheet-for-windy-plugin-airspaces'>.onwindy-plugin-airspaces.onwindy-plugin-airspaces-info #search{display:none}.onwindy-plugin-airspaces.onwindy-plugin-airspaces-info #plugin-developer-mode{left:400px}#windy-plugin-airspaces-info{display:none}.onwindy-plugin-airspaces.onwindy-plugin-airspaces-info #windy-plugin-airspaces-info{display:block}.ondetail #windy-plugin-airspaces-info{display:none !important}.onrplanner #windy-plugin-airspaces-info{display:none !important}#windy-plugin-airspaces-info .list-line-div{margin:1px;border:0px;font-size:13px;line-height:1.3;margin-left:15px}#windy-plugin-airspaces-info .list-line-div .bullet{height:8px;width:8px;border-radius:8px;border:1px solid;display:inline-block;margin-right:10px;opacity:0}#windy-plugin-airspaces-info .list-line-div .list-line-div-txt{padding:1px;cursor:pointer;border-radius:3px;width:fit-contents;opacity:.8}#windy-plugin-airspaces-info .list-line-div.highlight .list-line-div-txt{font-weight:bold;opacity:1}#windy-plugin-airspaces-info .list-line-div.highlight .bullet{opacity:1}#windy-plugin-airspaces-info .list-line-div .message{display:none}#windy-plugin-airspaces-info .list-line-div.loading-asp .message{display:inline-block}#windy-plugin-airspaces-info .list-line-div .closing-x-small{text-transform:none;line-height:1.3;color:white;background-color:#9d0300;cursor:pointer;position:absolute;margin:2px 0px 0px 12px;font-size:10px;z-index:10;width:1.3em;height:1.3em;border-radius:1.3em;display:none;opacity:.5;text-align:center}#windy-plugin-airspaces-info .list-line-div .closing-x-small::before{content:'\\2716'}#windy-plugin-airspaces-info .list-line-div:hover .closing-x-small{opacity:1}#windy-plugin-airspaces-info .list-line-div:hover .list-line-div-txt{background-color:rgba(0,0,0,0.3);padding:0px 4px 0px 4px}#windy-plugin-airspaces-info .list-line-div.hidden{display:none}</style>`;
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-windy-plugin-airspaces")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-windy-plugin-airspaces");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
