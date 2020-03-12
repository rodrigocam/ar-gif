# ar-gif
Easy to use augmented reality web components!


## Introduction
ar-gif is an effort to bring augmented reality with web components in a easy way. It supports gif, png, jpg, mp4 and webm playing with pattern detection markers, but if you want to add new functionalities feel free to contribute.

This web-component is used in [Jandig](https://github.com/memeLab/Jandig), a project the aims to bring AR and Art for everyone.

### Usage
ar-gif has a simple API, we have an ar-scene and one or more ar-markers.
```html
<ar-scene>
  <ar-marker patt="hiro.patt" content="hiro.gif"></ar-marker>
  <ar-marker patt="cat.patt" content="cat.mp4"></ar-marker>
</ar-scene>
```

You can use also use some simple attributes to control the appeareance.

- scale : as a two dimensional vector
- position : as a three dimensional vector
- rotation : as a three dimensional vector
- audio : [0|1] If your mp4 supports audio. The default behavior is muted playback.
- loop : [0|1] Stop a mp4 video at the end. The default behavior is looped playback.


```html
<ar-scene>
  <ar-marker patt="hiro.patt" content="hiro.gif" scale="1 1" position="0 0 0" rotation="0 0 0"></ar-marker>
  <ar-marker patt="cat.patt" content="cat.mp4" audio="1" loop="0"></ar-marker>
</ar-scene>
```
Each ar-scene is responsible to detect every marker inside it and each marker is reponsible to show his content.
The "patt" attribute indicates which pattern will be registered for that marker and the content is the gif, image or video that will be played.

For more information about how to use, check [index.html](https://github.com/rodrigocam/ar-gif/blob/master/example/index.html) int [example](https://github.com/rodrigocam/ar-gif/blob/master/example) folder.

# Build the Repo

This is only needed if you want to modify ar-gif!
Normaly you can just take the build/qr-gif.min.js and use it in your project.

For Windows and Linux:
1) clone the repo
1) install nodejs
1) change into directory
1) run $ npm install
1) run $ npx webpack
1) use build/qr-gif.min.js in your project