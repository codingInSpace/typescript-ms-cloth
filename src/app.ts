import * as THREE from 'three'
const TrackballControls = require('three-trackballcontrols')
import Spring from './spring'

class App {

  // Constants
  readonly EPSILON: number = 0.0001
  readonly EPSILON2: number = this.EPSILON * this.EPSILON
  readonly DT: number = 1.0 / 60.0
  readonly NUM_X: number = 20
  readonly NUM_Y: number = 20
  readonly DEFAULT_DAMPING: number = -2
  readonly GRAVITY: THREE.Vector3 = new THREE.Vector3(0.0, -9.8, 0.0)
  readonly MASS: number = 2
  readonly size: number = 4 //world space size of cloth
  readonly hsize: number = this.size / 2
  readonly KS_STRUCT: number = 1000
  readonly KD_STRUCT: number = 0.5
  readonly KS_SHEAR: number = 1000
  readonly KD_SHEAR: number = 0.5
  readonly KS_BEND: number = 1000
  readonly KD_BEND: number = 0.5

  // Variables
  private simU: number
  private simV: number
  private simulate: boolean = true

  // Data
  private texture: any
  private springs: Spring[] = []
  private forces: THREE.Vector3[] = []
  private velocities: THREE.Vector3[] = []
  private vertexUVs: THREE.Vector2[] = []
  private clothGeometry: THREE.Geometry
  private lastGeometry: THREE.Geometry
  private clothMesh: THREE.Mesh

  // Graphics engine
  private scene: THREE.Scene
  private controls: any
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer

  constructor() {
    this.simU = this.NUM_X + 1
    this.simV = this.NUM_Y + 1

    this.texture = THREE.ImageUtils.loadTexture( 'https://www.earlypiano.co.uk/wp-content/uploads/2013/02/Early-Keyboard-Action-Cloth.jpg', null, () => {
      this.createScene()
    })
  }

  private createScene(): void {

    // Scene, camera
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0.0, 0.0, 50.0)
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0))

    // Renderer
    this.renderer = new THREE.WebGLRenderer({alpha: true})
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(this.renderer.domElement)

    this.controls = new TrackballControls(this.camera, this.renderer.domElement)

    const sphereGeo = new THREE.SphereGeometry(2, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({color: 0xcc00ff, side: THREE.DoubleSide})
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.y = 2
    //this.scene.add(sphere)

    this.drawSceneGeometry()

    this.clothGeometry = new THREE.Geometry()
    this.lastGeometry = new THREE.Geometry()

    // Cloth vertices
    for (let j = 0; j < this.simV; j++) {
      for (let i = 0; i < this.simU; i++) {
        const tmp = new THREE.Vector3(((i / (this.simU - 1)) * 2.0 - 1.0) * this.hsize, this.size + 1, ((j / (this.simV - 1.0) ) * this.size))
        const uv = new THREE.Vector2(i / (this.simU - 1), 1.0 - j / (this.simV - 1))
        this.forces.push(new THREE.Vector3(0, 0, 0))
        this.velocities.push(new THREE.Vector3(0, 0, 0))
        this.clothGeometry.vertices.push(tmp)
        this.lastGeometry.vertices.push(tmp)
        this.vertexUVs.push(uv)
      }
    }

    // Face information
    for (let i = 0; i < this.NUM_Y; i++) {
      for (let j = 0; j < this.NUM_X; j++) {
        const i0 = i * (this.NUM_X + 1) + j
        const i1 = i0 + 1
        const i2 = i0 + (this.NUM_X + 1)
        const i3 = i2 + 1

        if ((j + i) % 2) {
          const face1 = new THREE.Face3(i0, i2, i1)
          const face2 = new THREE.Face3(i1, i2, i3)
          this.clothGeometry.faces.push(face1)
          this.clothGeometry.faceVertexUvs[0].push([this.vertexUVs[i0], this.vertexUVs[i2], this.vertexUVs[i1]])
          this.clothGeometry.faces.push(face2)
          this.clothGeometry.faceVertexUvs[0].push([this.vertexUVs[i1], this.vertexUVs[i2], this.vertexUVs[i3]])
        } else {
          const face1 = new THREE.Face3(i0, i2, i3)
          const face2 = new THREE.Face3(i0, i3, i1)
          this.clothGeometry.faces.push(face1)
          this.clothGeometry.faceVertexUvs[0].push([this.vertexUVs[i0], this.vertexUVs[i2], this.vertexUVs[i3]])
          this.clothGeometry.faces.push(face2)
          this.clothGeometry.faceVertexUvs[0].push([this.vertexUVs[i0], this.vertexUVs[i3], this.vertexUVs[i1]])
        }
      }
    }

    this.clothGeometry.computeFaceNormals()
    this.clothGeometry.computeVertexNormals()

    const clothMaterial = new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load('public/fabric.png'), side: THREE.DoubleSide})
    this.clothMesh = new THREE.Mesh(this.clothGeometry, clothMaterial)
    this.scene.add(this.clothMesh)

    // Scene light
    const light = new THREE.PointLight(0xdddddd);
    light.position.set(0, 3, 25);
    this.scene.add(light);

    // Add springs
    // Structural horizontal
    for (let i = 0; i < this.simV; i++) {
      for (let j = 0; j < (this.simU - 1); j++) {
        this.addSpring((i * this.simU) + j, (i * this.simU) + j + 1, this.KS_STRUCT, this.KD_STRUCT)
      }
    }

    // Structural vertical
    for (let i = 0; i < this.simU; i++) {
      for (let j = 0; j < (this.simV - 1); j++) {
        this.addSpring((j * this.simU) + i, ((j + 1) * this.simU) + i, this.KS_STRUCT, this.KD_STRUCT)
      }
    }

    // Shear Springs
    for (let i = 0; i < (this.simV - 1); i++) {
      for (let j = 0; j < (this.simU - 1); j++) {
        this.addSpring((i * this.simU) + j, ((i + 1) * this.simU) + j + 1, this.KS_SHEAR, this.KD_SHEAR)
        this.addSpring(((i + 1) * this.simU) + j, (i * this.simU) + j + 1, this.KS_SHEAR, this.KD_SHEAR)
      }
    }

    // Bend Springs
    for (let i = 0; i < this.simV; i++) {
      for (let j = 0; j < (this.simU - 2); j++) {
        this.addSpring((i * this.simU) + j, (i * this.simU) + j + 2, this.KS_BEND, this.KD_BEND)
      }
      this.addSpring((i * this.simU) + (this.simU - 3), (i * this.simU) + (this.simU - 1), this.KS_BEND, this.KD_BEND)
    }

    for (let i = 0; i < this.simU; i++) {
      for (let j = 0; j < (this.simV - 2); j++)
        this.addSpring((j * this.simU) + i, ((j + 2) * this.simU) + i, this.KS_BEND, this.KD_BEND)
      this.addSpring(((this.simV - 3) * this.simU) + i, ((this.simV - 1) * this.simU) + i, this.KS_BEND, this.KD_BEND)
    }

    this.clothMesh.position.y = -1
    this.render()
  }

  // Draw axii
  private drawSceneGeometry(): void {
    const geoX = new THREE.Geometry()
    const geoY = new THREE.Geometry()
    const geoZ = new THREE.Geometry()

    geoX.vertices.push(new THREE.Vector3(0, 0, 0))
    geoX.vertices.push(new THREE.Vector3(2, 0, 0))
    geoY.vertices.push(new THREE.Vector3(0, 0, 0))
    geoY.vertices.push(new THREE.Vector3(0, 2, 0))
    geoZ.vertices.push(new THREE.Vector3(0, 0, 0))
    geoZ.vertices.push(new THREE.Vector3(0, 0, 2))

    const lineX = new THREE.Line(geoX, new THREE.LineBasicMaterial({ color: 0xb3e099, linewidth: 3 }))
    const lineY = new THREE.Line(geoY, new THREE.LineBasicMaterial({ color: 0x028f76, linewidth: 3 }))
    const lineZ = new THREE.Line(geoZ, new THREE.LineBasicMaterial({ color: 0xb3e099, linewidth: 3 }))

    this.scene.add(lineX)
    this.scene.add(lineY)
    this.scene.add(lineZ)

    //const planeGeo = new THREE.PlaneGeometry( -20, 20, 10, 10 )
    //const planeMat = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } )
    //const plane = new THREE.Mesh( planeGeo, planeMat )
    //plane.rotation.x = Math.PI / 2.0
    //this.scene.add( plane )
  }

  private computeForcesWithVerlet(): void {
    for (let i = 0; i < this.clothMesh.geometry.vertices.length; i++) {
      this.forces[i].x = 0
      this.forces[i].y = 0
      this.forces[i].z = 0

      let velocity = this.getVerletVelocity(this.clothMesh.geometry.vertices[i], this.lastGeometry.vertices[i])

      if (i !== 0 && i !== this.NUM_X)
        this.forces[i].add(this.GRAVITY)

      this.forces[i].add(velocity.multiplyScalar(this.DEFAULT_DAMPING))
    }

    // Spring forces
    const deltaP = new THREE.Vector3()
    const deltaV = new THREE.Vector3()

    for (let i = 0; i < this.springs.length; i++) {
      const p1 = this.clothMesh.geometry.vertices[this.springs[i].p1]
      const p2 = this.clothMesh.geometry.vertices[this.springs[i].p2]
      const p1Last = this.lastGeometry.vertices[this.springs[i].p1]
      const p2Last = this.lastGeometry.vertices[this.springs[i].p2]
      const v1 = this.getVerletVelocity(p1, p1Last)
      const v2 = this.getVerletVelocity(p2, p2Last)

      deltaP.subVectors(p1, p2)
      deltaV.subVectors(v1, v2)
      const dist = deltaP.length()

      //console.log("p1: "+p1+", p2: "+p2+" Dis: "+dist);
      const leftTerm  = -this.springs[i].ks * (dist - this.springs[i].restLength)
      const rightTerm = -this.springs[i].kd * ((deltaV.dot(deltaP)) / dist)
      const springForce = (deltaP.normalize()).multiplyScalar(leftTerm + rightTerm)

      if (this.springs[i].p1 !== 0 && this.springs[i].p1 !== this.NUM_X)
        this.forces[this.springs[i].p1].add(springForce)
      if (this.springs[i].p2 !== 0 && this.springs[i].p2 !== this.NUM_X )
        this.forces[this.springs[i].p2].sub(springForce)
    }
  }

  private getVerletVelocity(x_i: THREE.Vector3, xi_last: THREE.Vector3): THREE.Vector3 {
    let diff = new THREE.Vector3(0, 0, 0)
    diff.subVectors(x_i, xi_last)
    diff.multiplyScalar(1.0 / this.DT)
    return diff
  }

  private integrateVerlet(): void {
    const deltaTimeMass = (this.DT * this.DT) / this.MASS
    const N = this.clothMesh.geometry.vertices.length
    const oldP = this.clothMesh.geometry.vertices[N - 1].clone()
    this.clothMesh.geometry.verticesNeedUpdate = true
    this.clothMesh.geometry.normalsNeedUpdate = true

    for (let i = 0; i < N; i++) {
      let buffer = this.clothMesh.geometry.vertices[i].clone()

      let diff = new THREE.Vector3(0, 0, 0)
      diff.subVectors(this.clothMesh.geometry.vertices[i], this.lastGeometry.vertices[i])

      // vertex = vertex + (vertex - last_vertex) + deltaTime * force;
      const force = this.forces[i].clone()
      force.multiplyScalar(deltaTimeMass)

      this.clothMesh.geometry.vertices[i].add(diff)
      this.clothMesh.geometry.vertices[i].add(force)

      this.lastGeometry.vertices[i] = buffer

      if (this.clothMesh.geometry.vertices[i].y < 0) {
        this.clothMesh.geometry.vertices[i].y = 0
      }
    }

    let lastDiff = new THREE.Vector3(0, 0, 0)
    lastDiff.subVectors(oldP, this.clothMesh.geometry.vertices[N - 1])
    this.simulate = (lastDiff.lengthSq() > this.EPSILON2)
  }

  private stepPhysics(): void {
    //this.computeForces()
    this.computeForcesWithVerlet()
    console.log('Force: ' + this.forces[1].z + ' Vel: ' + this.velocities[1].z)
    //this.integrateEuler()
    this.integrateVerlet()
  }

  // Add Spring to data
  private addSpring(a, b, ks, kd): void {
    const deltaP = new THREE.Vector3()
    deltaP.subVectors(this.clothMesh.geometry.vertices[a], this.clothMesh.geometry.vertices[b])
    const restLength = deltaP.dot(deltaP)

    this.springs.push(new Spring(a, b, kd, ks, restLength))
  }

  private render() {
    requestAnimationFrame(() => {
      this.render()
    })

    if (this.simulate) {
      this.clothMesh.geometry.computeFaceNormals()
      this.clothMesh.geometry.computeVertexNormals()
      this.clothMesh.geometry.normalsNeedUpdate = true
      this.stepPhysics()
    }

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }
}

export default App
