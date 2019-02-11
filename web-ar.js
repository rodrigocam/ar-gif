
class ARScene extends HTMLElement {

    constructor() {
        // parent constructor
        super();
        this.markersId = []
    }

    connectedCallback() {
        const self = this
        
        window.ARThreeOnLoad = function() {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 600,
                cameraParam: 'camera_para.dat',
                onSuccess: function(arScene, arController, arCamera) {
                    console.log(arController.threePatternMarkers[0])
                    self.registerMarkers(arController, arScene);
                    
                    // arController.addEventListener('getMarker', function(ev) {
                    //     if (self.markersId.includes(ev.data.marker.idPatt)){
                    //         console.log(ev.data.marker)
                    //     }
                    // });

                    var renderer = new THREE.WebGLRenderer({antialias: true});
                    var f = Math.min(
                        window.innerWidth / arScene.video.videoWidth,
                        window.innerHeight / arScene.video.videoHeight
                    );
                    var w = f * arScene.video.videoWidth;
                    var h = f * arScene.video.videoHeight;

                    if (arController.orientation === 'portrait') {
                        renderer.setSize(h,w);
                        renderer.domElement.style.transformOrigin = '0 0';
                        renderer.domElement.style.transform = 'rotate(-90deg) translateX(-100%)';
                    } else {
                        renderer.setSize(w,h);
                    }
                    document.body.appendChild(renderer.domElement);

                    var tick = function() {
                        arScene.process()
                        self.updateMarkersTexture(arScene);
                        arScene.renderOn(renderer)
                        requestAnimationFrame(tick);
                    }
                    tick();
                }
            })
        }
        if (window.ARController && ARController.getUserMediaThreeScene) {
            ARThreeOnLoad();
        }
        console.log('connected')
    }

    /* 
    Register all ar-markers inside this ar-scene.
    */
    registerMarkers(arController, arScene) {
        var markers = Array.from(this.children).filter((child) => {
            if(child.tagName == 'AR-MARKER') {
                return true;
            }
            return false;
        })

        const self = this
        for (let m of markers) {
            let single = m.getAttribute("multi") ? false : true
            if (single) {
                arController.loadMarker(m.getAttribute("patt"), function(id) {
                    m.init(id, arController, arScene)
   
                    self.markersId.push(id)
                    
                    console.log('Marker registered')
                })
            }
        }
    }

    updateMarkersTexture(arScene){
        for (let key in arScene.arController.threePatternMarkers) {
            var marker = arScene.arController.threePatternMarkers[key]
            if(marker.visible) {
                marker.children[0].material.map.needsUpdate = true
                marker.children[0].material.needsUpdate = true
            }
        }
    }
}

class ARMarker extends HTMLElement {
    constructor() {
        // parent constructor
        super();

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gifLoaded = false;
    }

    get markerId() {
        return this.getAttribute('marker-id')
    }

    init(markerId, arController, arScene){
        // geometry, material, plane
        this.setAttribute('marker-id', markerId)
        this.arController = arController

        this.threeMarker = arController.createThreeMarker(markerId)
        let geometry = new THREE.PlaneGeometry(1,1)

        let texture = new THREE.CanvasTexture(this.canvas);

        let material = new THREE.MeshBasicMaterial({map: texture, transparent: true})
        let plane = new THREE.Mesh(geometry, material)

        this.threeMarker.add(plane)
        arScene.scene.add(this.threeMarker)

        self = this
        arController.addEventListener('getMarker', function(ev) {
            if (ev.data.marker.idPatt == markerId) {
                // console.log(self.threeMarker.id)
                // console.log(arController.threePatternMarkers[1].id)
                if(!self.gifPlaying) {
                    console.log('entrou')
                    // self.ctx.fillStyle = "red"
                    // self.ctx.fillRect(0,0,self.canvas.width, self.canvas.height)
                    var tm = arScene.arController.threePatternMarkers[markerId]
                    let texture = new THREE.CanvasTexture(self.canvas);
                    let material = new THREE.MeshBasicMaterial({map: texture, transparent: true})
                    tm.children[0].material = material
                    // console.log(ev.data.marker)
                    self.playGif()
                    // tm.children[0].material.map.needsUpdate = true;
                    // texture.needsUpdate = true;
                }
                // arController.threePatternMarkers[0].children[0].material.map.needsUpdate = true
                // arController.threePatternMarkers[0].children[0].material.needsUpdate = true

            }
        });
    }

    createPlane() {
        return
        // new THREE.PlaneGeometry(5, 20)
    }

    playGif() {
        if(!this.gifLoaded) {
            this.gif =  fetch(this.getAttribute('content'))
                        .then(resp => resp.arrayBuffer())
                        .then(buff => new GIF(buff))
                        .then(this.gifLoaded = true)
            
            this.frames = this.gif.then(gif => gif.decompressFrames(true))
            
        }
        this.gifPlaying = true;
        this.frames.then(frames => this.renderGif(frames, 0))
    }

    stopGif() {
        this.gifPlaying = false;
    }

    renderGif(frames, frameIndex) {
        if(this.gifPlaying) {
            if (frameIndex >= frames.length) {
                frameIndex = 0;
            }
            var frame = frames[frameIndex]
            var start = new Date().getTime();
        
            if(frameIndex != 0) {
                var lastFrame = frames[frameIndex - 1]
                if(lastFrame.disposalType == 2) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
                }
            } else {
                this.canvas.width = frame.dims.width;
                this.canvas.height = frame.dims.height;
            }

            this.drawFrame(frame);
        
            var end = new Date().getTime();
        
            var timeDiff = end - start;
            
            var self = this
  
            setTimeout(function() {
                self.renderGif(frames, frameIndex+1);
            }, Math.max(0, Math.floor(frame.delay - timeDiff)));
        }
    }

    drawFrame(frame) {
        var tmpCanvas = document.createElement('canvas');
        
        tmpCanvas.width = frame.dims.width;
        tmpCanvas.height = frame.dims.height;
  
        var tmpCtx = tmpCanvas.getContext('2d');

        var frameImageData = tmpCtx.createImageData(frame.dims.width, frame.dims.height);
        frameImageData.data.set(frame.patch);

        tmpCtx.putImageData(frameImageData, 0, 0);

        this.ctx.drawImage(tmpCanvas, frame.dims.left, frame.dims.top);
    }
}


customElements.define("ar-scene", ARScene);
customElements.define("ar-marker", ARMarker);