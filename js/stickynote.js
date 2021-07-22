class Note {
  constructor(){
    this.id = "";
    this.title = "";
    this.priority = "";
    this.color = "";
    this.size = {width:0,height:0};
    this.offset = {x:0,y:0};
    this.textContent = "";
    this.zIndex = "";
    this.menuCollapsed = false;
  }
}

class Tab {
  constructor(){
    this.id = "";
    this.color = "";
    this.title = "";
    this.priority = {text: "", color: ""};
    this.date = "";
  }
}

class StickyNote extends Note {
  
}