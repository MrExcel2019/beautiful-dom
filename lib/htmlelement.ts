
import {RegExpObject, Pattern, tag} from './types';

 

class HTMLElementData{
    public outerHTML :string;
    public innerHTML : string;
    public innerText : string;
    public textContent : string;
    private done : Boolean = true;
    public parsedData : HTMLElementData [] = <HTMLElementData []> [];
    private patterns : Pattern [] = [
        {
            regExp : /\*/,
            action : (match : RegExpMatchArray, tokens : string []) => {
                tokens.push(match[0]);
                let holder : HTMLElementData [] = [];
                if(this.parsedData.length){
                    
                    this.parsedData.forEach((htmlElement) =>{
                        holder =  holder.concat(htmlElement.parseAllTags());
                     });
                     let returnValue : HTMLElementData [] = [];
                     let scrapData : string [] = [];
                     returnValue = holder.filter((element) => {
                         if(scrapData.indexOf(element.outerHTML) == -1){
                             scrapData.push(element.outerHTML);
                             return true;
                         }
                     })
                     this.parsedData = returnValue;
                     this.done = false;
                     return this.parsedData;
                }
                this.done = false;
                return this.parseAllTags();
            }
        },
        {
            regExp : /(\w+)(\.|#)(\w+)/,
            action : (match:RegExpMatchArray, tokens : string []) => {
                if(tokens[tokens.length - 1] == '+'){
                    let htmlElements : HTMLElementData [] = this.parsedData;
                    let allElements : HTMLElementData [] = this.parseAllTags();
                    this.parsedData = htmlElements;
                    let returnValue : HTMLElementData [] = [];
                    let secondSiblingRegExp = this.createTagRegExp(match[1]);
                    let secondSiblingMatch : RegExpMatchArray | null;
                    let scrapData : string [] = [];
                    for(let u = 0; u < allElements.length; u++){

                        for(let element = 0; element < htmlElements.length; element++){
                            let breakingCondition : Boolean = false;
                            if(allElements[u].outerHTML == htmlElements[element].outerHTML){
                                for(let x = u+1; x < allElements.length; x++){
                                    if(htmlElements[element].outerHTML.indexOf(allElements[x].outerHTML) > -1){
                                        continue;
                                    }
                                    else if( !(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(secondSiblingRegExp.openingRegExp))){
                                        break;
                                    }
                                    else if(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(secondSiblingRegExp.openingRegExp)){
                                            if(scrapData.indexOf(allElements[x]['outerHTML']) == -1){
                                                scrapData.push(allElements[x].outerHTML);
                                                returnValue.push(allElements[x]);
                                                breakingCondition = true;
                                                u = x;
                                                break;
                                            }  
                                    }
                                }
                            }
                            if(breakingCondition){
                                break;
                            }
                        }
                    }
                    this.done = false;
                    this.parsedData = returnValue;
                }
                else if(tokens[tokens.length - 1] == '>'){
                    let matchingTags : HTMLElementData [] = [];
                    let scrapData : string [] = [];
                    for(let element = 0; element < this.parsedData.length; element++){
                        let matchingElements = this.parsedData[element].getElementsByTagName(match[1]);
                        for (let matchingElement of matchingElements){
                            let i:number;
                            for(i = element + 1; i < this.parsedData.length; i++){
                                if(this.parsedData[i].outerHTML.indexOf(matchingElement.outerHTML) > - 1){ 
                                    // if it is in any of the other possible parents
                                    break;
                                }
                            }
                            if(i == this.parsedData.length){
                                 
                                // that means it is not in any of the other matchingTags
                                if(scrapData.length > 0){
                                    let u = 0;
                                    for(; u < scrapData.length; u++){
                                        if(scrapData[u].indexOf(matchingElement.outerHTML) > - 1){
                                            break;
                                        }
                                        else if(u == scrapData.length -1 && scrapData[u].indexOf(matchingElement.outerHTML) == - 1 ){
                                            scrapData.push(matchingElement.outerHTML);
                                            matchingTags.push(matchingElement);
                                             
                                        }
                                    }
                                } else{
                                    scrapData.push(matchingElement.outerHTML);
                                    matchingTags.push(matchingElement);
                                }
                            }
                        }
                    }
                    this.parsedData = matchingTags;
                }
                else{
                    let holder : HTMLElementData [] = [];
                    if(this.parsedData.length > 0){
                        this.parsedData.forEach((htmlElement) =>{
                            holder =  holder.concat(htmlElement.getElementsByTagName(match[1]));
                        });
                        let returnValue : HTMLElementData [] = [];
                        let scrapData : string[] = [];
                        returnValue = holder.filter((element) => {
                            if(scrapData.indexOf(element.outerHTML) == -1){
                                scrapData.push(element.outerHTML);
                                return true;
                            }
                        })
                        this.parsedData = returnValue;
                    }else{
                        this.getElementsByTagName(match[1]);
                    }
                }
                tokens.push(match[0]);
                let attributeRegExp : RegExp;
                if(match[2] == '.'){
                     attributeRegExp  = new RegExp(`\\s+class\\s*=\\s*('|").*?${match[3]}.*?("|')`, 'm');
                } else if (match[2] == '#') {
                     attributeRegExp  = new RegExp(`\\s+id\\s*=\\s*('|").*?${match[3]}.*?("|')`, 'm');
                }
                
                let returnValue = this.parsedData.filter((element) => {
                    if(element.outerHTML.slice(element.outerHTML.indexOf('<'), element.outerHTML.indexOf('>')).match(attributeRegExp)){
                        return true;
                    }
                });
                this.parsedData = returnValue;
                this.done = false;
                return this.parsedData;
            }
        },
        {
            regExp : /(\w+)/,
            action : (match:RegExpMatchArray, tokens : string []) => {
                if(tokens[tokens.length - 1] == '+'){
                    tokens.push(match[0])
                    let htmlElements : HTMLElementData [] = this.parsedData;
                    let allElements : HTMLElementData [] = this.parseAllTags();
                    this.parsedData = htmlElements;
                    let returnValue : HTMLElementData [] = [];
                    let secondSiblingRegExp = this.createTagRegExp(match[1]);
                    let secondSiblingMatch : RegExpMatchArray | null;
                    let scrapData : string [] = [];
                    for(let u = 0; u < allElements.length; u++){

                        for(let element = 0; element < htmlElements.length; element++){
                            let breakingCondition : Boolean = false;
                            if(allElements[u].outerHTML == htmlElements[element].outerHTML){
                                for(let x = u+1; x < allElements.length; x++){
                                    if(htmlElements[element].outerHTML.indexOf(allElements[x].outerHTML) > -1){
                                        continue;
                                    }
                                    else if( !(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(secondSiblingRegExp.openingRegExp))){
                                        break;
                                    }
                                    else if(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(secondSiblingRegExp.openingRegExp)){
                                            if(scrapData.indexOf(allElements[x]['outerHTML']) == -1){
                                                scrapData.push(allElements[x].outerHTML);
                                                returnValue.push(allElements[x]);
                                                breakingCondition = true;
                                                break;
                                            }  
                                    }
                                }
                            }
                            if(breakingCondition){
                                break;
                            }
                        }
                    }
                    this.parsedData = returnValue;
                    this.done = false;
                    return this.parsedData;
                }
                else if(tokens[tokens.length - 1] == '>'){
                    let matchingTags : HTMLElementData [] = [];
                    let scrapData : string [] = [];
                    for(let element = 0; element < this.parsedData.length; element++){
                        let matchingElements = this.parsedData[element].getElementsByTagName(match[1]);
                        for (let matchingElement of matchingElements){
                            let i:number;
                            for(i = element + 1; i < this.parsedData.length; i++){
                                if(this.parsedData[i].outerHTML.indexOf(matchingElement.outerHTML) > - 1){ 
                                    // if it is in any of the other possible parents
                                    
                                    break;
                                }
                            }
                            if(i == this.parsedData.length){
                                 
                                // that means it is not in any of the other matchingTags
                                if(scrapData.length > 0){
                                    let u = 0;
                                    for(; u < scrapData.length; u++){
                                        if(scrapData[u].indexOf(matchingElement.outerHTML) > - 1){
                                            break;
                                        }
                                        else if(u == scrapData.length -1 && scrapData[u].indexOf(matchingElement.outerHTML) == - 1 ){
                                            scrapData.push(matchingElement.outerHTML);
                                            matchingTags.push(matchingElement);
                                             
                                        }
                                    }
                                } else{
                                    scrapData.push(matchingElement.outerHTML);
                                    matchingTags.push(matchingElement);
                                }
                            }
                        }
                    }
                    this.parsedData = matchingTags;
                    this.done = false;
                    return this.parsedData
                }
                tokens.push(match[0]);
                let holder : HTMLElementData [] = [];
                if(this.parsedData.length > 0){
                    this.parsedData.forEach((htmlElement) =>{
                       holder =  holder.concat(htmlElement.getElementsByTagName(match[0]));
                    });
                    let returnValue : HTMLElementData [] = [];
                    let scrapData : string[] = [];
                    returnValue = holder.filter((element) => {
                        if(scrapData.indexOf(element.outerHTML) == -1){
                            scrapData.push(element.outerHTML);
                            return true;
                        }
                    })
                    this.parsedData = returnValue;
                    this.done = false;
                    return this.parsedData;
                }else{
                    let returnValue =  this.getElementsByTagName(match[0]);
                    this.done = false;
                    return returnValue;
                }
            }
        },
        {
            regExp : /\.(\w+)/,
            action : (match:RegExpMatchArray, tokens : string [], elements : HTMLElementData []) => {
                if(tokens[tokens.length - 1] == '+'){
                    tokens.push(match[0])
                    let htmlElements : HTMLElementData [] = this.parsedData;
                    let allElements : HTMLElementData [] = this.parseAllTags();
                    this.parsedData = htmlElements;
                    let returnValue : HTMLElementData [] = [];
                    let secondSiblingRegExp = this.createTagRegExp(match[1]);
                    let secondSiblingMatch : RegExpMatchArray | null;
                    let scrapData : string [] = [];
                    let attributeRegExp  = new RegExp(`\\s+class\\s*=\\s*('|").*?${match[1]}.*?("|')`, 'm');
                    for(let u = 0; u < allElements.length; u++){

                        for(let element = 0; element < htmlElements.length; element++){
                            let breakingCondition : Boolean = false;
                            if(allElements[u].outerHTML == htmlElements[element].outerHTML){
                                for(let x = u+1; x < allElements.length; x++){
                                    if(htmlElements[element].outerHTML.indexOf(allElements[x].outerHTML) > -1){
                                        continue;
                                    }
                                    else if( !(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(attributeRegExp))){
                                        break;
                                    }
                                    else if(secondSiblingMatch = allElements[x].outerHTML.
                                        slice(allElements[x].outerHTML.
                                        indexOf('<'),allElements[x].outerHTML.
                                        indexOf('>')+1).match(attributeRegExp)){
                                            if(scrapData.indexOf(allElements[x]['outerHTML']) == -1){
                                                scrapData.push(allElements[x].outerHTML);
                                                returnValue.push(allElements[x]);
                                                breakingCondition = true;
                                                break;
                                            }  
                                    }
                                }
                            }
                            if(breakingCondition){
                                break;
                            }
                        }
                    }
                    this.parsedData = returnValue;
                    this.done = false;
                    return this.parsedData;
                }
                else if(tokens[tokens.length - 1] == '>'){
                    let matchingTags : HTMLElementData [] = [];
                    let scrapData : string [] = [];
                    for(let element = 0; element < this.parsedData.length; element++){
                        let matchingElements = this.parsedData[element].getElementsByClassName(match[1]);
                        for (let matchingElement of matchingElements){
                            let i:number;
                            for(i = element + 1; i < this.parsedData.length; i++){
                                if(this.parsedData[i].outerHTML.indexOf(matchingElement.outerHTML) > - 1){ 
                                    // if it is in any of the other possible parents    
                                    break;
                                }
                            }
                            if(i == this.parsedData.length){
                                // that means it is not in any of the other matchingTags
                                if(scrapData.length > 0){
                                    let u = 0;
                                    for(; u < scrapData.length; u++){
                                        if(scrapData[u].indexOf(matchingElement.outerHTML) > - 1){
                                            break;
                                        }
                                        else if(u == scrapData.length -1 && scrapData[u].indexOf(matchingElement.outerHTML) == - 1 ){
                                            scrapData.push(matchingElement.outerHTML);
                                            matchingTags.push(matchingElement);
                                             
                                        }
                                    }
                                } else{
                                    scrapData.push(matchingElement.outerHTML);
                                    matchingTags.push(matchingElement);
                                }
                            }
                        }
                    }
                    this.parsedData = matchingTags;
                    this.done = false;
                    return this.parsedData;
                }
                let holder : HTMLElementData [] = [];
                if(this.parsedData.length > 0){
                    this.parsedData.forEach((htmlElement) =>{
                       holder =  holder.concat(htmlElement.getElementsByClassName(match[0].slice(1)));
                    });
                    let returnValue : HTMLElementData [] = [];
                    let scrapData : string [] = [];
                    returnValue = holder.filter((element) => {
                        if(scrapData.indexOf(element.outerHTML) == -1){
                            scrapData.push(element.outerHTML);
                            return true;
                        }
                    })
                    this.parsedData = returnValue;
                    this.done = false;
                    return this.parsedData;
                }else{
                    let returnValue = this.getElementsByClassName(match[0].slice(1));
                    this.done = false;
                    return returnValue;
                }
            }
        },
        {
            regExp : /\+|>/,
            action : (match:RegExpMatchArray, tokens:string[]) =>{
                tokens.push(match[0]);
                return this.parsedData; 
            }
        },
        {
            regExp : /\[(\w+)(([\^\|\~\$\*])?=?('|")(\w+)('|"))?\]/,
            action : (match:RegExpMatchArray, tokens : string [], elements : HTMLElementData []) => {
                tokens.push(match[0]);
                this.done = false;
                return this.getByAttribute(match[1])
            }
        }
        
    ]
    constructor(outerHTML:string){
        if(typeof outerHTML != 'string'){
            throw new TypeError('Input data must be a string');
        }
        this.outerHTML = outerHTML;
        this.innerHTML = this.innerText = this.textContent = this.outerHTML.slice(this.outerHTML.indexOf('>')+1,this.outerHTML.lastIndexOf('<'));
        this.textContent = this.textContent.replace(/<.*?>/gi, '');
    }
    public getStatus() : Boolean {
        return this.done;
    }
    private getAllTags(data : string) : tag [] {
        let tagsRegex : RegExp = /<\s*(\w+)\s*.*?>/mi;
        let match : RegExpMatchArray | null ;
        let startingIndex : number = 0;
        let availableTags : tag [] = [];
        let counter = 0;
        while(match = data.slice(startingIndex).match(tagsRegex)){
            let tagObject = {tag : match[1], index : counter++}
            availableTags.push(tagObject);
            let index = match ? typeof(match['index']) == 'number' ? match['index'] : 0 : 0;
            startingIndex += index + match[0].length;
        }
        return availableTags;
    }

    private createTagRegExp(tagType : string) : RegExpObject{
        let tagRegExp : RegExp = new RegExp(`<\\s*${tagType}(\\s*|\\s+).*?>|<\\s*\/${tagType}>`,"mi");
        let openingRegExp : RegExp = new RegExp(`<\\s*${tagType}(\\s*|\\s+).*?>`);
        let closingRegExp : RegExp = new RegExp(`<\\s*\/${tagType}>`);

	    return {tagRegExp: tagRegExp, openingRegExp:openingRegExp, closingRegExp: closingRegExp};

    }

    public getElementsByTagName(tag : string){
        this.parsedData = < HTMLElementData []> [];
        let match : RegExpExecArray | null;
        let matchRegex : RegExpObject = this.createTagRegExp(tag);
        let data_copy : string = this.innerHTML.slice(0,);
        let matches : RegExpExecArray [] = < RegExpExecArray []> [];
        while(match = (matchRegex.tagRegExp).exec(data_copy)){
            let index = match ? typeof(match['index']) == 'number' ? match['index'] : 0 : 0;
            data_copy = data_copy.slice(match[0].length + index,);
            if(matches.length > 0){
                match['index'] = matches[matches.length-1]['index'] + matches[matches.length - 1][0].length + (match['index'] ? match['index'] : 0);
            }
            matches.push(match);
        }

        for(let i = 0; i < matches.length; i++){
            let openingTag : RegExpMatchArray | null
            let closingTagsCounter : number = 0;
            let openingTagsCounter : number = 0;
            if(openingTag = matches[i][0].match(matchRegex.openingRegExp)){
                openingTagsCounter += 1;
                for(let u = i+1; u < matches.length; u++){
                    if(matchRegex.openingRegExp.test(matches[u][0])){
                        openingTagsCounter += 1;
                    }
                    if(matchRegex.closingRegExp.test(matches[u][0])){
                        closingTagsCounter += 1;
                    }
                    if(openingTagsCounter == closingTagsCounter){
                        let outerHTML = this.innerHTML.slice(matches[i]['index'], matches[u]['index'] + matches[u][0].length);
                        let node_object : HTMLElementData = new HTMLElementData(outerHTML);
                        this.parsedData.push(node_object);
                        break;
                    }
                }
                if(closingTagsCounter == 0){
                    let outerHTML = this.innerHTML.slice(matches[i]['index'], matches[i]['index'] + matches[i][0].length);
                    let node_object : HTMLElementData = new HTMLElementData(outerHTML);
                    this.parsedData.push(node_object);
                }
            }
        }
        this.done = true;
        return this.parsedData;
    }

    public parseAllTags(){
        let tags : tag [] = this.getAllTags(this.innerHTML);
        let elements : HTMLElementData [] = < HTMLElementData []> [];
        for (let tag of tags){
            // get all the tags in this array that is of this type;
            let relatives = tags.filter((tagData) => {
                if(tagData.tag == tag.tag ){
                    return true;
                }
            });
            let temp  = this.getElementsByTagName(tag.tag)
            temp.forEach((element, index) => {
                elements[relatives[index]['index']] = element;
            })
        }
        this.parsedData = elements;
        return this.parsedData;
    }

    private getByAttribute( attribute : string, attributeValue ? : string): HTMLElementData[] {
        let attributeRegExp : RegExp= new RegExp(`${attribute}=\\s*('|")((\\b${attributeValue}\\b.*?)|(.*?\\b${attributeValue}\\b.*?)|(.*?\\b${attributeValue}\\b))("|')`, 'mi');
        if(this.parsedData.length == 0 || this.done){
            this.parseAllTags();
        }  
        let matchingTags : HTMLElementData [] = <HTMLElementData []> [];
        for(let i = 0; i < this.parsedData.length; i++){
            if(this.parsedData[i]['outerHTML']
                .slice(this.parsedData[i]['outerHTML']
                .indexOf('<'),this.parsedData[i]['outerHTML']
                .indexOf('>')+1)
                .match(attributeRegExp)) {
                matchingTags.push(this.parsedData[i]);
            }
        }
        this.parsedData = matchingTags;
        return matchingTags;
    }

    public getElementsByClassName(classValue:string) : HTMLElementData []{
        this.done = true;
        return this.getByAttribute( 'class', classValue);
    }

    public querySelectorAll(query : string) : HTMLElementData[] {
        this.parsedData = this.done ? [] : this.parsedData;
        let tokens : string [] = [];
        query = query.trim();
        while(query.length){
            let match : RegExpMatchArray | null;
            for(let pattern of this.patterns){
                if(match = query.match(pattern.regExp)){
                    if(match['index'] == 0){
                        this.parsedData = pattern.action(match, tokens);
                        query = query.slice(match[0].length).trim();
                        break;
                    }
                    else{
                        continue;
                    }
                }
            }
        }
        this.done = true;
        return this.parsedData;
    }

    public querySelector(query : string) : (HTMLElementData | null) {
        let returnValue = this.querySelectorAll(query).slice(0,1)[0] ? this.querySelectorAll(query).slice(0,1)[0] : null ;
        this.done = true;
        return returnValue;
    }

    public getAttribute(attribute : string) : (string | null) {
        let attributeRegExp : RegExp= new RegExp(`${attribute}\\s*=\\s*('|")(.*?)("|')`, 'mi');
        let outerHTML = this.outerHTML.slice(this.outerHTML.indexOf('<'),this.outerHTML.indexOf('>')+1);
        let match = outerHTML.match(attributeRegExp);
        this.done = true;
        return match ? match[2] : null;
    }
}

export default HTMLElementData;