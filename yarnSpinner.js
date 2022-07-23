/*
https://yarnspinnertool.github.io/YarnEditor/

*/

function DialogueTree( dialogueJSON ){
  this.originalJSON = dialogueJSON;
  this.nodes = {};
  
  let splitBySeparators = function ( aString, array_of_separators, removeEmptyStrings, leaveSeparatorsIn ) {
    var new_str = aString;
    for(let s of array_of_separators) {
      new_str = new_str.split(s)
      if(leaveSeparatorsIn){
        let new_new_str = [];
        for(let n = 0; n < new_str.length; n ++){
          new_new_str.push( new_str[n] )
          if(n < new_str.length - 1)
            new_new_str.push(s)
        }
        new_str = new_new_str;
      }
      new_str = new_str.join("@splitter@")
    }
    var ret = new_str.split("@splitter@")
    if(removeEmptyStrings){
      var new_ret = [];
      for(e of ret){
        if(e.length > 0)new_ret.push(e)
      }
      return new_ret
    }
    
    return ret
  }
  
  let parseBody = function(bodyText){
    let bodySplitToLines = bodyText.split("\n");
    let links = [];
    let commands = [];
    let rawBody = "";
    for(let k in bodySplitToLines){
      let lineSeparators = ["[[", "]]", "<<", ">>", "{{", "}}"];
      let splitLine = splitBySeparators(bodySplitToLines[k], lineSeparators, true, true)
      let linkStart = false;
      let lineHasLink = false;
      let tagStart = false;
      let conditionStart = false;
      
      for(let i in splitLine){
        let st = splitLine[i]
        
        if(!linkStart && !tagStart && !conditionStart && !lineSeparators.includes(st)){
          //This must be part of the actual body display text.
          rawBody += st;
        }
        
        if(linkStart){
          lineHasLink = true;
          let splitLink = splitBySeparators(st, "|")
          let linkObj = {
            nodeTitle: splitLink[1] || splitLink[0],
            rawDisplayText: splitLink[0], //This is RAW display text because it doesn't replace any % %
            condition: true,
            alwaysDisplay: false,
            tags: [],
            get displayText(){
              let newDisplayText = '';
              let lineSeparators = ["${", "}"]
              let splitDisplayText = splitBySeparators(this.rawDisplayText, lineSeparators, true, true)
              let evalStart = false;
              for(j in splitDisplayText){
                let addition = splitDisplayText[j]
                if(lineSeparators.includes(addition))addition = "";
                if(evalStart){
                  addition = eval(splitDisplayText[j]);
                  addition = addition.toString(); //just in case
                  evalStart = false;
                }
                newDisplayText += addition;
                if(splitDisplayText[j] == "${")evalStart = true;
              }
              return newDisplayText;
            }
          }
          links.push( linkObj )
          linkStart = false;
        }
        
        if(tagStart && lineHasLink){
          let lastLink = links[links.length - 1]
          if(st.toLowerCase() == "always display"){
            lastLink.alwaysDisplay = true;
          } else {
            lastLink.tags.push(st);
          }
          tagStart = false;
        }
        
        if(conditionStart && lineHasLink){
          let lastLink = links[links.length - 1]
          lastLink.condition = st;
          conditionStart = false;
        }
        
        if(conditionStart && !lineHasLink){
          //this is not a condition but a command
          commands.push( st );
          conditionStart = false;
        }
        
        if(st == "[[")linkStart = true;
        if(st == "{{")tagStart = true;
        if(st == "<<")conditionStart = true;
      }
      lineHasLink = false;
      rawBody += "\n"
    }
    return {links, rawBody, commands}
  }
  
  for(i in dialogueJSON){
    let nParsed = parseBody( dialogueJSON[i].body )
    
    let n = {
      originalBody: dialogueJSON[i].body,
      rawBody: nParsed.rawBody,
      links: nParsed.links,
      commands: nParsed.commands,
      executeCommands: function() {
        for(let c of this.commands){
          eval(c);
        }
      },
      
      get displayLinks() {
        let ret = [];
        for(let link of this.links){
          if( eval(link.condition) === true || link.alwaysDisplay ){
            ret.push(link);
          }
        }
        return ret;
      },
      
      colorID: dialogueJSON[i].colorID,
      position: dialogueJSON[i].position,
      tags: dialogueJSON[i].tags,
      title: dialogueJSON[i].title,
      
      get body() {
        //Get body with all ${} placeholders replaced
        let newBody = '';
        let lineSeparators = ["${", "}"]
        let splitBody = splitBySeparators(this.rawBody, lineSeparators, true, true)
        let evalStart = false;
        for(j in splitBody){
          let addition = splitBody[j]
          if(lineSeparators.includes(addition))addition = "";
          if(evalStart){
            addition = eval(splitBody[j])
            evalStart = false;
          }
          newBody += addition;
          if(splitBody[j] == "${")evalStart = true;
        }
        return newBody;
      }
    }
    
    this.nodes[i] = n;
  }
  
  this.name = this.nodes[0].title; //Can be changed manually
  this.activeNode = "an active node has not been chosen yet. Use the setActiveNode() method";
  this.nodeHistory = []; //array of indeces ordered oldest to newest
  
  let _activeNodeIndex = null;
  this.setActiveNode = function(nodeTitle, ignore_commands){
    let foundNode = this.getNode( nodeTitle )
    this.activeNode = foundNode;
    let nodeIndex = this.getNodeIndex( nodeTitle );
    _activeNodeIndex = nodeIndex;
    this.nodeHistory.push(_activeNodeIndex)
    if( !(ignore_commands === true) ){
      this.nodes[nodeIndex].executeCommands();
    }
  }
  this.followLink = function(linkIndex, displayLinksOnly, ignore_commands){
    //convert link title to index if necessary 
    let linkListToUse = this.activeNode.links
    if(displayLinksOnly)linkListToUse = this.activeNode.displayLinks
    
    if( isNaN(linkIndex) ){
      let foundIndex = null;
      for(let i in linkListToUse){
        var l = linkListToUse[i]
        if( [l.displayText, l.rawDisplayText].includes(linkIndex) ){
          foundIndex = i;
        }
      }
      if(foundIndex === null){
        console.warn("Warning: A link called: " + linkIndex + " could not be found in node: " + this.activeNode.title)
      }
      linkIndex = foundIndex;
    }
    
    if(linkListToUse[linkIndex] === undefined){
      console.error("Error: the link index: " + linkIndex + " is out of range of the Node: " + this.activeNode.title)
    }
    let nodeTitle = linkListToUse[linkIndex].nodeTitle;
    if( this.getNode(nodeTitle) === null ){
      this.activeNode = null;
      _activeNodeIndex = null;
      
    }
    else {
      this.activeNode = this.getNode( nodeTitle )
      let nodeIndex = this.getNodeIndex( nodeTitle );
      _activeNodeIndex = nodeIndex;
      this.nodeHistory.push(_activeNodeIndex)
      if(!ignore_commands){
        this.nodes[nodeIndex].executeCommands();
      }
      
    }
    
  }
  
  this.getNode = function( nodeTitle ){
    if( !isNaN( nodeTitle ) ){
      if(this.nodes[nodeTitle] !== undefined)
      return this.nodes[nodeTitle];
      else
      console.warn("Warning: Node " + nodeTitle + " could not be found.")
      return null;
    }
    for(let i in this.nodes){
      if(this.nodes[i].title == nodeTitle) return this.nodes[i]
    }
    console.warn("Warning: Node " + nodeTitle + " could not be found.")
    return null;
  }
  this.getNodeIndex = function( nodeTitle ){
    if( !isNaN( nodeTitle ) ){
      if(this.nodes[nodeTitle] !== undefined)
      return nodeTitle;
      else
      console.warn("Warning: Node " + nodeTitle + " could not be found.")
      return null;
    }
    for(let i in this.nodes){
      if(this.nodes[i].title == nodeTitle) return int(i);
    }
    console.warn("Warning: Node " + nodeTitle + " could not be found.")
    return null;
  }
  
  this.getNodesByTag = function( nodeTag, returnIndex ){
    let ret = [];
    for(let i in this.nodes){
      let itags = this.nodes[i].tags.split(" ")
      if( itags.includes(nodeTag) ){
        if(returnIndex)
        ret.push( int(i) )
        else
        ret.push( this.nodes[i] )
      }
    }
    return ret;
    
  }
  
}
