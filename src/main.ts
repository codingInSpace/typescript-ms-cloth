import App from './app'

let app = new App()

const onWindowResize = () => {
  app.renderer.setSize(window.innerWidth, window.innerHeight)
  app.camera.aspect = window.innerWidth / window.innerHeight
  app.camera.updateProjectionMatrix()
}

window.addEventListener( 'resize', onWindowResize, false )

// Rotate scene for better view
//app.scene.rotation.y = -30 * Math.PI / 90;

// Init GUI
//new Gui();

export default app
