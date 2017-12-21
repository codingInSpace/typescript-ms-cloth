import * as THREE from 'three'
const TrackballControls = require('three-trackballcontrols')

class App {
  constructor() {
    this.uniforms = {
      u_time: { type: 'f', value: 1.0 },
      u_resolution: { type: 'v2', value: new THREE.Vector2() }
    }

    this.dt = 0.05

    this.createScene()
  }

  createScene() {

    // Scene, camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 15000)
    this.camera.position.set(0.0, 0.0, 50.0)
    this.camera.lookAt(0.0, 0.0, 0.0)

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.uniforms.u_resolution.value.x = this.renderer.domElement.width
    this.uniforms.u_resolution.value.y = this.renderer.domElement.height
    this.controls = new TrackballControls(this.camera, this.renderer.domElement)

    const planeGeo = new THREE.PlaneGeometry( 15, 15, 20, 20 )
    const planeMat = new THREE.MeshBasicMaterial( {color: 0x00ff00, side: THREE.DoubleSide, wireframe: true} )
    const plane = new THREE.Mesh( planeGeo, planeMat )
    plane.rotation.x = Math.PI / 2.0
    plane.position.y = 10
    this.scene.add( plane )

    const sphereGeo = new THREE.SphereGeometry( 5, 16, 16 )
    const sphereMat = new THREE.MeshBasicMaterial( {color: 0x0000ff, side: THREE.DoubleSide} )
    const sphere = new THREE.Mesh( sphereGeo, sphereMat )
    this.scene.add( sphere )
    this.render()
  }

  render() {
    requestAnimationFrame(() => {
      this.render()
    })

    this.uniforms.u_time.value += this.dt

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }
}

export default App
