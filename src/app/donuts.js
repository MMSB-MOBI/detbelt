const THREE = require('three/build/three.module.js');
//import * as THREE from 'three/build/three.module.js';

/**
   * Add a hollow cylinder (pipe) to the scene
   * @param {!number[]} oCoor coordinates of the center of the base disc.
   * @param {!number} inneR inner radius of the pipe
   * @param {!number} outerR outer radius of pipe
   * @param {!number[]} oTranslate coordinates of the center of the top disc.
   * @param {!number} color hexadecimal color code for the texture.
   * @param {!object} scene THREE.js scene object.
   * @return { {object, object, object, object } } {geometry, material, mesh, scene} webGL pipe elements + scene.
   */
  function generatePipeAlong(oCoor, innerR, outerR, oTranslate, color, scene) {
    console.log("generatePipeALong");

    console.log("iCI",oCoor)
    console.log("iCII", innerR)
    console.log("iCIII", outerR)
    console.log("iCIV", oTranslate)
    console.log("iCV",  color)
    console.log("iCVI", scene)

    color = 0xffa500;

    const curvePath = new THREE.CatmullRomCurve3( [
        new THREE.Vector3( ...oCoor ),
        new THREE.Vector3( ...oTranslate ),
    ] );
    curvePath.closed = false;
    const arcShape = new THREE.Shape()
        .moveTo( 0, 0 )
        .absarc( 0, 0, outerR, 0, Math.PI * 2, false ); 
        /*
        .absarc ( x : Float, y : Float, radius : Float, startAngle : Float, endAngle : Float, clockwise : Boolean )
        x, y -- The absolute center of the arc.
        radius -- The radius of the arc.
        startAngle -- The start angle in radians.
        endAngle -- The end angle in radians.
        clockwise -- Sweep the arc clockwise. Defaults to false.
        */
    const holePath = new THREE.Path()
        .moveTo( 0, 0 )
        .absarc( 0, 0, innerR, 0, Math.PI * 2, true );
    arcShape.holes.push( holePath );
    const extrudeSettings = {
        steps: 100,
        bevelEnabled: false,
        extrudePath : curvePath
    };    
    const geometry = new THREE.ExtrudeGeometry( arcShape, extrudeSettings );
    const material = new THREE.MeshBasicMaterial( { color } ); //0xffa500
    const mesh = new THREE.Mesh( geometry, material ) ;
    if (scene != undefined)
        scene.addMesh( mesh );
   
    return ( { geometry, material, mesh, scene });
}

/**
   * Remove a hollow cylinder (pipe) from the scene
   * @param {!THREEJS.Geometry} geometry ExtrudeGeometry object of the pipe.
   * @param {!THREEJS.Material} material MeshBasicMaterial object of the pipe.
   * @param {!THREEJS.Mesh} mesh Mesh object of the pipe.
   * @param {!THREEJS.Scene} scene to remove the pipe from.
   * @return { void } 
   */
function removePipe({ geometry, material, mesh, scene }) {
    const d = scene.remove(mesh);
    console.dir(d);
    geometry.dispose();
    material.dispose();
}

module.exports = {
    generatePipeAlong,
    removePipe
}