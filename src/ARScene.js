import CameraParam from './camera_para.dat'

class ARScene extends HTMLElement {

    constructor() {
        super();
        this.htmlMarkers = []
        this.threeMarkers = {}
        this.renderer = {}
        this.croppedRenderer = {}
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

        window.ARThreeOnLoad = () => {
            ARController.getUserMediaThreeScene({
                maxARVideoSize: 640,
                cameraParam: CameraParam,
                facingMode: 'environment',

                onSuccess: (arScene, arController, arCamera) => {
                    console.log("Initialized ar-scene")
                    this.registerMarkers(arScene, arController)

                    window.arController = arController;

                    let { renderer, croppedRenderer } = this.createRenderers(arController)
                    this.renderer = renderer
                    this.croppedRenderer = croppedRenderer

                    document.body.appendChild(this.croppedRenderer)

                    this.resizeWindow()

                    window.addEventListener("resize", this.resizeWindow)
                    window.addEventListener("onorientationchange orientationchange load", this.resizeWindow);

                    let tick = () => {
                        arScene.process()
                        arScene.renderOn(this.renderer)
                        this.drawCroppedImage(this.renderer.domElement, this.croppedRenderer);
                        this.updateMarkersState(arController)
                        requestAnimationFrame(tick)
                    }
                    tick()
                },
            })
        }
    }

    drawCroppedImage(src, target) {
        const c = crop
        var ctx = target.getContext('2d');
        ctx.drawImage(src, c.x, c.y, c.w, c.h, 0, 0, target.width, target.height);
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

    createRenderers(arController) {
        let renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
        renderer.setSize(640, 480)
        renderer.domElement.setAttribute("id", "arCanvas")

        let croppedRenderer = document.createElement("canvas")
        croppedRenderer.setAttribute("id", "drawingCanvas")

        let { width, height } = getWindowSize(arController.orientation)
        croppedRenderer.width = width
        croppedRenderer.height = height

        if (arController.orientation === 'portrait') {
            croppedRenderer.style.transform = 'rotate(-90deg) translateX(-100%)'
            croppedRenderer.style.transformOrigin = '0 0'
        }

        return { renderer: renderer, croppedRenderer: croppedRenderer };
    }

    resizeWindow() {
        let { width, height } = getWindowSize(window.arController.orientation)

        const canvas = document.getElementById("drawingCanvas")
        canvas.width = width
        canvas.height = height

        const videoHeight = 480
        const videoWidth = 640
        const videoAspect = videoWidth / videoHeight // Same as 4/3    
        const portrait = ((width / height) < videoAspect)

        let x, y, cropWidth, cropHeight
        if (!portrait) {
            x = 0
            cropWidth = videoWidth
            cropHeight = (height * videoWidth) / width
            y = videoHeight - cropHeight
        } else {
            if (isDesktop()) {
                cropHeight = videoHeight
                cropWidth = (width * videoHeight) / height
            } else if (window.arController.orientation === 'landscape') {
                cropHeight = (width * videoWidth) / height
                cropWidth = videoHeight
            } else {
                cropHeight = videoHeight
                cropWidth = (width * videoWidth) / (height * 0.7)
            }
            x = videoWidth - cropWidth
            y = 0
        }

        crop = { x: x, y: y, w: cropWidth, h: cropHeight }
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
}

function getWindowSize(orientation) {
    let width, height
    if (orientation === 'portrait') {
        width = window.innerHeight
        height = window.innerWidth
    } else {
        width = window.innerWidth
        height = window.innerHeight
    }
    return { width: width, height: height }
}

function isDesktop() {
    return !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent))
}
var crop = {
    x: 0,
    y: 0,
    w: 640,
    h: 480
}

customElements.define("ar-scene", ARScene)