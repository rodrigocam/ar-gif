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

                    const wrapper = this.createCanvasWrapper(renderer.domElement)

                    document.body.appendChild(wrapper)

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

    createCanvasWrapper(canvasElement) {

        const wrapper = document.createElement("div")
        wrapper.appendChild(canvasElement)
        wrapper.setAttribute("id", "canvas-wrapper")
        wrapper.style.position = "relative";
        wrapper.style.overflow = "hidden";
        wrapper.style.height = "100%";
        wrapper.style.width = "100%";
        return wrapper
    }

    centerCanvas(canvas) {
        canvas.style.position = "absolute";
        canvas.style.top = "-9999px";
        canvas.style.bottom = "-9999px";
        canvas.style.left = "-9999px";
        canvas.style.right = "-9999px";
        canvas.style.margin = "auto";
    }

    registerMarkers(arScene, arController) {
        const self = this
        this.htmlMarkers.map((marker) => {
            let single = !marker.mult
            if (single) {
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
            if (marker.visible) {
                marker.children[0].material.needsUpdate = true
                marker.children[0].material.map.needsUpdate = true
            } else if (marker.markerTracker.inPrevious && !marker.markerTracker.inCurrent) {
                this.threeMarkers[key].gifPlaying = false
            }
        })
    }

    createRenderer(arScene, arController) {
        let renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })

        const size = calculateVideoSize();

        //Defines canvas and resolution available
        renderer.setSize(size.width, size.height)

        this.centerCanvas(renderer.domElement)

        console.log(renderer.domElement)
        if (arController.orientation === 'portrait') {
            renderer.domElement.style.transformOrigin = '0 0'
            renderer.domElement.style.transform = 'rotate(-90deg) translateX(-100%)'
        } else {
            if (window.screen.availWidth > window.screen.availHeight) {}
        }

        return renderer;
    }
    resizeWindow() {
        let canvas = document.getElementById("arCanvas")
        const size = calculateVideoSize()
        canvas.style.width = size.width
        canvas.style.height = size.height
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

function calculateVideoSize() {
    const videoAspect = 4 / 3
    const ratio = window.innerWidth / window.innerHeight
    if (ratio < videoAspect) {
        return {
            height: window.innerHeight,
            width: window.innerHeight * videoAspect
        }
    } else {
        return {
            height: window.innerWidth / videoAspect,
            width: window.innerWidth
        }
    }
}

customElements.define("ar-scene", ARScene)