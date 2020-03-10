import * as THREE from 'three';

var scene, camera, renderer;
var geometry, material, mesh;

init();
animate();

function init() {
    set_scene();
    set_camera();
    set_renderer();
    set_window();
    set_geometry();
    set_material();
    set_mesh();
    scene.add(mesh);
    camera.position.z = 5;
}

function set_camera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight,
        0.1, 1000);
}

function set_geometry() {
    geometry = new THREE.BoxGeometry();
}

function set_material() {
    material = new THREE.MeshBasicMaterial({color: 0x00ff00});
}

function set_mesh() {
    mesh = new THREE.Mesh(geometry, material);
}

function set_scene() {
    scene = new THREE.Scene();
}

function set_window() {
    window.addEventListener('resize', onWindowResize, false);
}

function set_renderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    
}