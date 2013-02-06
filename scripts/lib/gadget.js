// ***********************
// * WRAPPER WRAPPER
// * WRAPPER WRAPPER
// ***********************
$ImgBackground = null;
// ***********************
// * initialize
// ***********************
function Initialize(gadgetStyle, flyoutDoc, onLoadCallback){
    window.attachEvent("onload", function(){
        document.body.style.width = gadgetStyle.width;
        document.body.style.height = gadgetStyle.height;
        document.body.style.padding = (gadgetStyle.padding == undefined) ? 0 : gadgetStyle.padding;
        System.Gadget.settingsUI = flyoutDoc;
        onLoadCallback();
    });
}
// ***********************
// * text wrappers
// ***********************
function SetTextNode(imgBackground){
    $ImgBackground = imgBackground;
}
function AddText(text, x, y, textStyle){
    textStyle = textStyle == undefined ? {} : textStyle;
    var textObject = this.$ImgBackground.addTextObject(
        text,
        (textStyle.font == undefined) ? "Segoe UI" : textStyle.font,
        (textStyle.size == undefined) ? 8 : textStyle.size,
        (textStyle.color == undefined) ? "white" : textStyle.color,
        x, y
    );
    
    textObject.opacity = (textStyle.opacity == undefined) ? 100 : textStyle.opacity;
    
    if(textStyle.shadowColor != undefined){
        textObject.addShadow(
            textStyle.shadowColor,
            textStyle.shadowRadius,
            textStyle.shadowAlpha,
            textStyle.shadowDeltaX,
            textStyle.shadowDeltaY
        );
    }
    return textObject;
}
// ***********************
// * pref wrappers
// ***********************
function PrefGet(key){
    return System.Gadget.Settings.read(key);
}
function PrefGets(key){
    return System.Gadget.Settings.readString(key);
}
function PrefSet(key, val){
    return System.Gadget.Settings.read(key, val);
}
function PrefSets(key, strVal){
    return System.Gadget.Settings.writeString(key, strVal);
}
// ***********************
// * other
// ***********************
function $(nodeId){
    return document.getElementById(nodeId);
}
function ClearAll(){
    $ImgBackground.removeObjects();
}