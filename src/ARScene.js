import CameraParam from './camera_para.dat'

class ARScene extends HTMLElement {

    constructor() {
        super();
        this.htmlMarkers = []
        this.threeMarkers = {}
    }

    connectedCallback() {
        this.htmlMarkers = Array.from(this.children).filter((child) => {
            return child.tagName == "AR-MARKER"
        });

        this.init()

        if (window.ARController && ARController.getUserMediaThreeScene) {
            ARThreeOnLoad()
        }
    }

    init() {
        console.log('AR-GIF version 0.0.4')
        const self = this
 
        window.ARThreeOnLoad = () => {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 640,
                cameraParam: CameraParam,
                facingMode: 'environment',

                onSuccess: (arScene, arController, arCamera) => {
                    console.log("Initialized ar-scene")
                    self.registerMarkers(arScene, arController)
                    
                    let renderer = self.createRenderer(arScene, arController)
                    renderer.domElement.setAttribute("id", "arCanvas")
                    document.body.appendChild(renderer.domElement)

                    window.addEventListener("resize", this.resizeWindow)

                    let tick = () => {
                        arScene.process()
                        arScene.renderOn(renderer)
                        self.updateMarkersState(arController)
                        requestAnimationFrame(tick)
                    }
                    tick()
                },
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
                    marker.init(id, arScene, arController)
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
                marker.children[0].material.needsUpdate = true
                marker.children[0].material.map.needsUpdate = true
            }else if(marker.markerTracker.inPrevious && !marker.markerTracker.inCurrent){
                this.threeMarkers[key].gifPlaying = false
            }
        })
    }

    createRenderer(arScene, arController) {
        let renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true})
        
        let height = window.innerHeight
        let width = 640/480 * window.screen.availHeight * window.devicePixelRatio
        
        renderer.setSize(width, height)
        
        if (arController.orientation === 'portrait') {
			renderer.domElement.style.transformOrigin = '0 0'
            renderer.domElement.style.transform = 'rotate(-90deg) translateX(-100%)'
		} else {
            if(window.screen.availWidth > window.screen.availHeight) {
                renderer.setSize(window.screen.availWidth, height)
            }
		}

        return renderer;
    }

    resizeWindow() {
        let canvas = document.getElementById("arCanvas")
        canvas.setAttribute("width", window.innerWidth)
        canvas.setAttribute("height", window.innerHeight)
        canvas.style.width = window.innerWidth
        canvas.style.height = window.innerHeight
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
