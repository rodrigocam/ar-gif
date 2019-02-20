import CameraParam from './camera_para.dat'

class ARScene extends HTMLElement {

    constructor() {
        super();
        this.htmlMarkers = []
        this.threeMarkers = {}
        this.lastFrameVisibleMarkers = []
    }

    connectedCallback() {
        this.htmlMarkers = Array.from(this.children).filter((child) => {
            return child.tagName == "AR-MARKER"
        });

        this.init()

        if (window.ARController && ARController.getUserMediaThreeScene) {
            ARThreeOnLoad();
        }
    }

    init() {
        const self = this
        let config = {
            maxARVideoSize: Math.max(document.body.clientHeight, document.body.clientWidth),
            cameraParam: CameraParam,
            facingMode: 'environment',
        }
  
        if(document.body.clientWidth > document.body.clientHeight) {
            config.width = {ideal: document.body.clientWidth},
            config.height = {ideal: document.body.clientHeight}
        }
            
        window.ARThreeOnLoad = () => {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: config.maxARVideoSize,
                cameraParam: CameraParam,
                facingMode: 'environment',
                width: config.width,
                height: config.height,
                onSuccess: (arScene, arController, arCamera) => {
                    console.log("Initialized ar-scene")
                    self.registerMarkers(arScene, arController);
                    
                    let renderer = self.createRenderer(arScene, arController)
                    document.body.appendChild(renderer.domElement)

                    let tick = () => {
                        arScene.process()
                        arScene.renderOn(renderer)
                        self.updateMarkersState(arController)
                        requestAnimationFrame(tick)
                    }
                    tick()
                }
            })
        }
    }

    registerMarkers(arScene, arController) {
        const self = this
        this.htmlMarkers.map((marker) => {
            let single = !marker.mult
            if(single) {
                console.log("Registering marker ", marker.patt)
                arController.loadMarker(marker.patt, (id) => {
                    marker.init(id, arScene, arController);
                    self.threeMarkers[id] = marker
                })
            } else {
                console.log('mult marker')
            }
        })
    }

    updateMarkersState(arController) {
        Object.keys(arController.threePatternMarkers).map((key, index) => {
            let marker = arController.threePatternMarkers[key]
            if(marker.visible) {
                marker.children[0].material.needsUpdate = true;
                marker.children[0].material.map.needsUpdate = true;
            }else if(marker.markerTracker.inPrevious && !marker.markerTracker.inCurrent){
                this.threeMarkers[key].gifPlaying = false
            }
        })
    }

    createRenderer(arScene, arController) {
        let renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});

        let width = arScene.video.videoWidth
        let height = arScene.video.videoHeight
        
        if (arController.orientation === 'portrait') {
            /* Inverted because of portrait mode */
            renderer.setSize(height, width);

            renderer.domElement.style.transformOrigin = '0 0';
            renderer.domElement.style.transform = 'rotate(-90deg) translateX(-100%)';
            
            /* Inverted because of portrait mode */
            renderer.domElement.style.width = document.body.clientHeight;
            renderer.domElement.style.height = document.body.clientWidth;
        } else {
            renderer.setSize(width, height);
            renderer.domElement.style.width = document.body.clientWidth;
            renderer.domElement.style.height = document.body.clientHeight;
        }

        return renderer;
    }

    set arScene(value) {
        this.setAttribute('arScene', value)
    }

    get arScene() {
        return this.getAttribute('arScene')
    }

    set arController(value) {
        this.setAttribute('arController', value)
    }

    get arController() {
        return this.getAttribute('arController')
    }

    set renderer(value) {
        this.setAttribute('renderer', value)
    }

    get renderer() {
        return this.getAttribute('renderer')
    }
}
customElements.define("ar-scene", ARScene)
