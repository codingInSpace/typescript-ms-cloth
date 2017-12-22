CPU mass-spring model cloth simulation

live: https://codinginspace.github.io/typescript-ms-cloth/

### Develop
```bash
yarn
yarn start
```

### Changes to @types/three until upstream updates
Interface MeshPhongMaterialParameters
```typescript
envMap?: WebGLRenderTargetCube; //(not Texture)
```

Class Mesh:
```typescript
geometry: Geometry; //(not union BufferGeometry) 
```

