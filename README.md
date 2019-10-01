# ar-gif
Easy to use augmented reality web components!


## Introduction
ar-gif is an effort to bring augmented reality with web components in a easy way. For now it only supports gif playing with pattern detection markers, but if you want to add new functionalities feel free to contribute.

This web-component is used in [Jandig](https://github.com/memeLab/Jandig), a project the aims to bring AR and Art for everyone.

### Usage
ar-gif has a simple API, we have an ar-scene and one or more ar-markers. 
```html
<ar-scene>
  <ar-marker patt="hiro.patt" content="hiro.gif"></ar-marker>  
</ar-scene>
```
Each ar-scene is responsible to detect every marker inside it and each marker is reponsible to show his content.
The "patt" attribute indicates which pattern will be registered for that marker and the content is the gif that will be played.

For more information about how to use, check [index.html](https://github.com/rodrigocam/ar-gif/blob/master/example/index.html) int [example](https://github.com/rodrigocam/ar-gif/blob/master/example) folder.
