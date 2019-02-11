
class ARScene extends HTMLElement {

    constructor() {
        // parent constructor
        super();
        this.markers = []
        this.registeredMarkers = {}
    }

    connectedCallback() {
        const self = this
        
        window.ARThreeOnLoad = function() {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 600,
                cameraParam: 'camera_para.dat',
                onSuccess: function(arScene, arController, arCamera) {
                    self.arScene = arScene
                    self.arController = arController
                    
                    self.registerMarkers();

                    self.renderer = self.createRenderer(arScene, arController);
                    document.body.appendChild(self.renderer.domElement);

                    arController.addEventListener('markerNum', function(ev) {
                        console.log("Detected " + ev.data + " markers.")
                    });

                    // self.arController.addEventListener('getMarker', function(ev) {
                    //     try {
                    //         let marker = self.registeredMarkers[ev.data.marker.idPatt]
                    //         marker.detected();
                    //         console.log(ev.data.marker)
                    //     } catch (error) {
                            
                    //     }
                    // });

                    let tick = function() {
                        self.arScene.process();
                        self.updateMarkers();
                        // self.updateMarkersTexture();
                        self.arScene.renderOn(self.renderer);
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
    Create WebGl renderer.
    */
    createRenderer() {
        let renderer = new THREE.WebGLRenderer({antialias: true});
        let f = Math.min(
            window.innerWidth / this.arScene.video.videoWidth,
            window.innerHeight / this.arScene.video.videoHeight
        );
        let w = f * this.arScene.video.videoWidth;
        let h = f * this.arScene.video.videoHeight;
        
        if (this.arController.orientation === 'portrait') {
            renderer.setSize(h,w);
            renderer.domElement.style.transformOrigin = '0 0';
            renderer.domElement.style.transform = 'rotate(-90deg) translateX(-100%)';
        } else {
            renderer.setSize(w,h);
        }

        return renderer;
    }

    /* 
    Register all ar-markers inside this ar-scene.
    */
    registerMarkers() {
        this.markers = Array.from(this.children).filter((child) => {
            return (child.tagName == "AR-MARKER") ? true : false
        });

        for (let m of this.markers) {
            let single = m.getAttribute("multi") ? false : true
            if (single) {
                const self = this;
                self.arController.loadMarker(m.getAttribute("patt"), function(id) {
                    m.init(id, self.arScene, self.arController);
                    self.registeredMarkers[id] = m
                    console.log("Marker registered!");
                })
            }
            //TODO: deal with multimarkers
        }
    }

    /*
    Set visibility of all children markers.
    */
    updateMarkersVisibility() {
        for (let key in this.arController.threePatternMarkers) {
            let marker = this.arController.threePatternMarkers[key];
            console.log(marker)
            if(marker.object3D.visible) {
                console.log(marker)
                marker.children[0].material.map.needsUpdate = true;
                marker.children[0].material.needsUpdate = true;
            }
        }
    }

    /*
    Set visibility and update texture of visible markers.
    */
    updateMarkers() {
        for (let key in this.arController.threePatternMarkers) {
            let marker = this.arController.threePatternMarkers[key];
            if(marker.visible) {
                // console.log('achou ', key)
                marker.children[0].material.map.needsUpdate = true;
                marker.children[0].material.needsUpdate = true;
            }else {
                // console.log('perdeu ', key)
                // console.log(this.registeredMarkers[key])
                // this.registeredMarkers[key].stopGif();
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
        this.gifPlaying = false;
    }

    init(markerId, arScene, arController){

        // this.appendChild(this.prototype.canvas)
        this.setAttribute('marker-id', markerId)

        let threeMarker = arController.createThreeMarker(markerId)
        let geometry = new THREE.PlaneGeometry()
        let texture = new THREE.CanvasTexture(this.canvas)
        let material = new THREE.MeshBasicMaterial({map: texture, transparent: true})
        let plane = new THREE.Mesh(geometry, material)

        threeMarker.add(plane)
        arScene.scene.add(threeMarker)

        self = this
        arController.addEventListener('getMarker', function(ev) {
            // verify if the detected marker is the current marker
            if (ev.data.marker.idPatt == markerId) {
                if(!self.gifPlaying){
                    self.gifPlaying = true;
                    self.gifLoaded = true;
                    self.gif = gifler(self.getAttribute('content')).animate(self.canvas);
                    self.updateMarkerTexture(self.get3DMarker(markerId, arScene));
                }
            }
        });
    }

    /* 
    Update this marker texture (generally used when the canvas content has changed).
    */
    updateMarkerTexture(threeMarker) {
        let texture = new THREE.CanvasTexture(this.canvas);
        let material = new THREE.MeshBasicMaterial({map: texture, transparent: true});
        threeMarker.children[0].material = material;
    }

    /*
    Return this marker representation on three.js scene.
    */ 
    get3DMarker(markerId, arScene) {
        let arController = arScene.arController;
        return arController.threePatternMarkers[markerId];
    }

    /*
    Stop gif animation.
    */
   stopGif() {
       if(self.gifPlaying) {
           const self = this
           self.gif.then(function(animator) {
               animator.stop();
               self.gifPlaying = false;
            })
       }
   }
}


customElements.define("ar-scene", ARScene);
customElements.define("ar-marker", ARMarker);