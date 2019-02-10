
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

                    self.registerMarkers(arController);
                    
                    arController.addEventListener('getMarker', function(ev) {
                        if (self.markersId.includes(ev.data.marker.idPatt)){
                            console.log(ev.data.marker)
                        }
                    });

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
                        requestAnimationFrame(tick);
                        arController.process(arScene.video)
                        arScene.renderOn(renderer)
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
    registerMarkers(arController) {
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
                    self.markersId.push(id)
                    console.log('Marker registered')
                })
            }
        }
    }
}

class ARMarker extends HTMLElement {
    constructor() {
        // parent constructor
        super();
    }
}


customElements.define("ar-scene", ARScene);
customElements.define("ar-marker", ARMarker);